import { ObservableMap } from "mobx";
import { DBShape } from "../UserTypes";
import { Filter } from "../Filters";
import { FireOptions } from "../Firelink";
export declare class GetDocs_Options {
    static default: GetDocs_Options;
    inLinkRoot?: boolean | undefined;
    filters?: Filter[];
    useUndefinedForInProgress?: boolean | undefined;
}
export declare function GetDocs<DB = DBShape, DocT = any>(opt: FireOptions<any, DB> & GetDocs_Options, collectionPathOrGetterFunc: string | string[] | ((dbRoot: DB) => ObservableMap<any, DocT>)): DocT[];
export declare class GetDoc_Options {
    static default: GetDoc_Options;
    inLinkRoot?: boolean | undefined;
    useUndefinedForInProgress?: boolean | undefined;
}
export declare function GetDoc<DB = DBShape, DocT = any>(opt: FireOptions<any, DB> & GetDoc_Options, docPathOrGetterFunc: string | string[] | ((dbRoot: DB) => DocT)): DocT | n;
export declare function GetAsync<T>(dataGetterFunc: () => T, opt?: FireOptions & GetDoc_Options): Promise<T>;
