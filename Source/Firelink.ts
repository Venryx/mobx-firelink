import {ObservableMap} from "mobx";
import {Filter} from "./Filters";
import {Assert} from "js-vextensions";

export class GetDocs_Options {
	inVersionRoot? = true;
	filters?: Filter[];
	useUndefinedForInProgress? = false;
}
export class GetDoc_Options {
	inVersionRoot? = true;
	useUndefinedForInProgress? = false;
}

export class Firelink<DBState> {
	constructor(dbVersion: number, dbEnv_short: string) {
		this.rootPathSegments = ["versions", `v${dbVersion}-${dbEnv_short}`];
		this.rootPath = `versions/v${dbVersion}-${dbEnv_short}`;
	}

	subs: {
		firestoreDB: any;
	};

	rootPathSegments: string[];
	rootPath: string;
	DBPath(path = "", inVersionRoot = true) {
		Assert(path != null, "Path cannot be null.");
		Assert(typeof path == "string", "Path must be a string.");
		/*let versionPrefix = path.match(/^v[0-9]+/);
		if (versionPrefix == null) // if no version prefix already, add one (referencing the current version)*/
		if (inVersionRoot) {
			path = `${this.rootPath}${path ? `/${path}` : ""}`;
		}
		return path;
	}
	DBPathSegments(pathSegments: (string | number)[], inVersionRoot = true) {
		let result = pathSegments;
		if (inVersionRoot) {
			result = this.rootPathSegments.concat(result as any);
		}
		return result;
	}

	GetDocs<DocT>(collectionPathOrGetterFunc: string[] | ((dbRoot: DBState)=>ObservableMap<any, DocT>), options?: GetDocs_Options): DocT[] {
	}
	GetDoc<DocT>(docPathOrGetterFunc: string[] | ((dbRoot: DBState)=>DocT), options?: GetDoc_Options): DocT {
	}
	/* GetDocField<DocT, FieldT>(docGetterFunc: (dbRoot: DBState)=>DocT, fieldGetterFunc: (doc: DocT)=>FieldT, suboptions?: GetDocs_Options): FieldT {
	} */

	// async versions
	async GetDocs_Async<DocT>(collectionPathOrGetterFunc: string[] | ((dbRoot: DBState)=>ObservableMap<any, DocT>), options?: GetDocs_Options): Promise<DocT[]> {
	}
	async GetDoc_Async<DocT>(docPathOrGetterFunc: string[] | ((dbRoot: DBState)=>DocT), options?: GetDoc_Options): Promise<DocT> {
	}
	/* async GetDocField_Async<DocT, FieldT>(docGetterFunc: (dbRoot: DBState)=>DocT, fieldGetterFunc: (doc: DocT)=>FieldT, suboptions?: GetDocs_Options): Promise<FieldT> {
	} */

	// async helper
	async GetAsync<T>(dataGetterFunc: ()=>T): Promise<T> {
	}

	/*async WaitTillPathDataIsReceived() {
	}*/

	WithStore<T>(store: DBState, func: ()=>T): T {
		// todo
	}
}