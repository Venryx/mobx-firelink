export interface DBState {
}
export declare let defaultFireOptions: FireOptions;
export declare function SetDefaultFireOptions(opt: FireOptions): void;
export interface FireOptions {
    fire?: Firelink<any>;
}
export declare class Firelink<DBState> {
    constructor(dbVersion: number, dbEnv_short: string);
    subs: {
        firestoreDB: any;
    };
    rootData: any;
    versionPathSegments: string[];
    versionPath: string;
    versionData: DBState;
    ValidateDBData: (dbData: DBState) => void;
}
