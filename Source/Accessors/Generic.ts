import {E, ShallowChanged, emptyArray, CE, WaitXThenRun, Assert, StringCE} from "js-vextensions";
import {ObservableMap, autorun, when, runInAction, reaction} from "mobx";
import {DBShape} from "../UserTypes";
import {Filter} from "../Filters";
import {defaultFireOptions, FireOptions} from "../Firelink";
import {TreeNode, DataStatus, QueryRequest} from "../Tree/TreeNode";
import {PathOrPathGetterToPath, PathOrPathGetterToPathSegments} from "../Utils/PathHelpers";
import {TreeRequestWatcher} from "../Tree/TreeRequestWatcher";
import {DoX_ComputationSafe} from "../Utils/MobX";
import {nil} from "../Utils/Nil";

/*
Why use explicit GetDocs, GetDoc, etc. calls instead of just Proxy's?
1) It lets you add options (like filters) in a consistent way. (consistent among sync db-accesses, and, old: consistent with async db-accesses, eg. GetDocAsync)
2) It makes it visually clear where a db-access is taking place, as opposed to a mere store access.
*/ 

export class GetDocs_Options {
	static default = new GetDocs_Options();
	inLinkRoot? = true;
	filters?: Filter[];
	undefinedForLoading? = false;
}
export function GetDocs<DB = DBShape, DocT = any>(options: Partial<FireOptions<any, DB>> & GetDocs_Options, collectionPathOrGetterFunc: string | string[] | ((dbRoot: DB)=>ObservableMap<any, DocT>)): DocT[]|undefined {
	const opt = E(defaultFireOptions, GetDocs_Options.default, options) as FireOptions & GetDocs_Options;
	let subpathSegments = PathOrPathGetterToPathSegments(collectionPathOrGetterFunc);
	let pathSegments = opt.inLinkRoot ? opt.fire.rootPathSegments.concat(subpathSegments) : subpathSegments;
	if (CE(pathSegments).Any(a=>a == null)) return emptyArray;

	let queryRequest = opt.filters ? new QueryRequest({filters: opt.filters}) : nil;

	const treeNode = opt.fire.tree.Get(pathSegments, queryRequest);
	// if already subscribed, just mark requested (reduces action-spam of GetDocs_Request)
	if (treeNode && treeNode.subscription) {
		treeNode.Request();
	} else {
		// we can't change observables from within computations, so do it in a moment (out of computation call-stack)
		DoX_ComputationSafe(()=>runInAction("GetDocs_Request", ()=> {
			opt.fire.tree.Get(pathSegments, queryRequest, true).Request();
		}));
	}
	
	if (opt.undefinedForLoading && treeNode?.status != DataStatus.Received_Full) {
		return undefined;
	}
	/*let docNodes = Array.from(treeNode.docNodes.values());
	let docDatas = docNodes.map(docNode=>docNode.data);
	return docDatas;*/
	//return opt.fire.tree.Get(pathSegments, queryRequest)?.docDatas ?? emptyArray;
	let result = treeNode?.docDatas ?? [];
	return result.length == 0 ? emptyArray : result; // to help avoid unnecessary react renders
}
/*export async function GetDocs_Async<DocT>(opt: FireOptions & GetDocs_Options, collectionPathOrGetterFunc: string | string[] | ((dbRoot: DBShape)=>ObservableMap<any, DocT>)): Promise<DocT[]> {
	opt = E(defaultFireOptions, opt);
	return GetAsync(()=>GetDocs_Async(opt, collectionPathOrGetterFunc));
}*/

export class GetDoc_Options {
	static default = new GetDoc_Options();
	inLinkRoot? = true;
	undefinedForLoading? = false;
}
export function GetDoc<DB = DBShape, DocT = any>(options: Partial<FireOptions<any, DB>> & GetDoc_Options, docPathOrGetterFunc: string | string[] | ((dbRoot: DB)=>DocT)): DocT|null|undefined {
	const opt = E(defaultFireOptions, GetDoc_Options.default, options) as FireOptions & GetDocs_Options;
	let subpathSegments = PathOrPathGetterToPathSegments(docPathOrGetterFunc);
	let pathSegments = opt.inLinkRoot ? opt.fire.rootPathSegments.concat(subpathSegments) : subpathSegments;
	if (CE(pathSegments).Any(a=>a == null)) return null;

	let treeNode = opt.fire.tree.Get(pathSegments);
	// if already subscribed, just mark requested (reduces action-spam of GetDoc_Request)
	if (treeNode && treeNode.subscription) {
		treeNode.Request();
	} else {
		// we can't change observables from within computations, so do it in a moment (out of computation call-stack)
		DoX_ComputationSafe(()=>runInAction("GetDoc_Request", ()=> {
			opt.fire.tree.Get(pathSegments, nil, true).Request();
		}));
	}

	if (opt.undefinedForLoading && treeNode.status != DataStatus.Received_Full) {
		return undefined;
	}
	return treeNode?.data;
}
/*export async function GetDoc_Async<DocT>(opt: FireOptions & GetDoc_Options, docPathOrGetterFunc: string | string[] | ((dbRoot: DBShape)=>DocT)): Promise<DocT> {
	opt = E(defaultFireOptions, opt);
	return GetAsync(()=>GetDoc_Async(opt, docPathOrGetterFunc));
}*/
/* GetDocField<DocT, FieldT>(docGetterFunc: (dbRoot: DBShape)=>DocT, fieldGetterFunc: (doc: DocT)=>FieldT, suboptions?: GetDocs_Options): FieldT {
}
export async GetDocField_Async<DocT, FieldT>(docGetterFunc: (dbRoot: DBShape)=>DocT, fieldGetterFunc: (doc: DocT)=>FieldT, suboptions?: GetDocs_Options): Promise<FieldT> {
} */

