import {Assert, CE, ToJSON, WaitXThenRun, FromJSON, ObjectCE} from "js-vextensions";
import {observable, ObservableMap, runInAction} from "mobx";
import {Filter} from "../Filters";
import {Firelink} from "../Firelink";
import {PathOrPathGetterToPath, PathOrPathGetterToPathSegments} from "../Utils/PathHelpers";
import {ProcessDBData} from "../Utils/DatabaseHelpers";
import {_getGlobalState} from "mobx";
import {nil} from "../Utils/Nil";
import {MaybeLog_Base} from "../Utils/General";

export enum TreeNodeType {
	Root,
	Collection,
	CollectionQuery,
	Document,
}

export enum DataStatus {
	Initial,
	Waiting,
	Received_Cache,
	Received_Full,
}

export class PathSubscription {
	constructor(unsubscribe: ()=>void) {
		this.unsubscribe = unsubscribe;
	}
	unsubscribe: ()=>void;
}

export class QueryRequest {
	static ParseString(dataStr: string) {
		return QueryRequest.ParseData(FromJSON(dataStr));
	}
	static ParseData(data: any) {
		let result = new QueryRequest({});
		for (let filterData of data.filters) {
			result.filters.push(Filter.ParseData(filterData));
		}
		return result
	}

	constructor(initialData?: Partial<QueryRequest>) {
		CE(this).Extend(initialData);
	}
	filters = [] as Filter[];
	Apply(collection: firebase.firestore.CollectionReference) {
		let result = collection;
		for (let filter of this.filters) {
			result = filter.Apply(result);
		}
		return result;
	}

	toString() {
		return ToJSON(this);
	}
}

export class TreeNode<DataShape> {
	constructor(fire: Firelink<any, any>, pathOrSegments: string | string[]) {
		this.fire = fire;
		this.pathSegments = PathOrPathGetterToPathSegments(pathOrSegments);
		this.path = PathOrPathGetterToPath(pathOrSegments)!;
		const queryStr = this.pathSegments.slice(-1)[0]?.startsWith("@query:") ? this.pathSegments.slice(-1)[0].substr("@query:".length) : null;
		this.pathSegments_noQuery = this.pathSegments.filter(a=>!a.startsWith("@query:"));
		this.path_noQuery = this.pathSegments_noQuery.join("/");
		Assert(this.pathSegments.find(a=>a == null || a.trim().length == 0) == null, `Path segments cannot be null/empty. @pathSegments(${this.pathSegments})`);
		this.type = GetTreeNodeTypeForPath(this.pathSegments);
		this.query = queryStr ? QueryRequest.ParseString(queryStr) : nil;
	}
	fire: Firelink<any, any>;
	pathSegments: string[];
	pathSegments_noQuery: string[];
	path: string;
	path_noQuery: string;
	type: TreeNodeType;

