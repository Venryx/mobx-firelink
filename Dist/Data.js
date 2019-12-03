"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const js_vextensions_1 = require("js-vextensions");
const Firelink_1 = require("./Firelink");
class GetDocs_Options {
    constructor() {
        this.inVersionRoot = true;
        this.useUndefinedForInProgress = false;
    }
}
exports.GetDocs_Options = GetDocs_Options;
class GetDoc_Options {
    constructor() {
        this.inVersionRoot = true;
        this.useUndefinedForInProgress = false;
    }
}
exports.GetDoc_Options = GetDoc_Options;
function GetDocs(opt, collectionPathOrGetterFunc) {
    opt = js_vextensions_1.E(Firelink_1.defaultFireOptions, opt);
}
exports.GetDocs = GetDocs;
function GetDoc(opt, docPathOrGetterFunc) {
    opt = js_vextensions_1.E(Firelink_1.defaultFireOptions, opt);
}
exports.GetDoc = GetDoc;
/* GetDocField<DocT, FieldT>(docGetterFunc: (dbRoot: DBState)=>DocT, fieldGetterFunc: (doc: DocT)=>FieldT, suboptions?: GetDocs_Options): FieldT {
} */
// async versions
async function GetDocs_Async(opt, collectionPathOrGetterFunc) {
    opt = js_vextensions_1.E(Firelink_1.defaultFireOptions, opt);
}
exports.GetDocs_Async = GetDocs_Async;
async function GetDoc_Async(opt, docPathOrGetterFunc) {
    opt = js_vextensions_1.E(Firelink_1.defaultFireOptions, opt);
}
exports.GetDoc_Async = GetDoc_Async;
/* export async GetDocField_Async<DocT, FieldT>(docGetterFunc: (dbRoot: DBState)=>DocT, fieldGetterFunc: (doc: DocT)=>FieldT, suboptions?: GetDocs_Options): Promise<FieldT> {
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
//# sourceMappingURL=Data.js.map