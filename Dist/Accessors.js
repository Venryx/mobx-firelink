"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const js_vextensions_1 = require("js-vextensions");
const Firelink_1 = require("./Firelink");
const TreeNode_1 = require("./Tree/TreeNode");
const PathHelpers_1 = require("./Utils/PathHelpers");
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
/*export async function GetDocs_Async<DocT>(opt: FireOptions & GetDocs_Options, collectionPathOrGetterFunc: string | string[] | ((dbRoot: DBShape)=>ObservableMap<any, DocT>)): Promise<DocT[]> {
    opt = E(defaultFireOptions, opt);
    return GetAsync(()=>GetDocs_Async(opt, collectionPathOrGetterFunc));
}*/
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
/*export async function GetDoc_Async<DocT>(opt: FireOptions & GetDoc_Options, docPathOrGetterFunc: string | string[] | ((dbRoot: DBShape)=>DocT)): Promise<DocT> {
    opt = E(defaultFireOptions, opt);
    return GetAsync(()=>GetDoc_Async(opt, docPathOrGetterFunc));
}*/
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
function WithStore(store, accessorFunc) {
    // todo
}
exports.WithStore = WithStore;
//# sourceMappingURL=Accessors.js.map