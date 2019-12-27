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
export declare function GetDocs<DB = DBShape, DocT = any>(options: Partial<FireOptions<any, DB>> & GetDocs_Options, collectionPathOrGetterFunc: string | string[] | ((dbRoot: DB) => ObservableMap<any, DocT>)): DocT[];
export declare class GetDoc_Options {
    static default: GetDoc_Options;
    inLinkRoot?: boolean | undefined;
    useUndefinedForInProgress?: boolean | undefined;
}
export declare function GetDoc<DB = DBShape, DocT = any>(options: Partial<FireOptions<any, DB>> & GetDoc_Options, docPathOrGetterFunc: string | string[] | ((dbRoot: DB) => DocT)): DocT | n;
export declare class GetAsync_Options {
    static default: GetAsync_Options;
    errorHandling?: "none" | "ignore" | "log" | undefined;
}
export declare function GetAsync<T>(dataGetterFunc: () => T, options?: Partial<FireOptions> & GetAsync_Options): Promise<T>;
/** Variant of Assert, which does not trigger the debugger. (to be used in mobx-firelink Command.Validate functions, since it's okay/expected for those to fail asserts) */
export declare let AssertV_triggerDebugger: boolean;
export declare function AssertV(condition: any, messageOrMessageFunc?: string | Function): condition is true;
export declare let storeAccessorCachingTempDisabled: boolean;
