import { E, emptyArray, CE, emptyArray_forLoading } from "js-vextensions";
import { runInAction } from "mobx";
import { defaultFireOptions } from "../Firelink";
import { DataStatus, QueryRequest } from "../Tree/TreeNode";
import { PathOrPathGetterToPathSegments } from "../Utils/PathHelpers";
import { DoX_ComputationSafe } from "../Utils/MobX";
import { nil } from "../Utils/Nil";
/*
Why use explicit GetDocs, GetDoc, etc. calls instead of just Proxy's?
1) It lets you add options (like filters) in a consistent way. (consistent among sync db-accesses, and, old: consistent with async db-accesses, eg. GetDocAsync)
2) It makes it visually clear where a db-access is taking place, as opposed to a mere store access.
*/
export class GetDocs_Options {
    constructor() {
        this.inLinkRoot = true;
        this.resultForLoading = emptyArray_forLoading;
        //resultForEmpty? = emptyArray;
    }
}
GetDocs_Options.default = new GetDocs_Options();
export function GetDocs(options, collectionPathOrGetterFunc) {
    var _a, _b, _c;
    const opt = E(defaultFireOptions, GetDocs_Options.default, options);
    let subpathSegments = PathOrPathGetterToPathSegments(collectionPathOrGetterFunc);
    let pathSegments = opt.inLinkRoot ? opt.fire.rootPathSegments.concat(subpathSegments) : subpathSegments;
    if (CE(pathSegments).Any(a => a == null))
        return emptyArray;
    let queryRequest = opt.filters ? new QueryRequest({ filters: opt.filters }) : nil;
    const treeNode = opt.fire.tree.Get(pathSegments, queryRequest);
    // if already subscribed, just mark requested (reduces action-spam of GetDocs_Request)
    if (treeNode && treeNode.subscription) {
        treeNode.Request();
    }
    else {
        // we can't change observables from within computations, so do it in a moment (out of computation call-stack)
        DoX_ComputationSafe(() => runInAction("GetDocs_Request", () => {
            opt.fire.tree.Get(pathSegments, queryRequest, true).Request();
        }));
    }
    if (((_a = treeNode) === null || _a === void 0 ? void 0 : _a.status) != DataStatus.Received_Full)
        return opt.resultForLoading;
    /*let docNodes = Array.from(treeNode.docNodes.values());
    let docDatas = docNodes.map(docNode=>docNode.data);
    return docDatas;*/
    //return opt.fire.tree.Get(pathSegments, queryRequest)?.docDatas ?? emptyArray;
    let result = (_c = (_b = treeNode) === null || _b === void 0 ? void 0 : _b.docDatas, (_c !== null && _c !== void 0 ? _c : []));
    return result.length == 0 ? emptyArray : result; // to help avoid unnecessary react renders
}
/*export async function GetDocs_Async<DocT>(opt: FireOptions & GetDocs_Options, collectionPathOrGetterFunc: string | string[] | ((dbRoot: DBShape)=>ObservableMap<any, DocT>)): Promise<DocT[]> {
    opt = E(defaultFireOptions, opt);
    return GetAsync(()=>GetDocs_Async(opt, collectionPathOrGetterFunc));
}*/
export class GetDoc_Options {
    constructor() {
        this.inLinkRoot = true;
        ///** If true, return undefined when loading. Else, return default (null) when loading. */
        //undefinedForLoading? = false;
        this.resultForLoading = undefined;
    }
}
GetDoc_Options.default = new GetDoc_Options();
export function GetDoc(options, docPathOrGetterFunc) {
    var _a, _b;
    const opt = E(defaultFireOptions, GetDoc_Options.default, options);
    let subpathSegments = PathOrPathGetterToPathSegments(docPathOrGetterFunc);
    let pathSegments = opt.inLinkRoot ? opt.fire.rootPathSegments.concat(subpathSegments) : subpathSegments;
    if (CE(pathSegments).Any(a => a == null))
        return null;
    let treeNode = opt.fire.tree.Get(pathSegments);
    // if already subscribed, just mark requested (reduces action-spam of GetDoc_Request)
    if (treeNode && treeNode.subscription) {
        treeNode.Request();
    }
    else {
        // we can't change observables from within computations, so do it in a moment (out of computation call-stack)
        DoX_ComputationSafe(() => runInAction("GetDoc_Request", () => {
            opt.fire.tree.Get(pathSegments, nil, true).Request();
        }));
    }
    //if (opt.undefinedForLoading && treeNode?.status != DataStatus.Received_Full) return undefined;
    if (((_a = treeNode) === null || _a === void 0 ? void 0 : _a.status) != DataStatus.Received_Full)
        return opt.resultForLoading;
    return (_b = treeNode) === null || _b === void 0 ? void 0 : _b.data;
}
/*export async function GetDoc_Async<DocT>(opt: FireOptions & GetDoc_Options, docPathOrGetterFunc: string | string[] | ((dbRoot: DBShape)=>DocT)): Promise<DocT> {
    opt = E(defaultFireOptions, opt);
    return GetAsync(()=>GetDoc_Async(opt, docPathOrGetterFunc));
}*/
/* GetDocField<DocT, FieldT>(docGetterFunc: (dbRoot: DBShape)=>DocT, fieldGetterFunc: (doc: DocT)=>FieldT, suboptions?: GetDocs_Options): FieldT {
}
export async GetDocField_Async<DocT, FieldT>(docGetterFunc: (dbRoot: DBShape)=>DocT, fieldGetterFunc: (doc: DocT)=>FieldT, suboptions?: GetDocs_Options): Promise<FieldT> {
} */ 
//# sourceMappingURL=Generic.js.map