export class GetAsync_Options {
	static default = new GetAsync_Options();
	maxIterations? = 50; // pretty arbitrary; just meant to alert us for infinite-loop-like calls/getter-funcs
	errorHandling? = "none" as "none" | "log" | "ignore";
}

// async helper
// (one of the rare cases where opt is not the first argument; that's because GetAsync may be called very frequently/in-sequences, and usually wraps nice user accessors, so could add too much visual clutter)
export async function GetAsync<T>(dataGetterFunc: ()=>T, options?: Partial<FireOptions> & GetAsync_Options): Promise<T> {
	const opt = E(defaultFireOptions, GetAsync_Options.default, options) as FireOptions & GetAsync_Options;
	let watcher = new TreeRequestWatcher(opt.fire);

	/*let lastResult;
	let nodesRequested_obj_last;
	let nodesRequested_obj;
	do {
		nodesRequested_obj_last = nodesRequested_obj;

		watcher.Start();
		//let dispose = autorun(()=> {
		lastResult = dataGetterFunc();
		//});
		//dispose();
		watcher.Stop();

		const nodesRequested_array = Array.from(watcher.nodesRequested);
		nodesRequested_obj = CE(nodesRequested_array).ToMap(a=>a.path, a=>true);

		// wait till all requested nodes have their data received
		await Promise.all(nodesRequested_array.map(node=> {
			return when(()=>node.status == DataStatus.Received);
		}));
	} while (ShallowChanged(nodesRequested_obj, nodesRequested_obj_last));
	
	return lastResult;*/

	return new Promise((resolve, reject)=> {
		let iterationIndex = -1;
		let dispose = reaction(()=> {
			iterationIndex++;
			
			// prep for getter-func
			watcher.Start();
			// flip some flag here to say, "don't use cached data -- re-request!"
			storeAccessorCachingTempDisabled = true;
			let result;

			// execute getter-func
			let error;
			// if last iteration, never catch -- we want to see the error, as it's likely the cause of the seemingly-infinite iteration
			if (opt.errorHandling == "none" || iterationIndex >= opt.maxIterations! - 1) {
				result = dataGetterFunc();
			} else {
				try {
					result = dataGetterFunc();
				} catch (ex) {
					error = ex;
					if (opt.errorHandling == "log") {
						console.error(ex);
					}
				}
			}
			
			// cleanup for getter-func
			storeAccessorCachingTempDisabled = false;
			watcher.Stop();
			
			let nodesRequested_array = Array.from(watcher.nodesRequested);
			//let requestsBeingWaitedFor = nodesRequested_array.filter(node=>node.status == DataStatus.Waiting);
			//let requestsBeingWaitedFor = nodesRequested_array.filter(node=>node.status != DataStatus.Received);
			let requestsBeingWaitedFor = nodesRequested_array.filter(node=>node.status != DataStatus.Received_Full);
			let done = requestsBeingWaitedFor.length == 0;
			if (done && error != null) {
				//Assert(error == null, `Error occurred during final GetAsync iteration: ${error}`);
				AssertV_triggerDebugger = true;
				try {
					//result = dataGetterFunc();
					dataGetterFunc();
				} finally {
					AssertV_triggerDebugger = false;
				}
			}

			if (iterationIndex + 1 > opt.maxIterations!) {
				reject(StringCE(`
					GetAsync exceeded the maxIterations (${opt.maxIterations}).
					
					Setting "window.logTypes.subscriptions = true" in console may help with debugging.
				`).AsMultiline(0));
			}

			return {result, nodesRequested_array, done};
		}, data=> {
			 // if data is null, it means an error occured in the computation-func above
			if (data == null) return;

			let {result, nodesRequested_array, done} = data;
			if (!done) return;

			//Assert(result != null, "GetAsync should not usually return null.");
			WaitXThenRun(0, ()=>dispose()); // wait a bit, so dispose-func is ready (for when fired immediately)
			resolve(result);
		}, {fireImmediately: true});
	});
}

/** Variant of Assert, which does not trigger the debugger. (to be used in mobx-firelink Command.Validate functions, since it's okay/expected for those to fail asserts) */
export let AssertV_triggerDebugger = false;
export function AssertV(condition, messageOrMessageFunc?: string | Function): condition is true {
	Assert(condition, messageOrMessageFunc, AssertV_triggerDebugger);
	return true;
}

export let storeAccessorCachingTempDisabled = false;