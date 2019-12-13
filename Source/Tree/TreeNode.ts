import {Assert, CE, ToJSON} from "js-vextensions";
import {observable, ObservableMap, runInAction} from "mobx";
import {Filter} from "../Filters";
import {Firelink} from "../Firelink";
import {PathOrPathGetterToPath, PathOrPathGetterToPathSegments} from "../Utils/PathHelpers";
import {ProcessDBData} from "../Utils/DatabaseHelpers";

export enum TreeNodeType {
	Root,
	Collection,
	CollectionQuery,
	Document,
}

export enum DataStatus {
	Initial,
	Waiting,
	Received,
}

export class PathSubscription {
	constructor(unsubscribe: ()=>void) {
		this.unsubscribe = unsubscribe;
	}
	unsubscribe: ()=>void;
}

export class QueryRequest {
	constructor(initialData?: Partial<QueryRequest>) {
		CE(this).Extend(initialData);
	}
	filters: Filter[];
	Apply(collection: firebase.firestore.CollectionReference) {
		let result = collection;
		for (let filter of this.filters) {
			result = filter.Apply(result);
		}
		return result;
	}

	toString() {
		return ToJSON(this.filters);
	}
}

export class TreeNode<DataShape> {
	constructor(fire: Firelink<any ,any>, pathOrSegments: string | string[]) {
		this.fire = fire;
		this.path = PathOrPathGetterToPath(pathOrSegments);
		this.pathSegments = PathOrPathGetterToPathSegments(pathOrSegments);
		Assert(this.pathSegments.find(a=>a == null || a.trim().length == 0) == null, `Path segments cannot be null/empty. @pathSegments(${this.pathSegments})`);
		this.type = GetTreeNodeTypeForPath(this.pathSegments);
	}
	fire: Firelink<any, any>;
	path: string;
	pathSegments: string[];
	type: TreeNodeType;

	Request() {
		this.fire.treeRequestWatchers.forEach(a=>a.nodesRequested.add(this));
		if (!this.subscription) {
			this.Subscribe();
		}
	}
	Subscribe() {
		Assert(this.subscription == null, "Cannot subscribe more than once!");
		runInAction("TreeNode.Subscribe_prep", ()=>this.status = DataStatus.Waiting);
		if (this.type == TreeNodeType.Root || this.type == TreeNodeType.Document) {
			let docRef = this.fire.subs.firestoreDB.doc(this.path);
			this.subscription = new PathSubscription(docRef.onSnapshot((snapshot)=> {
				runInAction("TreeNode.Subscribe.onSnapshot_doc", ()=> {
					this.SetData(snapshot.data() as any);
				});
			}));
		} else {
			let collectionRef = this.fire.subs.firestoreDB.collection(this.path);
			if (this.query) {
				collectionRef = this.query.Apply(collectionRef);
			}
			this.subscription = new PathSubscription(collectionRef.onSnapshot((snapshot)=> {
				/*let newData = {};
				for (let doc of snapshot.docs) {
					newData[doc.id] = doc.data();
				}
				this.data = observable(newData) as any;*/
				runInAction("TreeNode.Subscribe.onSnapshot_collection", ()=> {
					for (let doc of snapshot.docs) {
						if (!this.docNodes.has(doc.id)) {
							this.docNodes.set(doc.id, new TreeNode(this.fire, this.pathSegments.concat([doc.id])));
						}
						this.docNodes.get(doc.id).SetData(doc.data());
					}
					this.status = DataStatus.Received;
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
	subscription: PathSubscription;

	// for doc (and root) nodes
	@observable collectionNodes = observable.map<string, TreeNode<any>>();
	//collectionNodes = new Map<string, TreeNode<any>>();
	@observable.ref data: DataShape;
	SetData(data: DataShape) {
		//data = data ? observable(data_raw) as any : null;
		ProcessDBData(data, true, true, CE(this.pathSegments).Last()); // maybe rework
		this.data = data;
		if (data != null) {
			//ProcessDBData(this.data, true, true, CE(this.pathSegments).Last()); // also add to proxy (since the mobx proxy doesn't expose non-enumerable props) // maybe rework
			this.status = DataStatus.Received;
		} else {
			// entry was deleted; reset status to "initial"
			this.status = DataStatus.Initial;
		}
	}

	// for collection (and collection-query) nodes
	@observable queryNodes = observable.map<string, TreeNode<any>>(); // for collection nodes
	//queryNodes = new Map<string, TreeNode<any>>(); // for collection nodes
	query: QueryRequest; // for collection-query nodes
	@observable docNodes = observable.map<string, TreeNode<any>>();
	//docNodes = new Map<string, TreeNode<any>>();
	get docDatas() {
		let docNodes = Array.from(this.docNodes.values()).filter(a=>a.status == DataStatus.Received);
		let docDatas = docNodes.map(docNode=>docNode.data);
		//let docDatas = observable.array(docNodes.map(docNode=>docNode.data));
		return docDatas;
	}

	Get(subpathOrGetterFunc: string | string[] | ((data: DataShape)=>any), query?: QueryRequest, createTreeNodesIfMissing = true) {
		let subpathSegments = PathOrPathGetterToPathSegments(subpathOrGetterFunc);
		let currentNode: TreeNode<any>;

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
				currentNode = childNodesMap.get(segment);
				if (currentNode == null) break;
			}
			if (query) {
				if (!currentNode.queryNodes.has(query.toString()) && createTreeNodesIfMissing) {
					if (!inAction) return proceed_inAction(); // if not yet running in action, restart in one
					currentNode.queryNodes.set(query.toString(), new TreeNode(this.fire, this.pathSegments.concat(subpathSegments).concat("@query:")))
				}
				currentNode = currentNode.queryNodes.get(query.toString());
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
	if (treeNode.data) {
		CE(result).Extend(treeNode.data);
	}
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