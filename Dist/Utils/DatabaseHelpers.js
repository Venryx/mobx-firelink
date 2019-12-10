"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const js_vextensions_1 = require("js-vextensions");
const updeep_1 = require("updeep");
const General_1 = require("./General");
const Firelink_1 = require("../Firelink");
const firebase_1 = require("firebase");
const PathHelpers_1 = require("./PathHelpers");
function IsAuthValid(auth) {
    return auth && !auth.isEmpty;
}
exports.IsAuthValid = IsAuthValid;
/* Object.prototype._AddFunction_Inline = function DBRef(path = "", inVersionRoot = true) {
    const finalPath = DBPath(path, inVersionRoot);
    return this.ref(finalPath);
}; */
function ProcessDBData(data, standardizeForm, addHelpers, rootKey) {
    var treeNodes = js_vextensions_1.GetTreeNodesInObjTree(data, true);
    for (const treeNode of treeNodes) {
        if (treeNode.Value == null)
            continue;
        // turn the should-not-have-been-array arrays (the ones without a "0" property) into objects
        //if (standardizeForm && treeNode.Value instanceof Array && treeNode.Value[0] === undefined) {
        // turn the should-not-have-been-array arrays (the ones with non-number property) into objects
        if (standardizeForm && treeNode.Value instanceof Array && js_vextensions_1.ArrayCE(js_vextensions_1.ObjectCE(treeNode.Value).VKeys(true)).Any(a => !js_vextensions_1.IsNumberString(a))) {
            // if changing root, we have to actually modify the prototype of the passed-in "data" object
            /*if (treeNode.Value == data) {
                Object.setPrototypeOf(data, Object.getPrototypeOf({}));
                for (var key of Object.keys(data)) {
                    if (data[key] === undefined)
                        delete data[key];
                }
                continue;
            }*/
            const valueAsObject = Object.assign({}, treeNode.Value);
            for (const key in valueAsObject) {
                // if fake array-item added by Firebase/js (just so the array would have no holes), remove it
                //if (valueAsObject[key] == null)
                if (valueAsObject[key] === undefined) {
                    delete valueAsObject[key];
                }
            }
            if (treeNode.Value == data)
                treeNode.obj[treeNode.prop] = valueAsObject; // if changing root, we need to modify wrapper.data
            else
                js_vextensions_1.DeepSet(data, treeNode.PathStr, valueAsObject); // else, we need to use deep-set, because ancestors may have already changed during this transform/processing
        }
        // turn the should-have-been-array objects (the ones with a "0" property) into arrays
        if (standardizeForm && typeof treeNode.Value == "object" && !(treeNode.Value instanceof Array) && treeNode.Value[0] !== undefined) {
            // if changing root, we have to actually modify the prototype of the passed-in "data" object
            /*if (treeNode.Value == data) {
                Object.setPrototypeOf(data, Object.getPrototypeOf([]));
                data.length = data.VKeys(true).filter(a=>IsNumberString(a));
                continue;
            }*/
            const valueAsArray = Object.assign([], treeNode.Value);
            if (treeNode.Value == data)
                treeNode.obj[treeNode.prop] = valueAsArray; // if changing root, we need to modify wrapper.data
            else
                js_vextensions_1.DeepSet(data, treeNode.PathStr, valueAsArray); // else, we need to use deep-set, because ancestors may have already changed during this transform/processing
        }
        // add special _key or _id prop
        if (addHelpers && typeof treeNode.Value == "object") {
            const key = treeNode.prop == "_root" ? rootKey : treeNode.prop;
            if (js_vextensions_1.IsNumberString(key)) {
                //treeNode.Value._id = parseInt(key);
                //treeNode.Value._Set("_id", parseInt(key));
                Object.defineProperty(treeNode.Value, "_id", { enumerable: false, value: parseInt(key) });
            }
            // actually, always set "_key" (in case it's a "_key" that also happens to look like an "_id"/integer)
            //else {
            //treeNode.Value._key = key;
            //treeNode.Value._Set("_key", key);
            Object.defineProperty(treeNode.Value, "_key", { enumerable: false, value: key });
        }
    }
    return treeNodes[0].Value; // get possibly-modified wrapper.data
}
exports.ProcessDBData = ProcessDBData;
// these shouldn't be needed anymore, since _key and _id are stored as non-enumerable props now
/* const helperProps = ["_key", "_id"];
/** Note: this mutates the original object. *#/
export function RemoveHelpers(data) {
    var treeNodes = GetTreeNodesInObjTree(data, true);
    for (const treeNode of treeNodes) {
        if (helperProps.Contains(treeNode.prop)) { delete treeNode.obj[treeNode.prop]; }
    }
    return data;
}
export function WithoutHelpers(data) {
    return RemoveHelpers(Clone(data));
} */
function AssertValidatePath(path) {
    js_vextensions_1.Assert(!path.endsWith("/"), "Path cannot end with a slash. (This may mean a path parameter is missing)");
    js_vextensions_1.Assert(!path.includes("//"), "Path cannot contain a double-slash. (This may mean a path parameter is missing)");
}
exports.AssertValidatePath = AssertValidatePath;
function ConvertDataToValidDBUpdates(versionPath, versionData, dbUpdatesRelativeToRootPath = true) {
    /*const result = {};
    for (const {key: pathFromRoot, value: data} of rootData.Pairs()) {
        const fullPath = `${rootPath}/${pathFromRoot}`;
        const pathForDBUpdates = dbUpdatesRelativeToRootPath ? pathFromRoot : fullPath;

        // if entry`s "path" has odd number of segments (ie. points to collection), extract the children data into separate set-doc updates
        if (SplitStringBySlash_Cached(fullPath).length % 2 !== 0) {
            for (const {key, value} of data.Pairs()) {
                result[`${pathForDBUpdates}/${key}`] = value;
            }
        } else {
            result[pathForDBUpdates] = data;
        }
    }
    return result;*/
    throw new Error("Not yet implemented.");
}
exports.ConvertDataToValidDBUpdates = ConvertDataToValidDBUpdates;
async function ApplyDBUpdates(opt, rootPath, dbUpdates) {
    opt = js_vextensions_1.E(Firelink_1.defaultFireOptions, opt);
    //dbUpdates = WithoutHelpers(Clone(dbUpdates));
    dbUpdates = js_vextensions_1.Clone(dbUpdates);
    if (rootPath != null) {
        //for (const {key: localPath, value} of ObjectCE.Pairs(dbUpdates)) {
        for (const { key: localPath, value } of js_vextensions_1.ObjectCE(dbUpdates).Pairs()) {
            dbUpdates[`${rootPath}/${localPath}`] = value;
            delete dbUpdates[localPath];
        }
    }
    // temp; if only updating one field, just do it directly (for some reason, a batch takes much longer)
    const updateEntries = Object.entries(dbUpdates);
    if (updateEntries.length == 1) {
        let [path, value] = updateEntries[0];
        const [docPath, fieldPathInDoc] = PathHelpers_1.GetPathParts(path, true);
        value = js_vextensions_1.Clone(value); // picky firestore library demands "simple JSON objects"
        // [fieldPathInDoc, value] = FixSettingPrimitiveValueDirectly(fieldPathInDoc, value);
        const docRef = opt.fire.subs.firestoreDB.doc(docPath);
        if (fieldPathInDoc) {
            value = value != null ? value : firebase_1.default.firestore.FieldValue.delete();
            // await docRef.update({ [fieldPathInDoc]: value });
            // set works even if the document doesn't exist yet, so use set instead of update
            const nestedSetHelper = {};
            js_vextensions_1.DeepSet(nestedSetHelper, fieldPathInDoc, value, ".", true);
            await docRef.set(nestedSetHelper, { merge: true });
        }
        else {
            if (value) {
                await docRef.set(value);
            }
            else {
                await docRef.delete();
            }
        }
    }
    else {
        // await firestoreDB.runTransaction(async batch=> {
        const batch = opt.fire.subs.firestoreDB.batch();
        for (let [path, value] of updateEntries) {
            const [docPath, fieldPathInDoc] = PathHelpers_1.GetPathParts(path, true);
            value = js_vextensions_1.Clone(value); // picky firestore library demands "simple JSON objects"
            // [fieldPathInDoc, value] = FixSettingPrimitiveValueDirectly(fieldPathInDoc, value);
            const docRef = opt.fire.subs.firestoreDB.doc(docPath);
            if (fieldPathInDoc) {
                value = value != null ? value : firebase_1.default.firestore.FieldValue.delete();
                // batch.update(docRef, { [fieldPathInDoc]: value });
                // set works even if the document doesn't exist yet, so use set instead of update
                const nestedSetHelper = {};
                js_vextensions_1.DeepSet(nestedSetHelper, fieldPathInDoc, value, ".", true);
                batch.set(docRef, nestedSetHelper, { merge: true });
            }
            else {
                if (value) {
                    batch.set(docRef, value);
                }
                else {
                    batch.delete(docRef);
                }
            }
            /* let path_final = DBPath(path);
            let dbRef_parent = firestoreDB.doc(path_final.split("/").slice(0, -1).join("/"));
            let value_final = Clone(value); // clone value, since update() rejects values with a prototype/type
            batch.update(dbRef_parent, {[path_final.split("/").Last()]: value_final}); */
        }
        await batch.commit();
    }
}
exports.ApplyDBUpdates = ApplyDBUpdates;
exports.maxDBUpdatesPerBatch = 500;
async function ApplyDBUpdates_InChunks(opt, rootPath, dbUpdates, updatesPerChunk = exports.maxDBUpdatesPerBatch) {
    opt = js_vextensions_1.E(Firelink_1.defaultFireOptions, opt);
    const dbUpdates_pairs = js_vextensions_1.ObjectCE(dbUpdates).Pairs();
    const dbUpdates_pairs_chunks = [];
    for (let offset = 0; offset < dbUpdates_pairs.length; offset += updatesPerChunk) {
        const chunk = dbUpdates_pairs.slice(offset, offset + updatesPerChunk);
        dbUpdates_pairs_chunks.push(chunk);
    }
    for (const [index, dbUpdates_pairs_chunk] of dbUpdates_pairs_chunks.entries()) {
        const dbUpdates_chunk = dbUpdates_pairs_chunk.ToMap(a => a.key, a => a.value);
        if (dbUpdates_pairs_chunks.length > 1) {
            General_1.MaybeLog_Base(a => a.commands, l => l(`Applying db-updates chunk #${index + 1} of ${dbUpdates_pairs_chunks.length}...`));
        }
        await ApplyDBUpdates(opt, rootPath, dbUpdates_chunk);
    }
}
exports.ApplyDBUpdates_InChunks = ApplyDBUpdates_InChunks;
function ApplyDBUpdates_Local(dbData, dbUpdates) {
    let result = dbData;
    for (const { name: path, value } of js_vextensions_1.Clone(dbUpdates).Props()) {
        if (value != null) {
            result = updeep_1.default.updateIn(path.replace(/\//g, "."), updeep_1.default.constant(value), result);
        }
        else {
            result = updeep_1.default.updateIn(path.split("/").slice(0, -1).join("."), updeep_1.default.omit(path.split("/").slice(-1)), result);
        }
    }
    // firebase deletes becoming-empty collections/documents (and we pre-process-delete becoming-empty fields), so we do the same here
    const nodes = js_vextensions_1.GetTreeNodesInObjTree(result, true);
    let emptyNodes;
    do {
        emptyNodes = nodes.filter(a => typeof a.Value === "object" && (a.Value == null || a.Value.VKeys(true).length === 0));
        for (const node of emptyNodes) {
            delete node.obj[node.prop];
        }
    } while (emptyNodes.length);
    return result;
}
exports.ApplyDBUpdates_Local = ApplyDBUpdates_Local;
//# sourceMappingURL=DatabaseHelpers.js.map