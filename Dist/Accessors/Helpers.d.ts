import { FireOptions } from "../Firelink.js";
/** Accessor wrapper which throws an error if one of the base db-requests is still loading. (to be used in Command.Validate functions) */
export declare function GetWait<T>(dataGetterFunc: () => T, options?: Partial<FireOptions>): T;
/** reject: caller of "await GetAsync()" receives the error, log: catch error and log it, ignore: catch error */
export declare type GetAsync_ErrorHandleType = "rejectAndLog" | "reject" | "log" | "ignore";
export declare class GetAsync_Options {
    static default: GetAsync_Options;
    /** Just meant to alert us for infinite-loop-like calls/getter-funcs. Default: 50 [pretty arbitrary] */
    maxIterations?: number | undefined;
    /** How to handle errors that occur in accessor, when there are still db-requests in progress. (ie. when accessor is still progressing) */
    errorHandling_during?: GetAsync_ErrorHandleType | undefined;
    /** How to handle errors that occur in accessor, when no db-requests are still in progress. (ie. on final accessor call) */
    errorHandling_final?: GetAsync_ErrorHandleType | undefined;
    /** If true, db requests within dataGetterFunc that find themselves waiting for remote db-data, with throw an error immediately. (avoiding higher-level processing) */
    throwImmediatelyOnDBWait?: boolean | undefined;
}
export declare let GetAsync_throwImmediatelyOnDBWait_activeDepth: number;
export declare function NotifyWaitingForDB(dbPath: string): void;
export declare function GetAsync<T>(dataGetterFunc: () => T, options?: Partial<FireOptions> & GetAsync_Options): Promise<T>;
export declare let AssertV_triggerDebugger: boolean;
/** Variant of Assert, which does not trigger the debugger. (to be used in mobx-firelink Command.Validate functions, since it's okay/expected for those to fail asserts) */
export declare function AssertV(condition: any, messageOrMessageFunc?: string | Function): condition is true;
export declare const AV: ((propName: string) => AVWrapper) & {
    NonNull_<T>(value: T): T;
    NonNull: any;
};
declare class AVWrapper {
    propName: string;
    static generic: AVWrapper;
    constructor(propName: string);
    NonNull_<T>(value: T): T;
    set NonNull(value: any);
}
export {};
