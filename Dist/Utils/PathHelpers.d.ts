import { FireOptions } from "../Firelink";
import { DBShape } from "../UserTypes";
export declare function VPathToFBPath(vPath: string): string;
export declare function FBPathToVPath(fbPath: string): string;
export declare function VFieldPathToFBFieldPath(vFieldPath: string): string;
export declare function FBFieldPathToVFieldPath(vFieldPath: string): string;
/**
 * @param asFBPath If true, returned paths are separated with "."; if false, by "/". Default: false
 * @returns [colOrDocPath, fieldPathInDoc]
 * */
export declare function GetPathParts(path: string, asFBPath?: boolean): [string, string];
export declare function DBPath(opt: FireOptions, path?: string, inLinkRoot?: boolean): string;
export declare function DBPathSegments(opt: FireOptions, pathSegments: (string | number)[], inLinkRoot?: boolean): import("updeep/types/types").PathPart[];
export declare function SlicePath(path: string, removeFromEndCount: number, ...itemsToAdd: string[]): string;
export declare function PathOrPathGetterToPath(pathOrPathSegmentsOrPathGetter: string | string[] | ((placeholder: any) => any)): string;
export declare function PathOrPathGetterToPathSegments(pathOrPathSegmentsOrPathGetter: string | string[] | ((placeholder: any) => any)): any[];
export declare function MobXPathGetterToPath(pathGetterFunc: (dbRoot: DBShape) => any): string;
export declare function MobXPathGetterToPathSegments(pathGetterFunc: (dbRoot: DBShape) => any): string[];