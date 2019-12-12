import { Assert, IsString, E, CE, IsArray, IsFunction } from "js-vextensions";
import { defaultFireOptions } from "../Firelink";
import { SplitStringBySlash_Cached } from "./StringSplitCache";
export function VPathToFBPath(vPath) {
    return vPath != null ? vPath.replace(/\/\./g, ".") : null;
}
export function FBPathToVPath(fbPath) {
    return fbPath != null ? fbPath.replace(/\./g, "/.") : null;
}
export function VFieldPathToFBFieldPath(vFieldPath) {
    return vFieldPath != null ? vFieldPath.replace(/\//g, ".") : null;
}
export function FBFieldPathToVFieldPath(vFieldPath) {
    return vFieldPath != null ? vFieldPath.replace(/\./g, "/") : null;
}
/**
 * @param asFBPath If true, returned paths are separated with "."; if false, by "/". Default: false
 * @returns [colOrDocPath, fieldPathInDoc]
 * */
export function GetPathParts(path, asFBPath = false) {
    let colOrDocPath = path.substr(0, CE(path.indexOf("/.")).IfN1Then(path.length));
    const isDocPath = colOrDocPath.length != path.length; // if length differs, it means field-path is supplied, which means it's a doc-path
    if (isDocPath) {
        Assert(SplitStringBySlash_Cached(colOrDocPath).length % 2 == 0, `Segment count in docPath (${colOrDocPath}) must be multiple of 2.`);
    }
    let fieldPathInDoc = colOrDocPath.length < path.length ? path.substr(colOrDocPath.length + 2).replace(/\./g, "") : null;
    if (asFBPath) {
        [colOrDocPath, fieldPathInDoc] = [VPathToFBPath(colOrDocPath), VFieldPathToFBFieldPath(fieldPathInDoc)];
    }
    return [colOrDocPath, fieldPathInDoc];
}
export function DBPath(opt, path = "", inLinkRoot = true) {
    opt = E(defaultFireOptions, opt);
    Assert(path != null, "Path cannot be null.");
    Assert(typeof path == "string", "Path must be a string.");
    /*let versionPrefix = path.match(/^v[0-9]+/);
    if (versionPrefix == null) // if no version prefix already, add one (referencing the current version)*/
    if (inLinkRoot) {
        path = `${opt.fire.rootPath}${path ? `/${path}` : ""}`;
    }
    return path;
}
export function DBPathSegments(opt, pathSegments, inLinkRoot = true) {
    opt = E(defaultFireOptions, opt);
    let result = pathSegments.map(a => { var _a; return (_a = a) === null || _a === void 0 ? void 0 : _a.toString(); });
    if (inLinkRoot) {
        result = opt.fire.rootPathSegments.concat(result);
    }
    return result;
}
export function SlicePath(path, removeFromEndCount, ...itemsToAdd) {
    //let parts = path.split("/");
    const parts = SplitStringBySlash_Cached(path).slice();
    parts.splice(parts.length - removeFromEndCount, removeFromEndCount, ...itemsToAdd);
    if (parts.length == 0)
        return null;
    return parts.join("/");
}
export function PathOrPathGetterToPath(pathOrPathSegmentsOrPathGetter) {
    if (IsString(pathOrPathSegmentsOrPathGetter))
        return pathOrPathSegmentsOrPathGetter;
    if (IsArray(pathOrPathSegmentsOrPathGetter))
        return pathOrPathSegmentsOrPathGetter.map(a => { var _a; return (_a = a) === null || _a === void 0 ? void 0 : _a.toString(); }).join("/");
    if (IsFunction(pathOrPathSegmentsOrPathGetter))
        return MobXPathGetterToPath(pathOrPathSegmentsOrPathGetter);
    return null;
}
export function PathOrPathGetterToPathSegments(pathOrPathSegmentsOrPathGetter) {
    if (IsString(pathOrPathSegmentsOrPathGetter))
        return pathOrPathSegmentsOrPathGetter.split("/");
    if (IsArray(pathOrPathSegmentsOrPathGetter))
        return pathOrPathSegmentsOrPathGetter.map(a => { var _a; return (_a = a) === null || _a === void 0 ? void 0 : _a.toString(); });
    if (IsFunction(pathOrPathSegmentsOrPathGetter))
        return MobXPathGetterToPathSegments(pathOrPathSegmentsOrPathGetter);
    return [];
}
export function MobXPathGetterToPath(pathGetterFunc) {
    return MobXPathGetterToPathSegments(pathGetterFunc).join("/");
}
export function MobXPathGetterToPathSegments(pathGetterFunc) {
    let pathSegments = [];
    let proxy = new Proxy({}, {
        get: (target, key) => {
            var _a;
            if (key == "get") {
                return (realKey) => {
                    pathSegments.push(realKey);
                    return proxy;
                };
            }
            pathSegments.push((_a = key) === null || _a === void 0 ? void 0 : _a.toString());
            return proxy;
        },
    });
    pathGetterFunc(proxy);
    return pathSegments;
}
//# sourceMappingURL=PathHelpers.js.map