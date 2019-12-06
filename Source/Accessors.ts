import {E, ShallowChanged} from "js-vextensions";
import {ObservableMap, autorun, when} from "mobx";
import {DBShape} from "./DBShape";
import {Filter} from "./Filters";
import {defaultFireOptions, FireOptions} from "./Firelink";
import {TreeNode, DataStatus, QueryRequest} from "./Tree/TreeNode";
import {PathOrPathGetterToPath} from "./Utils/PathHelpers";
import {TreeRequestWatcher} from "./Tree/TreeRequestWatcher";

export class GetDocs_Options {
	static default = new GetDocs_Options();
	inVersionRoot? = true;
	filters?: Filter[];
	useUndefinedForInProgress? = false;
}
export function GetDocs<DocT>(opt: FireOptions & GetDocs_Options, collectionPathOrGetterFunc: string | string[] | ((dbRoot: DBShape)=>ObservableMap<any, DocT>)): DocT[] {
	opt = E(defaultFireOptions, GetDocs_Options.default, opt);
	let subpath = PathOrPathGetterToPath(collectionPathOrGetterFunc);
	let path = opt.inVersionRoot ? `${opt.fire.versionPath}/${subpath}` : subpath;
	let treeNode = opt.fire.tree.Get(path, opt.filters ? new QueryRequest({filters: opt.filters}) : null);
	treeNode.Request();
	
	// todo: handle opt.useUndefinedForInProgress
	let docNodes = Array.from(treeNode.docNodes.values());
	let docDatas = docNodes.map(docNode=>docNode.data);
	return docDatas;
}
/*export async function GetDocs_Async<DocT>(opt: FireOptions & GetDocs_Options, collectionPathOrGetterFunc: string | string[] | ((dbRoot: DBShape)=>ObservableMap<any, DocT>)): Promise<DocT[]> {
	opt = E(defaultFireOptions, opt);
	return GetAsync(()=>GetDocs_Async(opt, collectionPathOrGetterFunc));
}*/

export class GetDoc_Options {
	static default = new GetDoc_Options();
	inVersionRoot? = true;
	useUndefinedForInProgress? = false;
}
export function GetDoc<DocT>(opt: FireOptions & GetDoc_Options, docPathOrGetterFunc: string | string[] | ((dbRoot: DBShape)=>DocT)): DocT {
	opt = E(defaultFireOptions, GetDoc_Options.default, opt);
	let subpath = PathOrPathGetterToPath(docPathOrGetterFunc);
	let path = opt.inVersionRoot ? `${opt.fire.versionPath}/${subpath}` : subpath;
	let treeNode = opt.fire.tree.Get(path);
	treeNode.Request();

	// todo: handle opt.useUndefinedForInProgress
	//return DeepGet(opt.fire.versionData, subpath);
	return treeNode.data;
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
export async function GetAsync<T>(dataGetterFunc: ()=>T, opt?: FireOptions & GetDoc_Options): Promise<T> {
	opt = E(defaultFireOptions, opt);
	let lastResult;
	let watcher = new TreeRequestWatcher(opt.fire);

	let nodesRequested_obj_last = {};
	do {
		watcher.Start();
		//let dispose = autorun(()=> {
		lastResult = dataGetterFunc();
		//});
		//dispose();
		watcher.Stop();

		var nodesRequested_array = Array.from(watcher.nodesRequested);
		var nodesRequested_obj = nodesRequested_array.reduce((acc, item)=>acc[item.path] = true, {});

		// wait till all requested nodes have their data received
		await Promise.all(nodesRequested_array.map(node=> {
			return when(()=>node.status == DataStatus.Received);
		}));
	} while (ShallowChanged(nodesRequested_obj, nodesRequested_obj_last));

	return lastResult;
}

/*export function WithStore<T>(store: DBShape, accessorFunc: ()=>T): T {
	// todo
}*/