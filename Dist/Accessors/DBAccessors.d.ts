import { ObservableMap } from "mobx";
import { FireOptions } from "../Firelink.js";
import { QueryOp } from "../QueryOps.js";
import { DBShape } from "../UserTypes.js";
export declare class GetDocs_Options {
    static default: GetDocs_Options;
    inLinkRoot?: boolean | undefined;
    queryOps?: QueryOp[];
    resultForLoading?: any[] | undefined;
}
export declare function GetDocs<DB = DBShape, DocT = any>(options: Partial<FireOptions<any, DB>> & GetDocs_Options, collectionPathOrGetterFunc: string | string[] | ((dbRoot: DB) => ObservableMap<any, DocT>)): DocT[];
export declare class GetDoc_Options {
    static default: GetDoc_Options;
    inLinkRoot?: boolean | undefined;
    resultForLoading?: undefined;
}
export declare function GetDoc<DB = DBShape, DocT = any>(options: Partial<FireOptions<any, DB>> & GetDoc_Options, docPathOrGetterFunc: string | string[] | ((dbRoot: DB) => DocT)): DocT | null | undefined;
