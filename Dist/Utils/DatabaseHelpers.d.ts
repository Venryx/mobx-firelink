import { FireOptions } from "..";
export declare function IsAuthValid(auth: any): boolean;
export declare function ProcessDBData(data: any, standardizeForm: boolean, addHelpers: boolean, rootKey: string): any;
export declare function AssertValidatePath(path: string): void;
export declare function ConvertDataToValidDBUpdates(versionPath: string, versionData: any, dbUpdatesRelativeToVersionPath?: boolean): {};
export declare function ApplyDBUpdates(options: Partial<FireOptions>, dbUpdates: Object, rootPath_override?: string): Promise<void>;
export declare const maxDBUpdatesPerBatch = 500;
export declare function ApplyDBUpdates_InChunks(options: Partial<FireOptions>, dbUpdates: Object, rootPath_override?: string, updatesPerChunk?: number): Promise<void>;
export declare function ApplyDBUpdates_Local(dbData: any, dbUpdates: Object): any;
