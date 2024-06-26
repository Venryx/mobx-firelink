import { E, emptyArray, emptyArray_forLoading } from "js-vextensions";
import { defaultFireOptions } from "../Firelink.js";
import { DataStatus, PathSegmentsAreValid, QueryRequest } from "../Tree/TreeNode.js";
import { DoX_ComputationSafe, RunInAction } from "../Utils/MobX.js";
import { nil } from "../Utils/Nil.js";
import { PathOrPathGetterToPathSegments } from "../Utils/PathHelpers.js";
import { NotifyWaitingForDB } from "./Helpers.js";
/*
Why use explicit GetDocs, GetDoc, etc. calls instead of just Proxy's in mobx store fields?
1) It lets you add options (like filters) in a consistent way. (consistent among sync db-accesses, and, old: consistent with async db-accesses, eg. GetDocAsync)
2) It makes it visually clear where a db-access is taking place, as opposed to a mere store access.
*/
export class GetDocs_Options {
    constructor() {
        Object.defineProperty(this, "inLinkRoot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "queryOps", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "resultForLoading", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: emptyArray_forLoading
        });
        //resultForEmpty? = emptyArray;
    }
}
Object.defineProperty(GetDocs_Options, "default", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new GetDocs_Options()
});
export function GetDocs(options, collectionPathOrGetterFunc) {
    var _a;
    const opt = E(defaultFireOptions, GetDocs_Options.default, options);
    let subpathSegments = PathOrPathGetterToPathSegments(collectionPathOrGetterFunc);
    let pathSegments = opt.inLinkRoot ? opt.fire.rootPathSegments.concat(subpathSegments) : subpathSegments;
    if (!PathSegmentsAreValid(pathSegments))
        return emptyArray;
    let queryRequest = opt.queryOps ? new QueryRequest({ queryOps: opt.queryOps }) : nil;
    const treeNode = opt.fire.tree.Get(pathSegments, queryRequest);
    // if already subscribed, just mark requested (reduces action-spam of GetDocs_Request)
    if (treeNode && treeNode.subscription) {
        treeNode.Request();
    }
    else {
        // we can't change observables from within computations, so do it in a moment (out of computation call-stack)
        DoX_ComputationSafe(() => RunInAction("GetDocs_Request", () => {
            opt.fire.tree.Get(pathSegments, queryRequest, true).Request();
        }));
        // if tree-node still not created yet (due to waiting a tick so can start mobx action), add placeholder entry, so tree-request-watchers know there's still data being loaded
        // todo: improve this (eg. make-so watchers know they may receive mere placeholder entries)
        if (opt.fire.tree.Get(pathSegments, queryRequest) == null) {
            const placeholder = { "_note": "This is a placeholder; data is still loading, but its tree-node hasn't been created yet, so this is its placeholder." };
            opt.fire.treeRequestWatchers.forEach(a => a.nodesRequested.add(placeholder));
        }
    }
    if ((treeNode === null || treeNode === void 0 ? void 0 : treeNode.status) != DataStatus.Received_Full) {
        NotifyWaitingForDB(pathSegments.join("/"));
        return opt.resultForLoading;
    }
    /*let docNodes = Array.from(treeNode.docNodes.values());
    let docDatas = docNodes.map(docNode=>docNode.data);
    return docDatas;*/
    //return opt.fire.tree.Get(pathSegments, queryRequest)?.docDatas ?? emptyArray;
    let result = (_a = treeNode === null || treeNode === void 0 ? void 0 : treeNode.docDatas) !== null && _a !== void 0 ? _a : [];
    return result.length == 0 ? emptyArray : result; // to help avoid unnecessary react renders
}
/*export async function GetDocs_Async<DocT>(opt: FireOptions & GetDocs_Options, collectionPathOrGetterFunc: string | string[] | ((dbRoot: DBShape)=>ObservableMap<any, DocT>)): Promise<DocT[]> {
    opt = E(defaultFireOptions, opt);
    return GetAsync(()=>GetDocs_Async(opt, collectionPathOrGetterFunc));
}*/
export class GetDoc_Options {
    constructor() {
        Object.defineProperty(this, "inLinkRoot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        ///** If true, return undefined when loading. Else, return default (null) when loading. */
        //undefinedForLoading? = false;
        Object.defineProperty(this, "resultForLoading", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: undefined
        });
    }
}
Object.defineProperty(GetDoc_Options, "default", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new GetDoc_Options()
});
export function GetDoc(options, docPathOrGetterFunc) {
    const opt = E(defaultFireOptions, GetDoc_Options.default, options);
    let subpathSegments = PathOrPathGetterToPathSegments(docPathOrGetterFunc);
    let pathSegments = opt.inLinkRoot ? opt.fire.rootPathSegments.concat(subpathSegments) : subpathSegments;
    if (!PathSegmentsAreValid(pathSegments))
        return null;
    let treeNode = opt.fire.tree.Get(pathSegments);
    // if already subscribed, just mark requested (reduces action-spam of GetDoc_Request)
    if (treeNode && treeNode.subscription) {
        treeNode.Request();
    }
    else {
        // we can't change observables from within computations, so do it in a moment (out of computation call-stack)
        DoX_ComputationSafe(() => RunInAction("GetDoc_Request", () => {
            opt.fire.tree.Get(pathSegments, nil, true).Request();
        }));
        // if tree-node still not created yet (due to waiting a tick so can start mobx action), add placeholder entry, so tree-request-watchers know there's still data being loaded
        // todo: improve this (eg. make-so watchers know they may receive mere placeholder entries)
        if (opt.fire.tree.Get(pathSegments) == null) {
            const placeholder = { "_note": "This is a placeholder; data is still loading, but its tree-node hasn't been created yet, so this is its placeholder." };
            opt.fire.treeRequestWatchers.forEach(a => a.nodesRequested.add(placeholder));
        }
    }
    //if (opt.undefinedForLoading && treeNode?.status != DataStatus.Received_Full) return undefined;
    if ((treeNode === null || treeNode === void 0 ? void 0 : treeNode.status) != DataStatus.Received_Full) {
        NotifyWaitingForDB(pathSegments.join("/"));
        return opt.resultForLoading;
    }
    return treeNode === null || treeNode === void 0 ? void 0 : treeNode.data;
}
/*export async function GetDoc_Async<DocT>(opt: FireOptions & GetDoc_Options, docPathOrGetterFunc: string | string[] | ((dbRoot: DBShape)=>DocT)): Promise<DocT> {
    opt = E(defaultFireOptions, opt);
    return GetAsync(()=>GetDoc_Async(opt, docPathOrGetterFunc));
}*/
/* GetDocField<DocT, FieldT>(docGetterFunc: (dbRoot: DBShape)=>DocT, fieldGetterFunc: (doc: DocT)=>FieldT, suboptions?: GetDocs_Options): FieldT {
}
export async GetDocField_Async<DocT, FieldT>(docGetterFunc: (dbRoot: DBShape)=>DocT, fieldGetterFunc: (doc: DocT)=>FieldT, suboptions?: GetDocs_Options): Promise<FieldT> {
} */ 
