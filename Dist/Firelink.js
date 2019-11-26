"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const js_vextensions_1 = require("js-vextensions");
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
class Firelink {
    constructor(dbVersion, dbEnv_short) {
        this.rootPathSegments = ["versions", `v${dbVersion}-${dbEnv_short}`];
        this.rootPath = `versions/v${dbVersion}-${dbEnv_short}`;
    }
    DBPath(path = "", inVersionRoot = true) {
        js_vextensions_1.Assert(path != null, "Path cannot be null.");
        js_vextensions_1.Assert(typeof path == "string", "Path must be a string.");
        /*let versionPrefix = path.match(/^v[0-9]+/);
        if (versionPrefix == null) // if no version prefix already, add one (referencing the current version)*/
        if (inVersionRoot) {
            path = `${this.rootPath}${path ? `/${path}` : ""}`;
        }
        return path;
    }
    DBPathSegments(pathSegments, inVersionRoot = true) {
        let result = pathSegments;
        if (inVersionRoot) {
            result = this.rootPathSegments.concat(result);
        }
        return result;
    }
    GetDocs(collectionPathOrGetterFunc, options) {
    }
    GetDoc(docPathOrGetterFunc, options) {
    }
    /* GetDocField<DocT, FieldT>(docGetterFunc: (dbRoot: DBState)=>DocT, fieldGetterFunc: (doc: DocT)=>FieldT, suboptions?: GetDocs_Options): FieldT {
    } */
    // async versions
    async GetDocs_Async(collectionPathOrGetterFunc, options) {
    }
    async GetDoc_Async(docPathOrGetterFunc, options) {
    }
    /* async GetDocField_Async<DocT, FieldT>(docGetterFunc: (dbRoot: DBState)=>DocT, fieldGetterFunc: (doc: DocT)=>FieldT, suboptions?: GetDocs_Options): Promise<FieldT> {
    } */
    // async helper
    async GetAsync(dataGetterFunc) {
    }
    /*async WaitTillPathDataIsReceived() {
    }*/
    WithStore(store, func) {
        // todo
    }
}
exports.Firelink = Firelink;
//# sourceMappingURL=Firelink.js.map