import { ObservableMap } from "mobx";
import { DBShape } from "./DBShape";
import { Filter } from "./Filters";
import { FireOptions } from "./Firelink";
export declare class GetDocs_Options {
    inVersionRoot?: boolean;
    filters?: Filter[];
    useUndefinedForInProgress?: boolean;
}
export declare function GetDocs<DocT>(opt: FireOptions & GetDocs_Options, collectionPathOrGetterFunc: string | string[] | ((dbRoot: DBShape) => ObservableMap<any, DocT>)): DocT[];
export declare class GetDoc_Options {
    inVersionRoot?: boolean;
    useUndefinedForInProgress?: boolean;
}
export declare function GetDoc<DocT>(opt: FireOptions & GetDoc_Options, docPathOrGetterFunc: string | string[] | ((dbRoot: DBShape) => DocT)): DocT;
export declare function GetAsync<T>(dataGetterFunc: () => T): Promise<T>;
export declare function WithStore<T>(store: DBShape, accessorFunc: () => T): T;
