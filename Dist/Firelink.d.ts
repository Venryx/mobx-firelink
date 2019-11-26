import { ObservableMap } from "mobx";
import { Filter } from "./Filters";
export declare class GetDocs_Options {
    inVersionRoot?: boolean;
    filters?: Filter[];
    useUndefinedForInProgress?: boolean;
}
export declare class GetDoc_Options {
    inVersionRoot?: boolean;
    useUndefinedForInProgress?: boolean;
}
export declare class Firelink<DBState> {
    constructor(dbVersion: number, dbEnv_short: string);
    subs: {
        firestoreDB: any;
    };
    rootPathSegments: string[];
    rootPath: string;
    DBPath(path?: string, inVersionRoot?: boolean): string;
    DBPathSegments(pathSegments: (string | number)[], inVersionRoot?: boolean): (string | number)[];
    GetDocs<DocT>(collectionPathOrGetterFunc: string[] | ((dbRoot: DBState) => ObservableMap<any, DocT>), options?: GetDocs_Options): DocT[];
    GetDoc<DocT>(docPathOrGetterFunc: string[] | ((dbRoot: DBState) => DocT), options?: GetDoc_Options): DocT;
    GetDocs_Async<DocT>(collectionPathOrGetterFunc: string[] | ((dbRoot: DBState) => ObservableMap<any, DocT>), options?: GetDocs_Options): Promise<DocT[]>;
    GetDoc_Async<DocT>(docPathOrGetterFunc: string[] | ((dbRoot: DBState) => DocT), options?: GetDoc_Options): Promise<DocT>;
    GetAsync<T>(dataGetterFunc: () => T): Promise<T>;
    WithStore<T>(store: DBState, func: () => T): T;
}
