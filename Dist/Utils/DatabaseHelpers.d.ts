import { FireOptions } from "..";
import firebase from "firebase";
export declare function IsAuthValid(auth: any): boolean;
export declare function ProcessDBData(data: any, addHelpers: boolean, rootKey?: string): any;
export declare function AssertValidatePath(path: string): void;
export declare function ConvertDataToValidDBUpdates(versionPath: string, versionData: any, dbUpdatesRelativeToVersionPath?: boolean): {};
export declare function ConvertDBUpdatesToBatch(options: Partial<FireOptions>, dbUpdates: Object): firebase.firestore.WriteBatch;
export declare const maxDBUpdatesPerBatch = 500;
export declare class ApplyDBUpdates_Options {
    static default: ApplyDBUpdates_Options;
    updatesPerChunk: number;
}
export declare function ApplyDBUpdates(options: Partial<FireOptions & ApplyDBUpdates_Options>, dbUpdates: Object, rootPath_override?: string): Promise<void>;
export declare function ApplyDBUpdates_Local(dbData: any, dbUpdates: Object): any;
