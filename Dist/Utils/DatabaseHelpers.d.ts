import { FireOptions } from "..";
import { firestore } from "firebase";
export declare function IsAuthValid(auth: any): boolean;
export declare function ProcessDBData(data: any, addHelpers: boolean, rootKey?: string): any;
export declare function AssertValidatePath(path: string): void;
export declare function ConvertDataToValidDBUpdates(versionPath: string, versionData: any, dbUpdatesRelativeToVersionPath?: boolean): {};
export declare class DBValueWrapper {
    value: any;
    merge: boolean;
}
export declare function WrapDBValue(value: any, otherFlags: Partial<Omit<DBValueWrapper, "value">>): DBValueWrapper;
export declare function ConvertDBUpdatesToBatch(options: Partial<FireOptions>, dbUpdates: Object): firestore.WriteBatch;
export declare const maxDBUpdatesPerBatch = 500;
export declare class ApplyDBUpdates_Options {
    static default: ApplyDBUpdates_Options;
    updatesPerChunk: number;
}
export declare function FinalizeDBUpdates(options: Partial<FireOptions & ApplyDBUpdates_Options>, dbUpdates: Object, rootPath_override?: string): Object;
export declare function ApplyDBUpdates(options: Partial<FireOptions & ApplyDBUpdates_Options>, dbUpdates: Object, rootPath_override?: string): Promise<void>;
export declare function ApplyDBUpdates_Local(dbData: any, dbUpdates: Object): any;
export declare type QuickBackup = {
    [key: string]: {
        oldData: any;
        newData: any;
    };
};
export declare function MakeQuickBackupForDBUpdates(options: Partial<FireOptions & ApplyDBUpdates_Options>, dbUpdates: Object, rootPath_override?: string, log?: boolean, download?: boolean): Promise<QuickBackup>;
/**
Restores the old-values for the paths listed in the quick-backup.
Note: Uses the *absolute paths* listed; to restore to a different version-root, transform the quick-backup data.
*/
export declare function RestoreQuickBackup(options: Partial<FireOptions & ApplyDBUpdates_Options>, quickBackup: QuickBackup): Promise<void>;
