import {CE, IsString, E} from "js-vextensions";
import {ObservableMap, observable} from "mobx";
import {MobXPathGetterToPath, MobXPathGetterToPathSegments, PathOrPathGetterToPathSegments} from "../Utils/PathHelpers";
import {SplitStringBySlash_Cached} from "../Utils/StringSplitCache";
import {defaultFireOptions, FireOptions, Firelink} from "../Firelink";

export enum TreeNodeType {
	Root,
	Collection,
	Document,
}

export class PathSubscription {
	constructor(initialData: Partial<PathSubscription>) {
		CE(this).Extend(initialData);
	}
	unsubscribe: ()=>void;
}

export class TreeNode<DataShape> {
	constructor(fire: Firelink<any>, path: string) {
		this.fire = fire;
		this.path = path;
	}
	fire: Firelink<any>;
	path: string;
	get type() {
		if (this.path == null) return TreeNodeType.Root;
		let segments = SplitStringBySlash_Cached(this.path);
		//if (segments.length % 2 == 1) return TreeNodeType.Collection;
		if (IsPathForCollection(this.path)) return TreeNodeType.Collection;
		return TreeNodeType.Document;
	}
	subscriptions = [] as PathSubscription[];

	Subscribe() {
		if (this.subscriptions.length) return;

		if (IsPathForCollection(this.path)) {
			let unsubscribe = this.fire.subs.firestoreDB.collection(this.path).onSnapshot(function(snapshot) {
				let newData = {};
				for (let doc of snapshot.docs) {
					newData[doc.id] = doc.data();
				}
				this.data = observable(newData);
			});
			this.subscriptions.push(new PathSubscription({unsubscribe}));
		} else {
			let unsubscribe = this.fire.subs.firestoreDB.doc(this.path).onSnapshot(function(snapshot) {
				this.data = observable(snapshot.data());
			});
			this.subscriptions.push(new PathSubscription({unsubscribe}));
		}
	}

	// for the root node and collection nodes
	subs: ObservableMap<string, TreeNode<any>>;

	// for doc nodes
	data: DataShape;

	Get(subpathOrGetterFunc: string | ((data: DataShape)=>any), createTreeNodesIfMissing = true) {
		let subpathSegments = PathOrPathGetterToPathSegments(subpathOrGetterFunc);
		let result = this;
		for (let [index, segment] of subpathSegments.entries()) {
			if (result[segment] == null) {
				if (createTreeNodesIfMissing) {
					let pathToSegment = subpathSegments.slice(0, index).join("/");
					result[segment] = new TreeNode(this.fire, pathToSegment);
				} else {
					result = null;
					break;
				}
			}
			result = result[segment];
		}
		return result;
	}

	AsRawData(): DataShape {
		return TreeNodeToRawData(this);
	}
	UploadRawData(rawData: DataShape) {
		// todo
	}
}

export function IsPathForCollection(path: string) {
	return path.split("/").length % 2 == 1;
}
export function EnsurePathWatched(opt: FireOptions, path: string) {
	opt = E(defaultFireOptions, opt);
	let treeNode = opt.fire.tree.Get(path);
	if (treeNode.subscriptions.length) return;
	treeNode.Subscribe();
}

export function TreeNodeToRawData<DataShape>(treeNode: TreeNode<DataShape>) {
	let result = {};
	if (treeNode.data) {
		CE(result).Extend(treeNode.data);
	}
	CE(result)._AddItem("_path", treeNode.path);
	if (treeNode.subs) {
		let subNodes = Array.from(treeNode.subs.values());
		let subsAsRawData = subNodes.map(subNode=>TreeNodeToRawData(subNode));
		CE(result)._AddItem("_subs", subsAsRawData);
	}
	return result as DataShape;
}