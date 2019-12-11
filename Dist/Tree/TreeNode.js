"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const js_vextensions_1 = require("js-vextensions");
const mobx_1 = require("mobx");
const PathHelpers_1 = require("../Utils/PathHelpers");
const DatabaseHelpers_1 = require("../Utils/DatabaseHelpers");
var TreeNodeType;
(function (TreeNodeType) {
    TreeNodeType[TreeNodeType["Root"] = 0] = "Root";
    TreeNodeType[TreeNodeType["Collection"] = 1] = "Collection";
    TreeNodeType[TreeNodeType["CollectionQuery"] = 2] = "CollectionQuery";
    TreeNodeType[TreeNodeType["Document"] = 3] = "Document";
})(TreeNodeType = exports.TreeNodeType || (exports.TreeNodeType = {}));
var DataStatus;
(function (DataStatus) {
    DataStatus[DataStatus["Initial"] = 0] = "Initial";
    DataStatus[DataStatus["Waiting"] = 1] = "Waiting";
    DataStatus[DataStatus["Received"] = 2] = "Received";
})(DataStatus = exports.DataStatus || (exports.DataStatus = {}));
class PathSubscription {
    constructor(unsubscribe) {
        this.unsubscribe = unsubscribe;
    }
}
exports.PathSubscription = PathSubscription;
class QueryRequest {
    constructor(initialData) {
        js_vextensions_1.CE(this).Extend(initialData);
    }
    Apply(collection) {
        let result = collection;
        for (let filter of this.filters) {
            result = filter.Apply(result);
        }
        return result;
    }
    toString() {
        return js_vextensions_1.ToJSON(this.filters);
    }
}
exports.QueryRequest = QueryRequest;
class TreeNode {
    constructor(fire, pathOrSegments) {
        this.status = DataStatus.Initial;
        /*get childNodes() {
            if (this.type == TreeNodeType.Collection || this.type == TreeNodeType.CollectionQuery) return this.docNodes;
            return this.collectionNodes;
        }*/
        // for doc (and root) nodes
        this.collectionNodes = mobx_1.observable.map();
        // for collection (and collection-query) nodes
        this.queryNodes = mobx_1.observable.map(); // for collection nodes
        this.docNodes = mobx_1.observable.map();
        this.fire = fire;
        this.path = PathHelpers_1.PathOrPathGetterToPath(pathOrSegments);
        this.pathSegments = PathHelpers_1.PathOrPathGetterToPathSegments(pathOrSegments);
        js_vextensions_1.Assert(this.pathSegments.find(a => a == null || a.trim().length == 0) == null, `Path segments cannot be null/empty. @pathSegments(${this.pathSegments})`);
        this.type = GetTreeNodeTypeForPath(this.pathSegments);
    }
    Request() {
        this.fire.treeRequestWatchers.forEach(a => a.nodesRequested.add(this));
        if (!this.subscription) {
            this.Subscribe();
        }
    }
    Subscribe() {
        js_vextensions_1.Assert(this.subscription == null, "Cannot subscribe more than once!");
        this.status = DataStatus.Waiting;
        if (this.type == TreeNodeType.Root || this.type == TreeNodeType.Document) {
            let docRef = this.fire.subs.firestoreDB.doc(this.path);
            this.subscription = new PathSubscription(docRef.onSnapshot((snapshot) => {
                mobx_1.runInAction("TreeNode.Subscribe.onSnapshot_doc", () => {
                    this.SetData(snapshot.data());
                });
            }));
        }
        else {
            let collectionRef = this.fire.subs.firestoreDB.collection(this.path);
            if (this.query) {
                collectionRef = this.query.Apply(collectionRef);
            }
            this.subscription = new PathSubscription(collectionRef.onSnapshot((snapshot) => {
                /*let newData = {};
                for (let doc of snapshot.docs) {
                    newData[doc.id] = doc.data();
                }
                this.data = observable(newData) as any;*/
                mobx_1.runInAction("TreeNode.Subscribe.onSnapshot_collection", () => {
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
    SetData(data) {
        //data = data ? observable(data_raw) as any : null;
        DatabaseHelpers_1.ProcessDBData(data, true, true, js_vextensions_1.CE(this.pathSegments).Last()); // maybe rework
        this.data = data;
        //ProcessDBData(this.data, true, true, CE(this.pathSegments).Last()); // also add to proxy (since the mobx proxy doesn't expose non-enumerable props) // maybe rework
        this.status = DataStatus.Received;
    }
    //docNodes = new Map<string, TreeNode<any>>();
    get docDatas() {
        let docNodes = Array.from(this.docNodes.values());
        let docDatas = docNodes.map(docNode => docNode.data);
        //let docDatas = observable.array(docNodes.map(docNode=>docNode.data));
        return docDatas;
    }
    Get(subpathOrGetterFunc, query, createTreeNodesIfMissing = true) {
        let subpathSegments = PathHelpers_1.PathOrPathGetterToPathSegments(subpathOrGetterFunc);
        let currentNode = this;
        for (let [index, segment] of subpathSegments.entries()) {
            let subpathSegmentsToHere = subpathSegments.slice(0, index + 1);
            let childNodesMap = currentNode[currentNode.type == TreeNodeType.Collection ? "docNodes" : "collectionNodes"];
            if (!childNodesMap.has(segment) && createTreeNodesIfMissing) {
                //let pathToSegment = subpathSegments.slice(0, index).join("/");
                childNodesMap.set(segment, new TreeNode(this.fire, this.pathSegments.concat(subpathSegmentsToHere)));
            }
            currentNode = childNodesMap.get(segment);
            if (currentNode == null)
                break;
        }
        if (query) {
            if (!currentNode.queryNodes.has(query.toString()) && createTreeNodesIfMissing) {
                currentNode.queryNodes.set(query.toString(), new TreeNode(this.fire, this.pathSegments.concat(subpathSegments).concat("@query:")));
            }
            currentNode = currentNode.queryNodes.get(query.toString());
        }
        return currentNode;
    }
    AsRawData(addTreeLink = true) {
        return TreeNodeToRawData(this, addTreeLink);
    }
    UploadRawData(rawData) {
        // todo
    }
}
__decorate([
    mobx_1.observable
], TreeNode.prototype, "status", void 0);
__decorate([
    mobx_1.observable
], TreeNode.prototype, "collectionNodes", void 0);
__decorate([
    mobx_1.observable.ref
], TreeNode.prototype, "data", void 0);
__decorate([
    mobx_1.observable
], TreeNode.prototype, "queryNodes", void 0);
__decorate([
    mobx_1.observable
], TreeNode.prototype, "docNodes", void 0);
exports.TreeNode = TreeNode;
function GetTreeNodeTypeForPath(pathOrSegments) {
    let pathSegments = PathHelpers_1.PathOrPathGetterToPathSegments(pathOrSegments);
    if (pathSegments == null || pathSegments.length == 0)
        return TreeNodeType.Root;
    if (js_vextensions_1.CE(pathSegments).Last().startsWith("@query:"))
        return TreeNodeType.CollectionQuery;
    return pathSegments.length % 2 == 1 ? TreeNodeType.Collection : TreeNodeType.Document;
}
exports.GetTreeNodeTypeForPath = GetTreeNodeTypeForPath;
/*export function EnsurePathWatched(opt: FireOptions, path: string, filters?: Filter[]) {
    opt = E(defaultFireOptions, opt);
    let treeNode = opt.fire.tree.Get(path);
    if (treeNode.subscriptions.length) return;
    treeNode.Subscribe(filters ? new QueryRequest({filters}) : null);
}*/
function TreeNodeToRawData(treeNode, addTreeLink = true) {
    let result = {};
    if (addTreeLink) {
        js_vextensions_1.CE(result)._AddItem("_node", treeNode);
    }
    js_vextensions_1.CE(result)._AddItem("_path", treeNode.path);
    if (treeNode.data) {
        js_vextensions_1.CE(result).Extend(treeNode.data);
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
    return result;
}
exports.TreeNodeToRawData = TreeNodeToRawData;
//# sourceMappingURL=TreeNode.js.map