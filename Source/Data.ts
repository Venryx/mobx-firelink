import {E} from "js-vextensions";
import {defaultFireOptions, FireOptions, DBState} from "./Firelink";
import {ObservableMap} from "mobx";
import {Filter} from "./Filters";

export class GetDocs_Options {
	inVersionRoot? = true;
	filters?: Filter[];
	useUndefinedForInProgress? = false;
}
export function GetDocs<DocT>(opt: FireOptions & GetDocs_Options, collectionPathOrGetterFunc: string[] | ((dbRoot: DBState)=>ObservableMap<any, DocT>)): DocT[] {
	opt = E(defaultFireOptions, opt);
}
export async function GetDocs_Async<DocT>(opt: FireOptions & GetDoc_Options, collectionPathOrGetterFunc: string[] | ((dbRoot: DBState)=>ObservableMap<any, DocT>)): Promise<DocT[]> {
	opt = E(defaultFireOptions, opt);
}

export class GetDoc_Options {
	inVersionRoot? = true;
	useUndefinedForInProgress? = false;
}
export function GetDoc<DocT>(opt: FireOptions & GetDocs_Options, docPathOrGetterFunc: string[] | ((dbRoot: DBState)=>DocT)): DocT {
	opt = E(defaultFireOptions, opt);
}
export async function GetDoc_Async<DocT>(opt: FireOptions & GetDoc_Options, docPathOrGetterFunc: string[] | ((dbRoot: DBState)=>DocT)): Promise<DocT> {
	opt = E(defaultFireOptions, opt);
}
/* GetDocField<DocT, FieldT>(docGetterFunc: (dbRoot: DBState)=>DocT, fieldGetterFunc: (doc: DocT)=>FieldT, suboptions?: GetDocs_Options): FieldT {
}
export async GetDocField_Async<DocT, FieldT>(docGetterFunc: (dbRoot: DBState)=>DocT, fieldGetterFunc: (doc: DocT)=>FieldT, suboptions?: GetDocs_Options): Promise<FieldT> {
} */

// async helper
export async function GetAsync<T>(dataGetterFunc: ()=>T): Promise<T> {
}

/*async WaitTillPathDataIsReceived() {
}*/

export function WithStore<T>(store: DBState, func: ()=>T): T {
	// todo
}