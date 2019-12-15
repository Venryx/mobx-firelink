var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { E, ShallowChanged, emptyArray, CE } from "js-vextensions";
import { when, runInAction } from "mobx";
import { defaultFireOptions } from "../Firelink";
import { DataStatus, QueryRequest } from "../Tree/TreeNode";
import { PathOrPathGetterToPathSegments } from "../Utils/PathHelpers";
import { TreeRequestWatcher } from "../Tree/TreeRequestWatcher";
import { DoX_ComputationSafe } from "../Utils/MobX";
/*
Why use explicit GetDocs, GetDoc, etc. calls instead of just Proxy's?
1) It lets you add options (like filters) in a consistent way. (consistent among sync db-accesses, and, old: consistent with async db-accesses, eg. GetDocAsync)
2) It makes it visually clear where a db-access is taking place, as opposed to a mere store access.
*/
export class GetDocs_Options {
    constructor() {
        this.inLinkRoot = true;
        this.useUndefinedForInProgress = false;
    }
}
GetDocs_Options.default = new GetDocs_Options();
export function GetDocs(opt, collectionPathOrGetterFunc) {
    var _a, _b;
    opt = E(defaultFireOptions, GetDocs_Options.default, opt);
    let subpathSegments = PathOrPathGetterToPathSegments(collectionPathOrGetterFunc);
    let pathSegments = opt.inLinkRoot ? opt.fire.rootPathSegments.concat(subpathSegments) : subpathSegments;
    if (CE(pathSegments).Any(a => a == null))
        return emptyArray;
    let queryRequest = opt.filters ? new QueryRequest({ filters: opt.filters }) : undefined;
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
    // todo: handle opt.useUndefinedForInProgress
    /*let docNodes = Array.from(treeNode.docNodes.values());
    let docDatas = docNodes.map(docNode=>docNode.data);
    return docDatas;*/
    //return opt.fire.tree.Get(pathSegments, queryRequest)?.docDatas ?? emptyArray;
    let result = (_b = (_a = treeNode) === null || _a === void 0 ? void 0 : _a.docDatas, (_b !== null && _b !== void 0 ? _b : []));
    return result.length == 0 ? emptyArray : result; // to help avoid unnecessary react renders
}
/*export async function GetDocs_Async<DocT>(opt: FireOptions & GetDocs_Options, collectionPathOrGetterFunc: string | string[] | ((dbRoot: DBShape)=>ObservableMap<any, DocT>)): Promise<DocT[]> {
    opt = E(defaultFireOptions, opt);
    return GetAsync(()=>GetDocs_Async(opt, collectionPathOrGetterFunc));
}*/
export class GetDoc_Options {
    constructor() {
        this.inLinkRoot = true;
        this.useUndefinedForInProgress = false;
    }
}
GetDoc_Options.default = new GetDoc_Options();
export function GetDoc(opt, docPathOrGetterFunc) {
    var _a;
    opt = E(defaultFireOptions, GetDoc_Options.default, opt);
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
            opt.fire.tree.Get(pathSegments, undefined, true).Request();
        }));
    }
    // todo: handle opt.useUndefinedForInProgress
    return (_a = treeNode) === null || _a === void 0 ? void 0 : _a.data;
}
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
export function GetAsync(dataGetterFunc, opt) {
    return __awaiter(this, void 0, void 0, function* () {
        opt = E(defaultFireOptions, opt);
        let lastResult;
        let watcher = new TreeRequestWatcher(opt.fire);
        let nodesRequested_obj_last;
        let nodesRequested_obj;
        do {
            nodesRequested_obj_last = nodesRequested_obj;
            watcher.Start();
            //let dispose = autorun(()=> {
            lastResult = dataGetterFunc();
            //});
            //dispose();
            watcher.Stop();
            const nodesRequested_array = Array.from(watcher.nodesRequested);
            nodesRequested_obj = CE(nodesRequested_array).ToMap(a => a.path, a => true);
            // wait till all requested nodes have their data received
            yield Promise.all(nodesRequested_array.map(node => {
                return when(() => node.status == DataStatus.Received);
            }));
        } while (ShallowChanged(nodesRequested_obj, nodesRequested_obj_last));
        return lastResult;
    });
}
//# sourceMappingURL=Generic.js.map