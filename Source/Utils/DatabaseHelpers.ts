import {DeepSet, IsNumberString, Assert, StringCE, Clone, ObjectCE, ArrayCE, GetTreeNodesInObjTree, E} from "js-vextensions";
import u from "updeep";
import {MaybeLog_Base} from "./General";
import {FireOptions} from "..";
import {defaultFireOptions} from "../Firelink";
import firebase from "firebase";
import {GetPathParts} from "./PathHelpers";

export function IsAuthValid(auth) {
	return auth && !auth.isEmpty;
}

/* Object.prototype._AddFunction_Inline = function DBRef(path = "", inVersionRoot = true) {
	const finalPath = DBPath(path, inVersionRoot);
	return this.ref(finalPath);
}; */

export function ProcessDBData(data, standardizeForm: boolean, addHelpers: boolean, rootKey: string) {
	if (data == null) return;
	var treeNodes = GetTreeNodesInObjTree(data, true);
	for (const treeNode of treeNodes) {
		if (treeNode.Value == null) continue;

		// turn the should-not-have-been-array arrays (the ones without a "0" property) into objects
		//if (standardizeForm && treeNode.Value instanceof Array && treeNode.Value[0] === undefined) {

		// turn the should-not-have-been-array arrays (the ones with non-number property) into objects
		if (standardizeForm && treeNode.Value instanceof Array && ArrayCE(ObjectCE(treeNode.Value).VKeys(true)).Any(a=>!IsNumberString(a))) {
			// if changing root, we have to actually modify the prototype of the passed-in "data" object
			/*if (treeNode.Value == data) {
				Object.setPrototypeOf(data, Object.getPrototypeOf({}));
				for (var key of Object.keys(data)) {
					if (data[key] === undefined)
						delete data[key];
				}
				continue;
			}*/

			const valueAsObject = Object.assign({}, treeNode.Value) as any;
			for (const key in valueAsObject) {
				// if fake array-item added by Firebase/js (just so the array would have no holes), remove it
				//if (valueAsObject[key] == null)
				if (valueAsObject[key] === undefined) { delete valueAsObject[key]; }
			}

			if (treeNode.Value == data) treeNode.obj[treeNode.prop] = valueAsObject; // if changing root, we need to modify wrapper.data
			else DeepSet(data, treeNode.PathStr, valueAsObject); // else, we need to use deep-set, because ancestors may have already changed during this transform/processing
		}

		// turn the should-have-been-array objects (the ones with a "0" property) into arrays
		if (standardizeForm && typeof treeNode.Value == "object" && !(treeNode.Value instanceof Array) && treeNode.Value[0] !== undefined) {
			// if changing root, we have to actually modify the prototype of the passed-in "data" object
			/*if (treeNode.Value == data) {
				Object.setPrototypeOf(data, Object.getPrototypeOf([]));
				data.length = data.VKeys(true).filter(a=>IsNumberString(a));
				continue;
			}*/

			const valueAsArray = Object.assign([], treeNode.Value) as any;

			if (treeNode.Value == data) treeNode.obj[treeNode.prop] = valueAsArray; // if changing root, we need to modify wrapper.data
			else DeepSet(data, treeNode.PathStr, valueAsArray); // else, we need to use deep-set, because ancestors may have already changed during this transform/processing
		}

		// add special _key or _id prop
		if (addHelpers && typeof treeNode.Value == "object") {
			const key = treeNode.prop == "_root" ? rootKey : treeNode.prop;
			if (IsNumberString(key)) {
				//treeNode.Value._id = parseInt(key);
				//treeNode.Value._Set("_id", parseInt(key));
				Object.defineProperty(treeNode.Value, "_id", {enumerable: false, value: parseInt(key)});
			}

			// actually, always set "_key" (in case it's a "_key" that also happens to look like an "_id"/integer)
			//else {
			//treeNode.Value._key = key;
			//treeNode.Value._Set("_key", key);
			Object.defineProperty(treeNode.Value, "_key", {enumerable: false, value: key});
		}
	}
	return treeNodes[0].Value; // get possibly-modified wrapper.data
}

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

export function AssertValidatePath(path: string) {
	Assert(!path.endsWith("/"), "Path cannot end with a slash. (This may mean a path parameter is missing)");
	Assert(!path.includes("//"), "Path cannot contain a double-slash. (This may mean a path parameter is missing)");
}

