"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const js_vextensions_1 = require("js-vextensions");
const Firelink_1 = require("./Firelink");
const PathHelpers_1 = require("./Utils/PathHelpers");
const TreeNode_1 = require("./Tree/TreeNode");
class GetDocs_Options {
    constructor() {
        this.inVersionRoot = true;
        this.useUndefinedForInProgress = false;
    }
}
exports.GetDocs_Options = GetDocs_Options;
function GetDocs(opt, collectionPathOrGetterFunc) {
    opt = js_vextensions_1.E(Firelink_1.defaultFireOptions, opt);
    let subpath = PathHelpers_1.PathOrPathGetterToPath(collectionPathOrGetterFunc);
    let path = opt.inVersionRoot ? `${opt.fire.versionPath}/${subpath}` : subpath;
    // todo: handle filters
    TreeNode_1.EnsurePathWatched(opt, path);
    // todo: handle opt.useUndefinedForInProgress
    //return DeepGet(opt.fire.versionData, subpath);
    let docNodesMap = opt.fire.tree.Get(path).subs;
    let docNodes = Array.from(docNodesMap.values());
    let docDatas = docNodes.map(docNode => docNode.data);
    return docDatas;
}
exports.GetDocs = GetDocs;
async function GetDocs_Async(opt, collectionPathOrGetterFunc) {
    opt = js_vextensions_1.E(Firelink_1.defaultFireOptions, opt);
    // todo
}
exports.GetDocs_Async = GetDocs_Async;
class GetDoc_Options {
    constructor() {
        this.inVersionRoot = true;
        this.useUndefinedForInProgress = false;
    }
}
exports.GetDoc_Options = GetDoc_Options;
function GetDoc(opt, docPathOrGetterFunc) {
    opt = js_vextensions_1.E(Firelink_1.defaultFireOptions, opt);
    let subpath = PathHelpers_1.PathOrPathGetterToPath(docPathOrGetterFunc);
    let path = opt.inVersionRoot ? `${opt.fire.versionPath}/${subpath}` : subpath;
    // todo: handle opt.filters
    TreeNode_1.EnsurePathWatched(opt, path);
    // todo: handle opt.useUndefinedForInProgress
    //return DeepGet(opt.fire.versionData, subpath);
    return opt.fire.tree.Get(path).data;
}
exports.GetDoc = GetDoc;
async function GetDoc_Async(opt, docPathOrGetterFunc) {
    opt = js_vextensions_1.E(Firelink_1.defaultFireOptions, opt);
    // todo
}
exports.GetDoc_Async = GetDoc_Async;
/* GetDocField<DocT, FieldT>(docGetterFunc: (dbRoot: DBShape)=>DocT, fieldGetterFunc: (doc: DocT)=>FieldT, suboptions?: GetDocs_Options): FieldT {
}
export async GetDocField_Async<DocT, FieldT>(docGetterFunc: (dbRoot: DBShape)=>DocT, fieldGetterFunc: (doc: DocT)=>FieldT, suboptions?: GetDocs_Options): Promise<FieldT> {
} */
// async helper
async function GetAsync(dataGetterFunc) {
}
exports.GetAsync = GetAsync;
/*async WaitTillPathDataIsReceived() {
}*/
function WithStore(store, func) {
    // todo
}
exports.WithStore = WithStore;
//# sourceMappingURL=Accessors.js.map