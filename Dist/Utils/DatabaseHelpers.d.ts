import { FireOptions } from "..";
export declare function IsAuthValid(auth: any): boolean;
export declare function ProcessDBData(data: any, standardizeForm: boolean, addHelpers: boolean, rootKey: string): any;
export declare function AssertValidatePath(path: string): void;
export declare function ConvertDataToValidDBUpdates(versionPath: string, versionData: any, dbUpdatesRelativeToRootPath?: boolean): void;
export declare function ApplyDBUpdates(opt: FireOptions, rootPath: string, dbUpdates: Object): Promise<void>;
export declare const maxDBUpdatesPerBatch = 500;
export declare function ApplyDBUpdates_InChunks(opt: FireOptions, rootPath: string, dbUpdates: Object, updatesPerChunk?: number): Promise<void>;
export declare function ApplyDBUpdates_Local(dbData: any, dbUpdates: Object): any;
