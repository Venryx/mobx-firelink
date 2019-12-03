import {ObservableMap} from "mobx";
import {Filter} from "./Filters";
import {Assert} from "js-vextensions";
import {UserInfo} from "os";

// should be extended by user project
export interface DBState {
}

export let defaultFireOptions: FireOptions;
export function SetDefaultFireOptions(opt: FireOptions) {
	defaultFireOptions = opt;
}
export interface FireOptions {
	fire?: Firelink<any>;
}

export class FireUserInfo {
	id: string;
}

export class Firelink<DBState> {
	constructor(dbVersion: number, dbEnv_short: string) {
		this.versionPathSegments = ["versions", `v${dbVersion}-${dbEnv_short}`];
		this.versionPath = `versions/v${dbVersion}-${dbEnv_short}`;
	}

	subs: {
		firestoreDB: any;
	};

	userInfo: FireUserInfo;

	rootData: any;
	versionPathSegments: string[];
	versionPath: string;
	versionData: DBState;

	ValidateDBData: (dbData: DBState)=>void;
}