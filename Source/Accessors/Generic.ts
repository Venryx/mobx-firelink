import {E, ShallowChanged, emptyArray, CE, WaitXThenRun} from "js-vextensions";
import {ObservableMap, autorun, when, runInAction, reaction} from "mobx";
import {DBShape} from "../UserTypes";
import {Filter} from "../Filters";
import {defaultFireOptions, FireOptions} from "../Firelink";
import {TreeNode, DataStatus, QueryRequest} from "../Tree/TreeNode";
import {PathOrPathGetterToPath, PathOrPathGetterToPathSegments} from "../Utils/PathHelpers";
import {TreeRequestWatcher} from "../Tree/TreeRequestWatcher";
import {DoX_ComputationSafe} from "../Utils/MobX";

/*
Why use explicit GetDocs, GetDoc, etc. calls instead of just Proxy's?
1) It lets you add options (like filters) in a consistent way. (consistent among sync db-accesses, and, old: consistent with async db-accesses, eg. GetDocAsync)
2) It makes it visually clear where a db-access is taking place, as opposed to a mere store access.
*/ 

export class GetDocs_Options {
	static default = new GetDocs_Options();
	inLinkRoot? = true;
	filters?: Filter[];
	useUndefinedForInProgress? = false;
}
export function GetDocs<DB = DBShape, DocT = any>(options: Partial<FireOptions<any, DB>> & GetDocs_Options, collectionPathOrGetterFunc: string | string[] | ((dbRoot: DB)=>ObservableMap<any, DocT>)): DocT[] {
	const opt = E(defaultFireOptions, GetDocs_Options.default, options) as FireOptions & GetDocs_Options;
	let subpathSegments = PathOrPathGetterToPathSegments(collectionPathOrGetterFunc);
	let pathSegments = opt.inLinkRoot ? opt.fire.rootPathSegments.concat(subpathSegments) : subpathSegments;
	if (CE(pathSegments).Any(a=>a == null)) return emptyArray;

	let queryRequest = opt.filters ? new QueryRequest({filters: opt.filters}) : undefined;

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
	
	// todo: handle opt.useUndefinedForInProgress
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
	useUndefinedForInProgress? = false;
}
export function GetDoc<DB = DBShape, DocT = any>(options: Partial<FireOptions<any, DB>> & GetDoc_Options, docPathOrGetterFunc: string | string[] | ((dbRoot: DB)=>DocT)): DocT|n {
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
			opt.fire.tree.Get(pathSegments, undefined, true).Request();
		}));
	}

	// todo: handle opt.useUndefinedForInProgress
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

// async helper
// (one of the rare cases where opt is not the first argument; that's because GetAsync may be called very frequently/in-sequences, and usually wraps nice user accessors, so could add too much visual clutter)
export async function GetAsync<T>(dataGetterFunc: ()=>T, opt?: FireOptions & GetDoc_Options): Promise<T> {
	opt = E(defaultFireOptions, opt);
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
		let dispose = reaction(()=> {
			watcher.Start();
			// flip some flag here to say, "don't use cached data -- re-request!"
			storeAccessorCachingTempDisabled = true;
			let result = dataGetterFunc();
			storeAccessorCachingTempDisabled = false;
			watcher.Stop();
			let nodesRequested_array = Array.from(watcher.nodesRequested);
			//let requestsBeingWaitedFor = nodesRequested_array.filter(node=>node.status != DataStatus.Received);
			let requestsBeingWaitedFor = nodesRequested_array.filter(node=>node.status == DataStatus.Waiting);
			return {
				result,
				nodesRequested_array,
				possiblyDone: requestsBeingWaitedFor.length == 0,
			};
		}, data=> {
			let {result, nodesRequested_array, possiblyDone} = data;
			if (!possiblyDone) return;
			//if (!ShallowChanged(nodesRequested_obj, nodesRequested_obj_last)) {
			let requestsBeingWaitedFor = nodesRequested_array.filter(node=>node.status == DataStatus.Waiting);
			if (requestsBeingWaitedFor.length == 0) {
				WaitXThenRun(0, ()=>dispose()); // wait a bit, so dispose-func is ready (for when fired immediately)
				resolve(result);
			}
		}, {fireImmediately: true});
	});
}

export let storeAccessorCachingTempDisabled = false;