import { CE, E, Assert } from "js-vextensions";
import { defaultFireOptions } from "../Firelink.js";
import { computedFn } from "../Utils/MobXUtils/ComputedFn.js";
import { GetWait } from "./Helpers.js";
// for profiling
class StoreAccessorProfileData {
    constructor(name) {
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "callCount", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "totalRunTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "totalRunTime_asRoot", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.name = name;
        // make names the same length, for easier scanning in console listing // not needed for console.table
        //this.name = _.padEnd(name, 50, " ");
        this.callCount = 0;
        this.totalRunTime = 0;
        this.totalRunTime_asRoot = 0;
    }
}
export const storeAccessorProfileData = {};
export function LogStoreAccessorRunTimes() {
    const accessorRunTimes_ordered = CE(CE(storeAccessorProfileData).VValues()).OrderByDescending(a => a.totalRunTime);
    console.log(`Store-accessor cumulative run-times: @TotalCalls(${CE(accessorRunTimes_ordered.map(a => a.callCount)).Sum()}) @TotalTimeInRootAccessors(${CE(accessorRunTimes_ordered.map(a => a.totalRunTime_asRoot)).Sum()})`);
    //Log({}, accessorRunTimes_ordered);
    console.table(accessorRunTimes_ordered);
}
export function WithStore(options, store, accessorFunc) {
    const opt = E(defaultFireOptions, options);
    opt.fire.storeOverridesStack.push(store);
    try {
        var result = accessorFunc();
    }
    finally {
        opt.fire.storeOverridesStack.pop();
    }
    return result;
}
// for profiling
export const accessorStack = [];
export class StoreAccessorOptions {
    constructor() {
        Object.defineProperty(this, "cache", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        Object.defineProperty(this, "cache_keepAlive", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        //cache_unwrapArgs?: {[key: number]: boolean};
        //cache_unwrapArgs?: number[];
        Object.defineProperty(this, "cache_unwrapArrays", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: true
        });
        //callArgToDependencyConvertorFunc?: CallArgToDependencyConvertorFunc;
    }
}
Object.defineProperty(StoreAccessorOptions, "default", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new StoreAccessorOptions()
});
/**
Probably temp. Usage:
export const StoreAccessor_Typed = CreateStoreAccessor_Typed<RootStoreShape>();
export const GetPerson = StoreAccessor_Typed({}, ...);
*/
export function CreateStoreAccessor_Typed() {
    //return State_Base as typeof State_Base<RootStateType, any>;
    //return State_Base as StateFunc_WithWatch<RootState>;
    return StoreAccessor;
}
/**
Wrap a function with StoreAccessor if it's under the "Store/" path, and one of the following:
1) It accesses the store directly (ie. store.main.page). (thus, "WithStore(testStoreContents, ()=>GetThingFromStore())" works, without hacky overriding of project-wide "store" export)
2) It involves "heavy" processing, such that it's worth caching that processing. (rather than use computedFn directly, just standardize on StoreAccessor)
3) It involves a transformation of data into a new wrapper (ie. breaking reference equality), such that it's worth caching the processing. (to not trigger unnecessary child-ui re-renders)
*/
export const StoreAccessor = (...args) => {
    var _a;
    let name, options, accessorGetter;
    if (typeof args[0] == "function" && args.length == 1)
        [accessorGetter] = args;
    else if (typeof args[0] == "object" && args.length == 2)
        [options, accessorGetter] = args;
    else if (args.length == 2)
        [name, accessorGetter] = args;
    else
        [name, options, accessorGetter] = args;
    name = (_a = name) !== null && _a !== void 0 ? _a : "[name missing]";
    //let addProfiling = manager.devEnv; // manager isn't populated yet
    const addProfiling = window["DEV"];
    //const needsWrapper = addProfiling || options.cache;
    let accessor_forMainStore;
    let accessor_forMainStore_cacherProxy;
    const wrapperAccessor = (...callArgs) => {
        // initialize these in wrapper-accessor rather than root-func, because defaultFireOptions is usually not ready when root-func is called
        const opt = E(StoreAccessorOptions.default, options);
        let fireOpt = E(defaultFireOptions, CE(opt).IncludeKeys("fire"));
        if (addProfiling) {
            accessorStack.push(name !== null && name !== void 0 ? name : "n/a");
            var startTime = performance.now();
            //return accessor.apply(this, callArgs);
        }
        let accessor;
        const usingMainStore = fireOpt.fire.storeOverridesStack.length == 0; // || storeOverridesStack[storeOverridesStack.length - 1] == fire.rootStore;
        if (usingMainStore) {
            if (accessor_forMainStore == null) {
                Assert(fireOpt.fire.rootStore != null, "A store-accessor cannot be called before its associated Firelink instance has been set.");
                accessor_forMainStore = accessorGetter(fireOpt.fire.rootStore);
            }
            accessor = accessor_forMainStore;
        }
        else {
            accessor = accessorGetter(fireOpt.fire.storeOverridesStack.slice(-1)[0]);
        }
        if (name)
            CE(accessor).SetName(name);
        let result;
        if (opt.cache && usingMainStore && !fireOpt.fire.storeAccessorCachingTempDisabled) {
            let callArgs_unwrapped = callArgs;
            //const callArg_unwrapLengths = {};
            if (opt.cache_unwrapArrays) {
                //Assert(options.cache, "There is no point to unwrapping-args if caching is disabled.");
                // iterate in reverse order, so that we can modify the array in-place without affecting the indexes of the items we still need to unwrap
                for (let argIndex = callArgs.length - 1; argIndex >= 0; argIndex--) {
                    const callArg = callArgs[argIndex];
                    if (!Array.isArray(callArg))
                        continue;
                    // make sure we're not modifying the passed in callArgs array
                    if (callArgs_unwrapped == callArgs)
                        callArgs_unwrapped = callArgs.slice();
                    callArgs_unwrapped.splice(argIndex, 1, "$ARRAY_ITEMS_START", ...callArg, "$ARRAY_ITEMS_END");
                    //callArg_unwrapLengths[argIndex] = unwrappedValuesForCallArg.length;
                }
            }
            if (accessor_forMainStore_cacherProxy == null) {
                /*result = computedFn((...callArgs_unwrapped_2)=>{
                    return accessor(...callArgs);
                }, {name, keepAlive: opt.cache_keepAlive})(callArgs_unwrapped);*/
                let accessor_rewrapper = (...callArgs_unwrapped_2) => {
                    let callArgs_rewrapped = [];
                    let arrayBeingReconstructed = null;
                    for (let callArgOrItem of callArgs_unwrapped_2) {
                        if (callArgOrItem == "$ARRAY_ITEMS_START") {
                            Assert(arrayBeingReconstructed == null);
                            arrayBeingReconstructed = [];
                        }
                        else if (callArgOrItem == "$ARRAY_ITEMS_END") {
                            Assert(arrayBeingReconstructed != null);
                            callArgs_rewrapped.push(arrayBeingReconstructed);
                            arrayBeingReconstructed = null;
                        }
                        else {
                            if (arrayBeingReconstructed != null) {
                                arrayBeingReconstructed.push(callArgOrItem);
                            }
                            else {
                                callArgs_rewrapped.push(callArgOrItem);
                            }
                        }
                    }
                    return accessor(...callArgs_rewrapped);
                };
                if (name)
                    CE(accessor_rewrapper).SetName(name);
                accessor_forMainStore_cacherProxy = computedFn(accessor_rewrapper, { name, keepAlive: opt.cache_keepAlive });
                if (name)
                    CE(accessor_forMainStore_cacherProxy).SetName(name);
            }
            result = accessor_forMainStore_cacherProxy(...callArgs_unwrapped);
        }
        else {
            result = accessor(...callArgs);
        }
        if (addProfiling) {
            const runTime = performance.now() - startTime;
            const profileData = storeAccessorProfileData[name] || (storeAccessorProfileData[name] = new StoreAccessorProfileData(name));
            profileData.callCount++;
            profileData.totalRunTime += runTime;
            if (accessorStack.length == 1) {
                profileData.totalRunTime_asRoot += runTime;
            }
            // name should have been added by webpack transformer, but if not, give some info to help debugging (under key "null")
            if (name == "[name missing]") {
                profileData["origAccessors"] = profileData["origAccessors"] || [];
                if (!profileData["origAccessors"].Contains(accessorGetter)) {
                    profileData["origAccessors"].push(accessorGetter);
                }
            }
            CE(accessorStack).RemoveAt(accessorStack.length - 1);
        }
        return result;
    };
    // Func.Wait(thing) is shortcut for GetWait(()=>Func(thing))
    wrapperAccessor.Wait = (...callArgs) => {
        // initialize these in wrapper-accessor rather than root-func, because defaultFireOptions is usually not ready when root-func is called
        const opt = E(StoreAccessorOptions.default, options);
        let fireOpt = E(defaultFireOptions, CE(opt).IncludeKeys("fire"));
        return GetWait(() => wrapperAccessor(...callArgs), fireOpt);
    };
    //if (name) wrapperAccessor["displayName"] = name;
    //if (name) Object.defineProperty(wrapperAccessor, "name", {value: name});
    if (name)
        CE(wrapperAccessor).SetName(name);
    return wrapperAccessor;
};
