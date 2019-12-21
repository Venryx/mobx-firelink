var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Assert, CE, ToJSON, FromJSON } from "js-vextensions";
import { observable, runInAction } from "mobx";
import { Filter } from "../Filters";
import { PathOrPathGetterToPath, PathOrPathGetterToPathSegments } from "../Utils/PathHelpers";
import { ProcessDBData } from "../Utils/DatabaseHelpers";
import { _getGlobalState } from "mobx";
import { nil } from "../Utils/Nil";
import { MaybeLog_Base } from "../Utils/General";
export var TreeNodeType;
(function (TreeNodeType) {
    TreeNodeType[TreeNodeType["Root"] = 0] = "Root";
    TreeNodeType[TreeNodeType["Collection"] = 1] = "Collection";
    TreeNodeType[TreeNodeType["CollectionQuery"] = 2] = "CollectionQuery";
    TreeNodeType[TreeNodeType["Document"] = 3] = "Document";
})(TreeNodeType || (TreeNodeType = {}));
export var DataStatus;
(function (DataStatus) {
    DataStatus[DataStatus["Initial"] = 0] = "Initial";
    DataStatus[DataStatus["Waiting"] = 1] = "Waiting";
    DataStatus[DataStatus["Received_Cache"] = 2] = "Received_Cache";
    DataStatus[DataStatus["Received_Full"] = 3] = "Received_Full";
})(DataStatus || (DataStatus = {}));
export class PathSubscription {
    constructor(unsubscribe) {
        this.unsubscribe = unsubscribe;
    }
}
export class QueryRequest {
    constructor(initialData) {
        this.filters = [];
        CE(this).Extend(initialData);
    }
    static ParseString(dataStr) {
        return QueryRequest.ParseData(FromJSON(dataStr));
    }
    static ParseData(data) {
        let result = new QueryRequest({});
        for (let filterData of data.filters) {
            result.filters.push(Filter.ParseData(filterData));
        }
        return result;
    }
    Apply(collection) {
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
export class TreeNode {
    constructor(fire, pathOrSegments) {
        var _a;
        this.status = DataStatus.Initial;
        // for doc (and root) nodes
        this.collectionNodes = observable.map();
        // for collection (and collection-query) nodes
        this.queryNodes = observable.map(); // for collection nodes
        this.docNodes = observable.map();
        this.fire = fire;
        this.pathSegments = PathOrPathGetterToPathSegments(pathOrSegments);
        this.path = PathOrPathGetterToPath(pathOrSegments);
        const queryStr = ((_a = this.pathSegments.slice(-1)[0]) === null || _a === void 0 ? void 0 : _a.startsWith("@query:")) ? this.pathSegments.slice(-1)[0].substr("@query:".length) : null;
        this.path_noQuery = queryStr ? this.pathSegments.slice(0, -1).join("/") : this.path;
        Assert(this.pathSegments.find(a => a == null || a.trim().length == 0) == null, `Path segments cannot be null/empty. @pathSegments(${this.pathSegments})`);
        this.type = GetTreeNodeTypeForPath(this.pathSegments);
        this.query = queryStr ? QueryRequest.ParseString(queryStr) : nil;
    }
    Request() {
        this.fire.treeRequestWatchers.forEach(a => a.nodesRequested.add(this));
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
        runInAction("TreeNode.Subscribe_prep", () => this.status = DataStatus.Waiting);
        MaybeLog_Base(a => a.subscriptions, () => `Subscribing to: ${this.path}`);
        if (this.type == TreeNodeType.Root || this.type == TreeNodeType.Document) {
            let docRef = this.fire.subs.firestoreDB.doc(this.path);
            this.subscription = new PathSubscription(docRef.onSnapshot({ includeMetadataChanges: true }, (snapshot) => {
                MaybeLog_Base(a => a.subscriptions, l => l(`Got doc snapshot. @path(${this.path}) @snapshot:`, snapshot));
                runInAction("TreeNode.Subscribe.onSnapshot_doc", () => {
                    this.SetData(snapshot.data(), snapshot.metadata.fromCache);
                });
            }));
        }
        else {
            let collectionRef = this.fire.subs.firestoreDB.collection(this.path_noQuery);
            if (this.query) {
                collectionRef = this.query.Apply(collectionRef);
            }
            this.subscription = new PathSubscription(collectionRef.onSnapshot({ includeMetadataChanges: true }, (snapshot) => {
                MaybeLog_Base(a => a.subscriptions, l => l(`Got collection snapshot. @path(${this.path}) @snapshot:`, snapshot));
                /*let newData = {};
                for (let doc of snapshot.docs) {
                    newData[doc.id] = doc.data();
                }
                this.data = observable(newData) as any;*/
                runInAction("TreeNode.Subscribe.onSnapshot_collection", () => {
                    for (let doc of snapshot.docs) {
                        if (!this.docNodes.has(doc.id)) {
                            this.docNodes.set(doc.id, new TreeNode(this.fire, this.pathSegments.concat([doc.id])));
                        }
                        this.docNodes.get(doc.id).SetData(doc.data(), snapshot.metadata.fromCache);
                    }
                    this.status = snapshot.metadata.fromCache ? DataStatus.Received_Cache : DataStatus.Received_Full;
                    // fix for possible bug; when queries are used, an onSnapshot listener only gives the single {fromCache:true} snapshot (leaving out the follow-up {fromCache:false} snapshot)
                    /*if (this.query && this.status == DataStatus.Received_Cache) {
                        this.status = DataStatus.Received_Full;
                    }*/
                });
            }));
        }
    }
    Unsubscribe() {
        if (this.subscription == null)
            return null;
        let subscription = this.subscription;
        this.subscription.unsubscribe();
        this.subscription = null;
        return subscription;
    }
    UnsubscribeAll() {
        this.Unsubscribe();
        this.collectionNodes.forEach(a => a.UnsubscribeAll());
        this.queryNodes.forEach(a => a.UnsubscribeAll());
        this.docNodes.forEach(a => a.UnsubscribeAll());
    }
    SetData(data, fromCache) {
        //data = data ? observable(data_raw) as any : null;
        ProcessDBData(data, true, true, CE(this.pathSegments).Last()); // maybe rework
        this.data = data;
        //if (data != null) {
        //ProcessDBData(this.data, true, true, CE(this.pathSegments).Last()); // also add to proxy (since the mobx proxy doesn't expose non-enumerable props) // maybe rework
        this.status = fromCache ? DataStatus.Received_Cache : DataStatus.Received_Full;
        /*} else {
            // entry was deleted; reset status to "initial"
            this.status = DataStatus.Initial;
        }*/
    }
    //docNodes = new Map<string, TreeNode<any>>();
    get docDatas() {
        let docNodes = Array.from(this.docNodes.values()).filter(a => a.status == DataStatus.Received_Full);
        let docDatas = docNodes.map(docNode => docNode.data);
        //let docDatas = observable.array(docNodes.map(docNode=>docNode.data));
        return docDatas;
    }
    // default createTreeNodesIfMissing to false, so that it's safe to call this from a computation (which includes store-accessors)
    Get(subpathOrGetterFunc, query, createTreeNodesIfMissing = false) {
        let subpathSegments = PathOrPathGetterToPathSegments(subpathOrGetterFunc);
        let currentNode = this;
        let proceed_inAction = () => runInAction(`TreeNode.Get @path(${this.path})`, () => proceed(true));
        let proceed = (inAction) => {
            currentNode = this;
            for (let [index, segment] of subpathSegments.entries()) {
                let subpathSegmentsToHere = subpathSegments.slice(0, index + 1);
                let childNodesMap = currentNode[currentNode.type == TreeNodeType.Collection ? "docNodes" : "collectionNodes"];
                if (!childNodesMap.has(segment) && createTreeNodesIfMissing) {
                    if (!inAction)
                        return proceed_inAction(); // if not yet running in action, restart in one
                    //let pathToSegment = subpathSegments.slice(0, index).join("/");
                    childNodesMap.set(segment, new TreeNode(this.fire, this.pathSegments.concat(subpathSegmentsToHere)));
                }
                currentNode = childNodesMap.get(segment);
                if (currentNode == null)
                    break;
            }
            if (query && currentNode) {
                if (!currentNode.queryNodes.has(query.toString()) && createTreeNodesIfMissing) {
                    if (!inAction)
                        return proceed_inAction(); // if not yet running in action, restart in one
                    currentNode.queryNodes.set(query.toString(), new TreeNode(this.fire, this.pathSegments.concat(subpathSegments).concat("@query:" + query)));
                }
                currentNode = currentNode.queryNodes.get(query.toString());
            }
        };
        // first, try proceeding without runInAction 
        proceed(false);
        return currentNode;
    }
    get raw() { return this.AsRawData(); } // helper for in console
    AsRawData(addTreeLink = true) {
        return TreeNodeToRawData(this, addTreeLink);
    }
    UploadRawData(rawData) {
        // todo
    }
}
__decorate([
    observable
], TreeNode.prototype, "status", void 0);
__decorate([
    observable
], TreeNode.prototype, "collectionNodes", void 0);
__decorate([
    observable.ref
], TreeNode.prototype, "data", void 0);
__decorate([
    observable
], TreeNode.prototype, "queryNodes", void 0);
__decorate([
    observable
], TreeNode.prototype, "docNodes", void 0);
export function GetTreeNodeTypeForPath(pathOrSegments) {
    let pathSegments = PathOrPathGetterToPathSegments(pathOrSegments);
    if (pathSegments == null || pathSegments.length == 0)
        return TreeNodeType.Root;
    if (CE(pathSegments).Last().startsWith("@query:"))
        return TreeNodeType.CollectionQuery;
    return pathSegments.length % 2 == 1 ? TreeNodeType.Collection : TreeNodeType.Document;
}
/*export function EnsurePathWatched(opt: FireOptions, path: string, filters?: Filter[]) {
    opt = E(defaultFireOptions, opt);
    let treeNode = opt.fire.tree.Get(path);
    if (treeNode.subscriptions.length) return;
    treeNode.Subscribe(filters ? new QueryRequest({filters}) : null);
}*/
export function TreeNodeToRawData(treeNode, addTreeLink = true) {
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
    return result;
}
//# sourceMappingURL=TreeNode.js.map