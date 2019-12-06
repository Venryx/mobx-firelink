"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const js_vextensions_1 = require("js-vextensions");
const Firelink_1 = require("../Firelink");
const StringSplitCache_1 = require("./StringSplitCache");
function VPathToFBPath(vPath) {
    return vPath != null ? vPath.replace(/\/\./g, ".") : null;
}
exports.VPathToFBPath = VPathToFBPath;
function FBPathToVPath(fbPath) {
    return fbPath != null ? fbPath.replace(/\./g, "/.") : null;
}
exports.FBPathToVPath = FBPathToVPath;
function VFieldPathToFBFieldPath(vFieldPath) {
    return vFieldPath != null ? vFieldPath.replace(/\//g, ".") : null;
}
exports.VFieldPathToFBFieldPath = VFieldPathToFBFieldPath;
function FBFieldPathToVFieldPath(vFieldPath) {
    return vFieldPath != null ? vFieldPath.replace(/\./g, "/") : null;
}
exports.FBFieldPathToVFieldPath = FBFieldPathToVFieldPath;
/**
 * @param asFBPath If true, returned paths are separated with "."; if false, by "/". Default: false
 * @returns [colOrDocPath, fieldPathInDoc]
 * */
function GetPathParts(path, asFBPath = false) {
    let colOrDocPath = path.substr(0, js_vextensions_1.CE(path.indexOf("/.")).IfN1Then(path.length));
    const isDocPath = colOrDocPath.length != path.length; // if length differs, it means field-path is supplied, which means it's a doc-path
    if (isDocPath) {
        js_vextensions_1.Assert(StringSplitCache_1.SplitStringBySlash_Cached(colOrDocPath).length % 2 == 0, `Segment count in docPath (${colOrDocPath}) must be multiple of 2.`);
    }
    let fieldPathInDoc = colOrDocPath.length < path.length ? path.substr(colOrDocPath.length + 2).replace(/\./g, "") : null;
    if (asFBPath) {
        [colOrDocPath, fieldPathInDoc] = [VPathToFBPath(colOrDocPath), VFieldPathToFBFieldPath(fieldPathInDoc)];
    }
    return [colOrDocPath, fieldPathInDoc];
}
exports.GetPathParts = GetPathParts;
function DBPath(opt, path = "", inVersionRoot = true) {
    opt = js_vextensions_1.E(Firelink_1.defaultFireOptions, opt);
    js_vextensions_1.Assert(path != null, "Path cannot be null.");
    js_vextensions_1.Assert(typeof path == "string", "Path must be a string.");
    /*let versionPrefix = path.match(/^v[0-9]+/);
    if (versionPrefix == null) // if no version prefix already, add one (referencing the current version)*/
    if (inVersionRoot) {
        path = `${opt.fire.versionPath}${path ? `/${path}` : ""}`;
    }
    return path;
}
exports.DBPath = DBPath;
function DBPathSegments(opt, pathSegments, inVersionRoot = true) {
    opt = js_vextensions_1.E(Firelink_1.defaultFireOptions, opt);
    let result = pathSegments;
    if (inVersionRoot) {
        result = opt.fire.versionPathSegments.concat(result);
    }
    return result;
}
exports.DBPathSegments = DBPathSegments;
function SlicePath(path, removeFromEndCount, ...itemsToAdd) {
    //let parts = path.split("/");
    const parts = StringSplitCache_1.SplitStringBySlash_Cached(path).slice();
    parts.splice(parts.length - removeFromEndCount, removeFromEndCount, ...itemsToAdd);
    if (parts.length == 0)
        return null;
    return parts.join("/");
}
exports.SlicePath = SlicePath;
function PathOrPathGetterToPath(pathOrPathSegmentsOrPathGetter) {
    if (js_vextensions_1.IsString(pathOrPathSegmentsOrPathGetter))
        return pathOrPathSegmentsOrPathGetter;
    if (js_vextensions_1.IsArray(pathOrPathSegmentsOrPathGetter))
        return pathOrPathSegmentsOrPathGetter.join("/");
    if (js_vextensions_1.IsFunction(pathOrPathSegmentsOrPathGetter))
        return MobXPathGetterToPath(pathOrPathSegmentsOrPathGetter);
    return null;
}
exports.PathOrPathGetterToPath = PathOrPathGetterToPath;
function PathOrPathGetterToPathSegments(pathOrPathSegmentsOrPathGetter) {
    if (js_vextensions_1.IsString(pathOrPathSegmentsOrPathGetter))
        return pathOrPathSegmentsOrPathGetter.split("/");
    if (js_vextensions_1.IsArray(pathOrPathSegmentsOrPathGetter))
        return pathOrPathSegmentsOrPathGetter;
    if (js_vextensions_1.IsFunction(pathOrPathSegmentsOrPathGetter))
        return MobXPathGetterToPathSegments(pathOrPathSegmentsOrPathGetter);
    return [];
}
exports.PathOrPathGetterToPathSegments = PathOrPathGetterToPathSegments;
function MobXPathGetterToPath(pathGetterFunc) {
    return MobXPathGetterToPathSegments(pathGetterFunc).join("/");
}
exports.MobXPathGetterToPath = MobXPathGetterToPath;
function MobXPathGetterToPathSegments(pathGetterFunc) {
    let pathSegments = [];
    let proxy = new Proxy({}, {
        get: (target, key) => {
            if (key == "get") {
                return (realKey) => {
                    pathSegments.push(realKey);
                    return proxy;
                };
            }
            pathSegments.push(key);
            return proxy;
        },
    });
    pathGetterFunc(proxy);
    return pathSegments;
}
exports.MobXPathGetterToPathSegments = MobXPathGetterToPathSegments;
//# sourceMappingURL=PathHelpers.js.map