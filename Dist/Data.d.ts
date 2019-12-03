import { FireOptions, DBState } from "./Firelink";
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
export declare function GetDocs<DocT>(opt: FireOptions & GetDocs_Options, collectionPathOrGetterFunc: string[] | ((dbRoot: DBState) => ObservableMap<any, DocT>)): DocT[];
export declare function GetDoc<DocT>(opt: FireOptions & GetDocs_Options, docPathOrGetterFunc: string[] | ((dbRoot: DBState) => DocT)): DocT;
export declare function GetDocs_Async<DocT>(opt: FireOptions & GetDoc_Options, collectionPathOrGetterFunc: string[] | ((dbRoot: DBState) => ObservableMap<any, DocT>)): Promise<DocT[]>;
export declare function GetDoc_Async<DocT>(opt: FireOptions & GetDoc_Options, docPathOrGetterFunc: string[] | ((dbRoot: DBState) => DocT)): Promise<DocT>;
export declare function GetAsync<T>(dataGetterFunc: () => T): Promise<T>;
export declare function WithStore<T>(store: DBState, func: () => T): T;
