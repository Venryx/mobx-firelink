import { FireOptions } from "../Firelink.js";
import { RootStoreShape } from "../UserTypes.js";
declare class StoreAccessorProfileData {
    constructor(name: string);
    name: string;
    callCount: number;
    totalRunTime: number;
    totalRunTime_asRoot: number;
}
export declare const storeAccessorProfileData: {
    [key: string]: StoreAccessorProfileData;
};
export declare function LogStoreAccessorRunTimes(): void;
export declare function WithStore<T>(options: Partial<FireOptions>, store: any, accessorFunc: () => T): T;
export declare const accessorStack: string[];
export declare class StoreAccessorOptions {
    static default: StoreAccessorOptions;
    cache: boolean;
    cache_keepAlive: boolean;
    cache_unwrapArrays: boolean;
}
export type CallArgToDependencyConvertorFunc = (callArgs: any[]) => any[];
interface StoreAccessorFunc<RootState_PreSet = RootStoreShape> {
    <Func extends Function, RootState = RootState_PreSet>(accessor: (s: RootState) => Func): Func & {
        Wait: Func;
    };
    <Func extends Function, RootState = RootState_PreSet>(options: Partial<FireOptions<RootState> & StoreAccessorOptions>, accessor: (s: RootState) => Func): Func & {
        Wait: Func;
    };
    <Func extends Function, RootState = RootState_PreSet>(name: string, accessor: (s: RootState) => Func): Func & {
        Wait: Func;
    };
    <Func extends Function, RootState = RootState_PreSet>(name: string, options: Partial<FireOptions<RootState> & StoreAccessorOptions>, accessor: (s: RootState) => Func): Func & {
        Wait: Func;
    };
}
/**
Probably temp. Usage:
export const StoreAccessor_Typed = CreateStoreAccessor_Typed<RootStoreShape>();
export const GetPerson = StoreAccessor_Typed({}, ...);
*/
export declare function CreateStoreAccessor_Typed<RootState>(): StoreAccessorFunc<RootState>;
/**
Wrap a function with StoreAccessor if it's under the "Store/" path, and one of the following:
1) It accesses the store directly (ie. store.main.page). (thus, "WithStore(testStoreContents, ()=>GetThingFromStore())" works, without hacky overriding of project-wide "store" export)
2) It involves "heavy" processing, such that it's worth caching that processing. (rather than use computedFn directly, just standardize on StoreAccessor)
3) It involves a transformation of data into a new wrapper (ie. breaking reference equality), such that it's worth caching the processing. (to not trigger unnecessary child-ui re-renders)
*/
export declare const StoreAccessor: StoreAccessorFunc;
export {};
