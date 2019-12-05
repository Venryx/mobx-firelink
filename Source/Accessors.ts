import {E, ConvertPathGetterFuncToPropChain, IsString, DeepGet} from "js-vextensions";
import {ObservableMap} from "mobx";
import {Filter} from "./Filters";
import {FireOptions, defaultFireOptions} from "./Firelink";
import {SplitStringBySlash_Cached} from "./Utils/StringSplitCache";
import {MobXPathGetterToPath, PathOrPathGetterToPath} from "./Utils/PathHelpers";
import {DBShape} from "./DBShape";
import {TreeNode, EnsurePathWatched} from "./Tree/TreeNode";

export class GetDocs_Options {
	inVersionRoot? = true;
	filters?: Filter[];
	useUndefinedForInProgress? = false;
}
export function GetDocs<DocT>(opt: FireOptions & GetDocs_Options, collectionPathOrGetterFunc: string | string[] | ((dbRoot: DBShape)=>ObservableMap<any, DocT>)): DocT[] {
	opt = E(defaultFireOptions, opt);
	let subpath = PathOrPathGetterToPath(collectionPathOrGetterFunc);
	let path = opt.inVersionRoot ? `${opt.fire.versionPath}/${subpath}` : subpath;

	// todo: handle filters
	EnsurePathWatched(opt, path);
	
	// todo: handle opt.useUndefinedForInProgress
	//return DeepGet(opt.fire.versionData, subpath);
	let docNodesMap = opt.fire.tree.Get(path).subs as ObservableMap<string, TreeNode<any>>;
	let docNodes = Array.from(docNodesMap.values());
	let docDatas = docNodes.map(docNode=>docNode.data);
	return docDatas;
}
export async function GetDocs_Async<DocT>(opt: FireOptions & GetDocs_Options, collectionPathOrGetterFunc: string | string[] | ((dbRoot: DBShape)=>ObservableMap<any, DocT>)): Promise<DocT[]> {
	opt = E(defaultFireOptions, opt);
	// todo
}

export class GetDoc_Options {
	inVersionRoot? = true;
	useUndefinedForInProgress? = false;
}
export function GetDoc<DocT>(opt: FireOptions & GetDoc_Options, docPathOrGetterFunc: string | string[] | ((dbRoot: DBShape)=>DocT)): DocT {
	opt = E(defaultFireOptions, opt);
	let subpath = PathOrPathGetterToPath(docPathOrGetterFunc);
	let path = opt.inVersionRoot ? `${opt.fire.versionPath}/${subpath}` : subpath;

	// todo: handle opt.filters
	EnsurePathWatched(opt, path);

	// todo: handle opt.useUndefinedForInProgress
	//return DeepGet(opt.fire.versionData, subpath);
	return opt.fire.tree.Get(path).data;
}
export async function GetDoc_Async<DocT>(opt: FireOptions & GetDoc_Options, docPathOrGetterFunc: string | string[] | ((dbRoot: DBShape)=>DocT)): Promise<DocT> {
	opt = E(defaultFireOptions, opt);
	// todo
}
/* GetDocField<DocT, FieldT>(docGetterFunc: (dbRoot: DBShape)=>DocT, fieldGetterFunc: (doc: DocT)=>FieldT, suboptions?: GetDocs_Options): FieldT {
}
export async GetDocField_Async<DocT, FieldT>(docGetterFunc: (dbRoot: DBShape)=>DocT, fieldGetterFunc: (doc: DocT)=>FieldT, suboptions?: GetDocs_Options): Promise<FieldT> {
} */

// async helper
export async function GetAsync<T>(dataGetterFunc: ()=>T): Promise<T> {
}

/*async WaitTillPathDataIsReceived() {
}*/

export function WithStore<T>(store: DBShape, func: ()=>T): T {
	// todo
}