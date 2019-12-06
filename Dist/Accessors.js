"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const js_vextensions_1 = require("js-vextensions");
const mobx_1 = require("mobx");
const Firelink_1 = require("./Firelink");
const TreeNode_1 = require("./Tree/TreeNode");
const PathHelpers_1 = require("./Utils/PathHelpers");
const TreeRequestWatcher_1 = require("./Tree/TreeRequestWatcher");
class GetDocs_Options {
    constructor() {
        this.inVersionRoot = true;
        this.useUndefinedForInProgress = false;
    }
}
exports.GetDocs_Options = GetDocs_Options;
GetDocs_Options.default = new GetDocs_Options();
function GetDocs(opt, collectionPathOrGetterFunc) {
    opt = js_vextensions_1.E(Firelink_1.defaultFireOptions, GetDocs_Options.default, opt);
    let subpath = PathHelpers_1.PathOrPathGetterToPath(collectionPathOrGetterFunc);
    let path = opt.inVersionRoot ? `${opt.fire.versionPath}/${subpath}` : subpath;
    let treeNode = opt.fire.tree.Get(path, opt.filters ? new TreeNode_1.QueryRequest({ filters: opt.filters }) : null);
    treeNode.Request();
    // todo: handle opt.useUndefinedForInProgress
    let docNodes = Array.from(treeNode.docNodes.values());
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
GetDoc_Options.default = new GetDoc_Options();
function GetDoc(opt, docPathOrGetterFunc) {
    opt = js_vextensions_1.E(Firelink_1.defaultFireOptions, GetDoc_Options.default, opt);
    let subpath = PathHelpers_1.PathOrPathGetterToPath(docPathOrGetterFunc);
    let path = opt.inVersionRoot ? `${opt.fire.versionPath}/${subpath}` : subpath;
    let treeNode = opt.fire.tree.Get(path);
    treeNode.Request();
    // todo: handle opt.useUndefinedForInProgress
    //return DeepGet(opt.fire.versionData, subpath);
    return treeNode.data;
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
// (one of the rare cases where opt is not the first argument; that's because GetAsync may be called very frequently/in-sequences, and usually wraps nice user accessors, so could add too much visual clutter)
async function GetAsync(dataGetterFunc, opt) {
    opt = js_vextensions_1.E(Firelink_1.defaultFireOptions, opt);
    let lastResult;
    let watcher = new TreeRequestWatcher_1.TreeRequestWatcher(opt.fire);
    let nodesRequested_obj_last = {};
    do {
        watcher.Start();
        //let dispose = autorun(()=> {
        lastResult = dataGetterFunc();
        //});
        //dispose();
        watcher.Stop();
        var nodesRequested_array = Array.from(watcher.nodesRequested);
        var nodesRequested_obj = nodesRequested_array.reduce((acc, item) => acc[item.path] = true, {});
        // wait till all requested nodes have their data received
        await Promise.all(nodesRequested_array.map(node => {
            return mobx_1.when(() => node.status == TreeNode_1.DataStatus.Received);
        }));
    } while (js_vextensions_1.ShallowChanged(nodesRequested_obj, nodesRequested_obj_last));
    return lastResult;
}
exports.GetAsync = GetAsync;
/*export function WithStore<T>(store: DBShape, accessorFunc: ()=>T): T {
    // todo
}*/ 
//# sourceMappingURL=Accessors.js.map