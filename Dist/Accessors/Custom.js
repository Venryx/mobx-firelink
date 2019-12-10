"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mobx_utils_1 = require("mobx-utils");
const js_vextensions_1 = require("js-vextensions");
const Firelink_1 = require("../Firelink");
// for profiling
class StoreAccessorProfileData {
    constructor(name) {
        this.name = name;
        // make names the same length, for easier scanning in console listing // not needed for console.table
        //this.name = _.padEnd(name, 50, " ");
        this.callCount = 0;
        this.totalRunTime = 0;
        this.totalRunTime_asRoot = 0;
    }
}
exports.storeAccessorProfileData = {};
function LogStoreAccessorRunTimes() {
    const accessorRunTimes_ordered = js_vextensions_1.CE(js_vextensions_1.CE(exports.storeAccessorProfileData).VValues()).OrderByDescending(a => a.totalRunTime);
    console.log(`Store-accessor cumulative run-times: @TotalCalls(${js_vextensions_1.CE(accessorRunTimes_ordered.map(a => a.callCount)).Sum()}) @TotalTimeInRootAccessors(${js_vextensions_1.CE(accessorRunTimes_ordered.map(a => a.totalRunTime_asRoot)).Sum()})`);
    //Log({}, accessorRunTimes_ordered);
    console.table(accessorRunTimes_ordered);
}
exports.LogStoreAccessorRunTimes = LogStoreAccessorRunTimes;
exports.storeOverridesStack = [];
function WithStore(store, accessorFunc) {
    exports.storeOverridesStack.push(store);
    try {
        var result = accessorFunc();
    }
    finally {
        exports.storeOverridesStack.pop();
    }
    return result;
}
exports.WithStore = WithStore;
// for profiling
exports.accessorStack = [];
class StoreAccessorOptions {
    constructor() {
        this.cache = true;
        this.cache_keepAlive = false;
        //callArgToDependencyConvertorFunc?: CallArgToDependencyConvertorFunc;
    }
}
exports.StoreAccessorOptions = StoreAccessorOptions;
StoreAccessorOptions.default = new StoreAccessorOptions();
/**
Probably temp. Usage:
export const StoreAccessor_Typed = CreateStoreAccessor_Typed<RootStoreShape>();
export const GetPerson = StoreAccessor_Typed({}, ...);
*/
function CreateStoreAccessor_Typed() {
    //return State_Base as typeof State_Base<RootStateType, any>;
    //return State_Base as StateFunc_WithWatch<RootState>;
    return exports.StoreAccessor;
}
exports.CreateStoreAccessor_Typed = CreateStoreAccessor_Typed;
/**
Wrap a function with StoreAccessor if it's under the "Store/" path, and one of the following:
1) It accesses the store directly (ie. store.main.page). (thus, "WithStore(testStoreContents, ()=>GetThingFromStore())" works, without hacky overriding of project-wide "store" export)
2) It involves "heavy" processing, such that it's worth caching that processing. (rather than use computedFn directly, just standardize on StoreAccessor)
3) It involves a transformation of data into a new wrapper (ie. breaking reference equality), such that it's worth caching the processing. (to not trigger unnecessary child-ui re-renders)
*/
exports.StoreAccessor = (...args) => {
    let name, opt, accessorGetter;
    if (typeof args[0] == "function" && args.length == 1)
        [accessorGetter] = args;
    else if (typeof args[0] == "object" && args.length == 2)
        [opt, accessorGetter] = args;
    else if (args.length == 2)
        [name, accessorGetter] = args;
    else
        [name, opt, accessorGetter] = args;
    opt = js_vextensions_1.E(StoreAccessorOptions.default, opt);
    let defaultFireOptionsAtInit = Firelink_1.defaultFireOptions;
    let fire = js_vextensions_1.E(Firelink_1.defaultFireOptions, opt.fire);
    //let addProfiling = manager.devEnv; // manager isn't populated yet
    const addProfiling = window["DEV"];
    //const needsWrapper = addProfiling || options.cache;
    let accessor_forMainStore;
    const wrapperAccessor = (...callArgs) => {
        // if defaultFireOptions is only now set, re-apply it to our "fire" variable (it's usually not set when StoreAccessor() is first called)
        if (Firelink_1.defaultFireOptions != null && defaultFireOptionsAtInit == null) {
            fire = js_vextensions_1.E(Firelink_1.defaultFireOptions, opt.fire);
        }
        if (addProfiling) {
            exports.accessorStack.push(name);
            var startTime = performance.now();
            //return accessor.apply(this, callArgs);
        }
        let accessor;
        const usingMainStore = exports.storeOverridesStack.length == 0;
        if (usingMainStore) {
            if (accessor_forMainStore == null) {
                accessor_forMainStore = accessorGetter(fire.rootStore);
            }
            accessor = accessor_forMainStore;
        }
        else {
            accessor = accessorGetter(exports.storeOverridesStack[exports.storeOverridesStack.length - 1]);
        }
        let result;
        if (opt.cache && usingMainStore) {
            let callArgs_unwrapped = callArgs;
            //const callArg_unwrapLengths = {};
            if (opt.cache_unwrapArgs) {
                //Assert(options.cache, "There is no point to unwrapping-args if caching is disabled.");
                //for (const argIndex of options.cache_unwrapArgs.Pairs().map(a=>a.keyNum)) {
                //callArgs_unwrapped = callArgs.slice();
                for (const argIndex of opt.cache_unwrapArgs) {
                    if (!Array.isArray(callArgs[argIndex]))
                        continue;
                    const unwrappedValuesForCallArg = callArgs[argIndex];
                    if (callArgs_unwrapped == callArgs)
                        callArgs_unwrapped = callArgs.slice();
                    callArgs_unwrapped.splice(argIndex, 1, ...unwrappedValuesForCallArg);
                    //callArg_unwrapLengths[argIndex] = unwrappedValuesForCallArg.length;
                }
            }
            result = mobx_utils_1.computedFn((...callArgs_unwrapped_2) => {
                return accessor(...callArgs);
            }, opt.cache_keepAlive)(callArgs_unwrapped);
        }
        else {
            result = accessor(...callArgs);
        }
        if (addProfiling) {
            const runTime = performance.now() - startTime;
            const profileData = exports.storeAccessorProfileData[name] || (exports.storeAccessorProfileData[name] = new StoreAccessorProfileData(name));
            profileData.callCount++;
            profileData.totalRunTime += runTime;
            if (exports.accessorStack.length == 1) {
                profileData.totalRunTime_asRoot += runTime;
            }
            // name should have been added by webpack transformer, but if not, give some info to help debugging (under key "null")
            if (name == null) {
                profileData["origAccessors"] = profileData["origAccessors"] || [];
                if (!profileData["origAccessors"].Contains(accessorGetter)) {
                    profileData["origAccessors"].push(accessorGetter);
                }
            }
            js_vextensions_1.CE(exports.accessorStack).RemoveAt(exports.accessorStack.length - 1);
        }
        return result;
    };
    if (name)
        wrapperAccessor["displayName"] = name;
    return wrapperAccessor;
};
//# sourceMappingURL=Custom.js.map