	Request() {
		this.fire.treeRequestWatchers.forEach(a=>a.nodesRequested.add(this));
		if (!this.subscription) {
			this.Subscribe();
		}
	}
	Subscribe() {
		Assert(this.subscription == null, "Cannot subscribe more than once!");

		// old: wait till call-stack completes, so we don't violate "can't change observables from within computation" rule
		// we can't change observables from within computed values/funcs/store-accessors, so do it in a moment (out of computation call-stack)
		/*WaitXThenRun(0, ()=> {
			runInAction("TreeNode.Subscribe_prep", ()=>this.status = DataStatus.Waiting);
		});*/
		Assert(_getGlobalState().computationDepth == 0, "Cannot call TreeNode.Subscribe from within a computation.");
		runInAction("TreeNode.Subscribe_prep", ()=>this.status = DataStatus.Waiting);

		MaybeLog_Base(a=>a.subscriptions, ()=>`Subscribing to: ${this.path}`);
		if (this.type == TreeNodeType.Root || this.type == TreeNodeType.Document) {
			let docRef = this.fire.subs.firestoreDB.doc(this.path_noQuery);
			this.subscription = new PathSubscription(docRef.onSnapshot({includeMetadataChanges: true}, (snapshot)=> {
				MaybeLog_Base(a=>a.subscriptions, l=>l(`Got doc snapshot. @path(${this.path}) @snapshot:`, snapshot));
				runInAction("TreeNode.Subscribe.onSnapshot_doc", ()=> {
					this.SetData(snapshot.data() as any, snapshot.metadata.fromCache);
				});
			}));
		} else {
			let collectionRef = this.fire.subs.firestoreDB.collection(this.path_noQuery);
			if (this.query) {
				collectionRef = this.query.Apply(collectionRef);
			}
			this.subscription = new PathSubscription(collectionRef.onSnapshot({includeMetadataChanges: true}, (snapshot)=> {
				MaybeLog_Base(a=>a.subscriptions, l=>l(`Got collection snapshot. @path(${this.path}) @snapshot:`, snapshot));
				/*let newData = {};
				for (let doc of snapshot.docs) {
					newData[doc.id] = doc.data();
				}
				this.data = observable(newData) as any;*/
				runInAction("TreeNode.Subscribe.onSnapshot_collection", ()=> {
					let deletedDocIDs = CE(Array.from(this.docNodes.keys())).Except(...snapshot.docs.map(a=>a.id));
					for (let doc of snapshot.docs) {
						if (!this.docNodes.has(doc.id)) {
							this.docNodes.set(doc.id, new TreeNode(this.fire, this.pathSegments.concat([doc.id])));
						}
						this.docNodes.get(doc.id)!.SetData(doc.data(), snapshot.metadata.fromCache);
					}
					for (let docID of deletedDocIDs) {
						let docNode = this.docNodes.get(docID);
						docNode?.SetData(null, snapshot.metadata.fromCache);
						//docNode?.Unsubscribe(); // if someone subscribed directly, I guess we let them keep the detached subscription?
						this.docNodes.delete(docID);
					}
					this.status = snapshot.metadata.fromCache ? DataStatus.Received_Cache : DataStatus.Received_Full;
				});
			}));
		}
	}
	Unsubscribe() {
		if (this.subscription == null) return null;
		let subscription = this.subscription;
		this.subscription.unsubscribe();
		this.subscription = null;
		return subscription;
	}
	UnsubscribeAll() {
		this.Unsubscribe();
		this.collectionNodes.forEach(a=>a.UnsubscribeAll());
		this.queryNodes.forEach(a=>a.UnsubscribeAll());
		this.docNodes.forEach(a=>a.UnsubscribeAll());
	}

	@observable status = DataStatus.Initial;
	subscription: PathSubscription|null;

	// for doc (and root) nodes
	@observable collectionNodes = observable.map<string, TreeNode<any>>();
	//collectionNodes = new Map<string, TreeNode<any>>();
	@observable.ref data: DataShape;
	dataJSON: string;
	SetData(data: DataShape, fromCache: boolean) {
		// this.data being "undefined" is used to signify that it's still loading; so if firebase-given value is "undefined", change it to "null"
		if (data === undefined) {
			data = null as any;
		}

		let dataJSON = ToJSON(data);
		// only replace this.data, if new data differs by deep-comparison (Firestore apparently re-pushes db-content to listeners every 30m or so, which otherwise causes unnecessary cache-breaking and UI updating)
		if (dataJSON != this.dataJSON) {
			//data = data ? observable(data_raw) as any : null;
			ProcessDBData(data, true, CE(this.pathSegments).Last()); // maybe rework
			this.data = data;
			this.dataJSON = dataJSON;
		}

		//if (data != null) {
		//ProcessDBData(this.data, true, true, CE(this.pathSegments).Last()); // also add to proxy (since the mobx proxy doesn't expose non-enumerable props) // maybe rework
		this.status = fromCache ? DataStatus.Received_Cache : DataStatus.Received_Full;
		/*} else {
			// entry was deleted; reset status to "initial"
			this.status = DataStatus.Initial;
		}*/
	}

	// for collection (and collection-query) nodes
	@observable queryNodes = observable.map<string, TreeNode<any>>(); // for collection nodes
	//queryNodes = new Map<string, TreeNode<any>>(); // for collection nodes
	query?: QueryRequest; // for collection-query nodes
	@observable docNodes = observable.map<string, TreeNode<any>>();
	//docNodes = new Map<string, TreeNode<any>>();
	get docDatas() {
		// (we need to filter for nodes where data is not nully, since such entries get added by GetDoc(...) calls for non-existent paths, but shouldn't show in docDatas array)
		let docNodes = Array.from(this.docNodes.values()).filter(a=>a.status == DataStatus.Received_Full && a.data != null);
		let docDatas = docNodes.map(docNode=>docNode.data);
		//let docDatas = observable.array(docNodes.map(docNode=>docNode.data));
		return docDatas;
	}