export function ConvertDataToValidDBUpdates(versionPath: string, versionData: any, dbUpdatesRelativeToRootPath = true) {
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

export async function ApplyDBUpdates(options: Partial<FireOptions>, rootPath: string, dbUpdates: Object) {
	const opt = E(defaultFireOptions, options) as FireOptions;
	//dbUpdates = WithoutHelpers(Clone(dbUpdates));
	dbUpdates = Clone(dbUpdates);
	if (rootPath != null) {
		//for (const {key: localPath, value} of ObjectCE.Pairs(dbUpdates)) {
		for (const {key: localPath, value} of ObjectCE(dbUpdates).Pairs()) {
			dbUpdates[`${rootPath}/${localPath}`] = value;
			delete dbUpdates[localPath];
		}
	}

	// temp; if only updating one field, just do it directly (for some reason, a batch takes much longer)
	const updateEntries = (Object as any).entries(dbUpdates);
	if (updateEntries.length == 1) {
		let [path, value] = updateEntries[0];
		const [docPath, fieldPathInDoc] = GetPathParts(path, true);
		value = Clone(value); // picky firestore library demands "simple JSON objects"

		// [fieldPathInDoc, value] = FixSettingPrimitiveValueDirectly(fieldPathInDoc, value);

		const docRef = opt.fire.subs.firestoreDB.doc(docPath);
		if (fieldPathInDoc) {
			value = value != null ? value : firebase.firestore.FieldValue.delete();

			// await docRef.update({ [fieldPathInDoc]: value });
			// set works even if the document doesn't exist yet, so use set instead of update
			const nestedSetHelper = {};
			DeepSet(nestedSetHelper, fieldPathInDoc, value, ".", true);
			await docRef.set(nestedSetHelper, {merge: true});
		} else {
			if (value) {
				await docRef.set(value);
			} else {
				await docRef.delete();
			}
		}
	} else {
		// await firestoreDB.runTransaction(async batch=> {
		const batch = opt.fire.subs.firestoreDB.batch();
		for (let [path, value] of updateEntries) {
			const [docPath, fieldPathInDoc] = GetPathParts(path, true);
			value = Clone(value); // picky firestore library demands "simple JSON objects"

			// [fieldPathInDoc, value] = FixSettingPrimitiveValueDirectly(fieldPathInDoc, value);

			const docRef = opt.fire.subs.firestoreDB.doc(docPath);
			if (fieldPathInDoc) {
				value = value != null ? value : firebase.firestore.FieldValue.delete();

				// batch.update(docRef, { [fieldPathInDoc]: value });
				// set works even if the document doesn't exist yet, so use set instead of update
				const nestedSetHelper = {};
				DeepSet(nestedSetHelper, fieldPathInDoc, value, ".", true);
				batch.set(docRef, nestedSetHelper, {merge: true});
			} else {
				if (value) {
					batch.set(docRef, value);
				} else {
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

export const maxDBUpdatesPerBatch = 500;
export async function ApplyDBUpdates_InChunks(options: Partial<FireOptions>, rootPath: string, dbUpdates: Object, updatesPerChunk = maxDBUpdatesPerBatch) {
	const opt = E(defaultFireOptions, options) as FireOptions;
	const dbUpdates_pairs = ObjectCE(dbUpdates).Pairs();

	const dbUpdates_pairs_chunks = [] as any[];
	for (let offset = 0; offset < dbUpdates_pairs.length; offset += updatesPerChunk) {
		const chunk = dbUpdates_pairs.slice(offset, offset + updatesPerChunk);
		dbUpdates_pairs_chunks.push(chunk);
	}

	for (const [index, dbUpdates_pairs_chunk] of dbUpdates_pairs_chunks.entries()) {
		const dbUpdates_chunk = dbUpdates_pairs_chunk.ToMap(a=>a.key, a=>a.value);
		if (dbUpdates_pairs_chunks.length > 1) {
			MaybeLog_Base(a=>a.commands, l=>l(`Applying db-updates chunk #${index + 1} of ${dbUpdates_pairs_chunks.length}...`));
		}
		await ApplyDBUpdates(opt, rootPath, dbUpdates_chunk);
	}
}

export function ApplyDBUpdates_Local(dbData: any, dbUpdates: Object) {
	let result = dbData;
	for (const {name: path, value} of Clone(dbUpdates).Props()) {
		if (value != null) {
			result = u.updateIn(path.replace(/\//g, "."), u.constant(value), result);
		} else {
			result = u.updateIn(path.split("/").slice(0, -1).join("."), u.omit(path.split("/").slice(-1)), result);
		}
	}

	// firebase deletes becoming-empty collections/documents (and we pre-process-delete becoming-empty fields), so we do the same here
	const nodes = GetTreeNodesInObjTree(result, true);
	let emptyNodes;
	do {
		emptyNodes = nodes.filter(a=>typeof a.Value === "object" && (a.Value == null || a.Value.VKeys(true).length === 0));
		for (const node of emptyNodes) {
			delete node.obj[node.prop];
		}
	} while (emptyNodes.length);

	return result;
}