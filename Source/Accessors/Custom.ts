import {computedFn} from "mobx-utils";
import {CE, ObjectCE, E, Assert} from "js-vextensions";
import {FireOptions, defaultFireOptions} from "../Firelink";
import {RootStoreShape} from "../UserTypes";

// for profiling
class StoreAccessorProfileData {
	constructor(name: string) {
		this.name = name;
		// make names the same length, for easier scanning in console listing // not needed for console.table
		//this.name = _.padEnd(name, 50, " ");
		this.callCount = 0;
		this.totalRunTime = 0;
		this.totalRunTime_asRoot = 0;
	}
	name: string;
	callCount: number;
	totalRunTime: number;
	totalRunTime_asRoot: number;
	//origAccessors: Function[];
}
export const storeAccessorProfileData = {} as {[key: string]: StoreAccessorProfileData};
export function LogStoreAccessorRunTimes() {
	const accessorRunTimes_ordered = CE(CE(storeAccessorProfileData).VValues()).OrderByDescending(a=>a.totalRunTime);
	console.log(`Store-accessor cumulative run-times: @TotalCalls(${CE(accessorRunTimes_ordered.map(a=>a.callCount)).Sum()}) @TotalTimeInRootAccessors(${CE(accessorRunTimes_ordered.map(a=>a.totalRunTime_asRoot)).Sum()})`);
	//Log({}, accessorRunTimes_ordered);
	console.table(accessorRunTimes_ordered);
}

export const storeOverridesStack = [];
export function WithStore<T>(store: any, accessorFunc: ()=>T): T {
	storeOverridesStack.push(store);
	try {
		var result = accessorFunc();
	} finally {
		storeOverridesStack.pop();
	}
	return result;
}

// for profiling
export const accessorStack = [];

export class StoreAccessorOptions {
	static default = new StoreAccessorOptions();
	cache? = true;
	cache_keepAlive? = false;
	//cache_unwrapArgs?: {[key: number]: boolean};
	cache_unwrapArgs?: number[];
	//callArgToDependencyConvertorFunc?: CallArgToDependencyConvertorFunc;
}
export type CallArgToDependencyConvertorFunc = (callArgs: any[])=>any[];

/*interface StoreAccessorFunc<RootState> {
	<Func extends Function>(accessor: (s: RootState)=>Func, callArgToDependencyConvertorFunc?: CallArgToDependencyConvertorFunc): Func & {WS: (state: RootState)=>Func};
	<Func extends Function>(name: string, accessor: (s: RootState)=>Func, callArgToDependencyConvertorFunc?: CallArgToDependencyConvertorFunc): Func & {WS: (state: RootState)=>Func};
}*/
interface StoreAccessorFunc<RootState> {
	<Func extends Function>(accessor: (s: RootState)=>Func): Func;
	<Func extends Function>(options: FireOptions & StoreAccessorOptions, accessor: (s: RootState)=>Func): Func;
	<Func extends Function>(name: string, accessor: (s: RootState)=>Func): Func;
	<Func extends Function>(name: string, options: FireOptions & StoreAccessorOptions, accessor: (s: RootState)=>Func): Func;
}

/**
Probably temp. Usage:
export const StoreAccessor_Typed = CreateStoreAccessor_Typed<RootStoreShape>();
export const GetPerson = StoreAccessor_Typed({}, ...);
*/
export function CreateStoreAccessor_Typed<RootState>() {
	//return State_Base as typeof State_Base<RootStateType, any>;
	//return State_Base as StateFunc_WithWatch<RootState>;
	return StoreAccessor as StoreAccessorFunc<RootState>;
}

/**
Wrap a function with StoreAccessor if it's under the "Store/" path, and one of the following:
1) It accesses the store directly (ie. store.main.page). (thus, "WithStore(testStoreContents, ()=>GetThingFromStore())" works, without hacky overriding of project-wide "store" export)
2) It involves "heavy" processing, such that it's worth caching that processing. (rather than use computedFn directly, just standardize on StoreAccessor)
3) It involves a transformation of data into a new wrapper (ie. breaking reference equality), such that it's worth caching the processing. (to not trigger unnecessary child-ui re-renders)
*/
export const StoreAccessor: StoreAccessorFunc<RootStoreShape> = (...args)=>{
	let name: string, opt: FireOptions & StoreAccessorOptions, accessorGetter: Function;
	if (typeof args[0] == "function" && args.length == 1) [accessorGetter] = args;
	else if (typeof args[0] == "object" && args.length == 2) [opt, accessorGetter] = args;
	else if (args.length == 2) [name, accessorGetter] = args;
	else [name, opt, accessorGetter] = args;
	opt = E(StoreAccessorOptions.default, opt);

	let defaultFireOptionsAtInit = defaultFireOptions;
	let fireOpt = E(defaultFireOptions, CE(opt).Including("fire"));

	//let addProfiling = manager.devEnv; // manager isn't populated yet
	const addProfiling = window["DEV"];
	//const needsWrapper = addProfiling || options.cache;

	let accessor_forMainStore;
	const wrapperAccessor = (...callArgs)=>{
		// if defaultFireOptions is only now set, re-apply it to our "fire" variable (it's usually not set when StoreAccessor() is first called)
		if (defaultFireOptions != null && defaultFireOptionsAtInit == null) {
			fireOpt = E(defaultFireOptions, fireOpt);
		}

		if (addProfiling) {
			accessorStack.push(name);

			var startTime = performance.now();
			//return accessor.apply(this, callArgs);
		}

		let accessor;
		const usingMainStore = storeOverridesStack.length == 0; // || storeOverridesStack[storeOverridesStack.length - 1] == fire.rootStore;
		if (usingMainStore) {
			if (accessor_forMainStore == null) {
				Assert(fireOpt.fire.rootStore != null, "A store-accessor cannot be called before its associated Firelink instance has been set.");
				accessor_forMainStore = accessorGetter(fireOpt.fire.rootStore);
			}
			accessor = accessor_forMainStore;
		} else {
			accessor = accessorGetter(storeOverridesStack[storeOverridesStack.length - 1]);
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
					if (!Array.isArray(callArgs[argIndex])) continue;
					const unwrappedValuesForCallArg = callArgs[argIndex];
					if (callArgs_unwrapped == callArgs) callArgs_unwrapped = callArgs.slice();
					callArgs_unwrapped.splice(argIndex, 1, ...unwrappedValuesForCallArg);
					//callArg_unwrapLengths[argIndex] = unwrappedValuesForCallArg.length;
				}
			}

			result = computedFn((...callArgs_unwrapped_2)=>{
				return accessor(...callArgs);
			}, opt.cache_keepAlive)(callArgs_unwrapped);
		} else {
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
			if (name == null) {
				profileData["origAccessors"] = profileData["origAccessors"] || [];
				if (!profileData["origAccessors"].Contains(accessorGetter)) {
					profileData["origAccessors"].push(accessorGetter);
				}
			}

			CE(accessorStack).RemoveAt(accessorStack.length - 1);
		}

		return result;
	};

	if (name) wrapperAccessor["displayName"] = name;
	return wrapperAccessor as any;
};