	// default createTreeNodesIfMissing to false, so that it's safe to call this from a computation (which includes store-accessors)
	Get(subpathOrGetterFunc: string | string[] | ((data: DataShape)=>any), query?: QueryRequest, createTreeNodesIfMissing = false): TreeNode<any>|null {
		let subpathSegments = PathOrPathGetterToPathSegments(subpathOrGetterFunc);
		let currentNode: TreeNode<any> = this;

		let proceed_inAction = ()=>runInAction(`TreeNode.Get @path(${this.path})`, ()=>proceed(true));
		let proceed = (inAction: boolean)=> {
			currentNode = this;
			for (let [index, segment] of subpathSegments.entries()) {
				let subpathSegmentsToHere = subpathSegments.slice(0, index + 1);
				let childNodesMap = currentNode[currentNode.type == TreeNodeType.Collection ? "docNodes" : "collectionNodes"] as ObservableMap<string, TreeNode<any>>;
				if (!childNodesMap.has(segment) && createTreeNodesIfMissing) {
					if (!inAction) return proceed_inAction(); // if not yet running in action, restart in one
					//let pathToSegment = subpathSegments.slice(0, index).join("/");
					childNodesMap.set(segment, new TreeNode(this.fire, this.pathSegments.concat(subpathSegmentsToHere)));
				}
				currentNode = childNodesMap.get(segment)!;
				if (currentNode == null) break;
			}
			if (query && currentNode) {
				if (!currentNode.queryNodes.has(query.toString()) && createTreeNodesIfMissing) {
					if (!inAction) return proceed_inAction(); // if not yet running in action, restart in one
					currentNode.queryNodes.set(query.toString(), new TreeNode(this.fire, this.pathSegments.concat(subpathSegments).concat("@query:" + query)))
				}
				currentNode = currentNode.queryNodes.get(query.toString())!;
			}
		}
		// first, try proceeding without runInAction 
		proceed(false);

		return currentNode;
	}

	get raw() { return this.AsRawData(); } // helper for in console
	AsRawData(addTreeLink = true): DataShape {
		return TreeNodeToRawData(this, addTreeLink);
	}
	UploadRawData(rawData: DataShape) {
		// todo
	}
}

export function GetTreeNodeTypeForPath(pathOrSegments: string | string[]) {
	let pathSegments = PathOrPathGetterToPathSegments(pathOrSegments);
	if (pathSegments == null || pathSegments.length == 0) return TreeNodeType.Root;
	if (CE(pathSegments).Last().startsWith("@query:")) return TreeNodeType.CollectionQuery;
	return pathSegments.length % 2 == 1 ? TreeNodeType.Collection : TreeNodeType.Document;
}
/*export function EnsurePathWatched(opt: FireOptions, path: string, filters?: Filter[]) {
	opt = E(defaultFireOptions, opt);
	let treeNode = opt.fire.tree.Get(path);
	if (treeNode.subscriptions.length) return;
	treeNode.Subscribe(filters ? new QueryRequest({filters}) : null);
}*/

export function TreeNodeToRawData<DataShape>(treeNode: TreeNode<DataShape>, addTreeLink = true) {
	let result = {};
	if (addTreeLink) {
		CE(result)._AddItem("_node", treeNode);
	}
	CE(result)._AddItem("_path", treeNode.path);
	/*if (treeNode.data) {
		CE(result).Extend(treeNode.data);
	}*/
	result["data"] = treeNode.data;
	for (let [key, collection] of treeNode.collectionNodes) {
		result[key] = TreeNodeToRawData(collection);
	}
	/*if (treeNode.docNodes) {
		let docsAsRawData = Array.from(treeNode.docNodes.values()).map(docNode=>TreeNodeToRawData(docNode));
		CE(result)._AddItem("_subs", docsAsRawData);
	}*/
	for (let [key, doc] of treeNode.docNodes) {
		result[key] = TreeNodeToRawData(doc);
	}
	return result as DataShape;
}