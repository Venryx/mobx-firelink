import {Assert, CE, ToJSON} from "js-vextensions";
import {observable, ObservableMap} from "mobx";
import {Filter} from "../Filters";
import {Firelink} from "../Firelink";
import {PathOrPathGetterToPath, PathOrPathGetterToPathSegments} from "../Utils/PathHelpers";

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
		this.status = DataStatus.Waiting;
		if (this.type == TreeNodeType.Root || this.type == TreeNodeType.Document) {
			let docRef = this.fire.subs.firestoreDB.doc(this.path);
			this.subscription = new PathSubscription(docRef.onSnapshot(function(snapshot) {
				let data_raw = snapshot.data();
				this.data = data_raw ? observable(data_raw) : null;
				this.status = DataStatus.Received;
			}));
		} else {
			let collectionRef = this.fire.subs.firestoreDB.collection(this.path);
			if (this.query) {
				collectionRef = this.query.Apply(collectionRef);
			}
			this.subscription = new PathSubscription(collectionRef.onSnapshot(function(snapshot) {
				let newData = {};
				for (let doc of snapshot.docs) {
					newData[doc.id] = doc.data();
				}
				this.data = observable(newData);
				this.status = DataStatus.Received;
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

	status = DataStatus.Initial;
	subscription: PathSubscription;
	/*get childNodes() {
		if (this.type == TreeNodeType.Collection || this.type == TreeNodeType.CollectionQuery) return this.docNodes;
		return this.collectionNodes;
	}*/

	// for doc (and root) nodes
	collectionNodes = observable.map<string, TreeNode<any>>();
	data: DataShape;

	// for collection (and collection-query) nodes
	queryNodes = observable.map<string, TreeNode<any>>(); // for collection nodes
	query: QueryRequest// for collection-query nodes
	docNodes = observable.map<string, TreeNode<any>>();

	Get(subpathOrGetterFunc: string | string[] | ((data: DataShape)=>any), query?: QueryRequest, createTreeNodesIfMissing = true) {
		let subpathSegments = PathOrPathGetterToPathSegments(subpathOrGetterFunc);
		let currentNode: TreeNode<any> = this;
		for (let [index, segment] of subpathSegments.entries()) {
			let subpathSegmentsToHere = subpathSegments.slice(0, index);
			let childNodesMap = currentNode[currentNode.type == TreeNodeType.Collection ? "docNodes" : "collectionNodes"] as ObservableMap<string, TreeNode<any>>;
			if (!childNodesMap.has(segment) && createTreeNodesIfMissing) {
				//let pathToSegment = subpathSegments.slice(0, index).join("/");
				childNodesMap.set(segment, new TreeNode(this.fire, this.pathSegments.concat(subpathSegmentsToHere)));
			}
			currentNode = childNodesMap.get(segment);
			if (currentNode == null) break;
		}
		if (query) {
			if (!currentNode.queryNodes.has(query.toString()) && createTreeNodesIfMissing) {
				currentNode.queryNodes.set(query.toString(), new TreeNode(this.fire, this.pathSegments.concat(subpathSegments).concat("@query:")))
			}
			currentNode = currentNode.queryNodes.get(query.toString());
		}
		return currentNode;
	}

	AsRawData(): DataShape {
		return TreeNodeToRawData(this);
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

export function TreeNodeToRawData<DataShape>(treeNode: TreeNode<DataShape>) {
	let result = {};
	if (treeNode.data) {
		CE(result).Extend(treeNode.data);
	}
	CE(result)._AddItem("_path", treeNode.path);
	if (treeNode.docNodes) {
		let docsAsRawData = Array.from(treeNode.docNodes.values()).map(docNode=>TreeNodeToRawData(docNode));
		CE(result)._AddItem("_subs", docsAsRawData);
	}
	return result as DataShape;
}