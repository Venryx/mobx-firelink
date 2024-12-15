import { Assert, E, StringCE, WaitXThenRun } from "js-vextensions";
import { reaction } from "mobx";
import { defaultFireOptions } from "../Firelink.js";
import { DataStatus } from "../Tree/TreeNode.js";
import { TreeRequestWatcher } from "../Tree/TreeRequestWatcher.js";
/** Accessor wrapper which throws an error if one of the base db-requests is still loading. (to be used in Command.Validate functions) */
// (one of the rare cases where opt is not the first argument; that's because GetWait may be called very frequently/in-sequences, and usually wraps nice user accessors, so could add too much visual clutter)
export function GetWait(dataGetterFunc, options) {
    const opt = E(defaultFireOptions, options);
    let watcher = new TreeRequestWatcher(opt.fire);
    // prep for getter-func
    watcher.Start();
    // flip some flag here to say, "don't use cached data -- re-request!"
    //storeAccessorCachingTempDisabled = true;
    let result = dataGetterFunc();
    // cleanup for getter-func
    //storeAccessorCachingTempDisabled = false;
    watcher.Stop();
    let nodesRequested_array = Array.from(watcher.nodesRequested);
    //let requestsBeingWaitedFor = nodesRequested_array.filter(node=>node.status == DataStatus.Waiting);
    //let requestsBeingWaitedFor = nodesRequested_array.filter(node=>node.status != DataStatus.Received);
    let requestsBeingWaitedFor = nodesRequested_array.filter(node => node.status != DataStatus.Received_Full);
    let done = requestsBeingWaitedFor.length == 0;
    if (!done) {
        throw new Error("Store-accessor not yet resolved. (ie. one of its db-requests is still loading)");
    }
    return result;
}
export class GetAsync_Options {
    constructor() {
        /** Just meant to alert us for infinite-loop-like calls/getter-funcs. Default: 50 [pretty arbitrary] */
        Object.defineProperty(this, "maxIterations", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 50
        }); // todo: maybe replace this with system that tracks the list of paths accessed, and which halts if it "senses no progression" [eg. max-iterations-without-change-to-access-paths]
        /** How to handle errors that occur in accessor, when there are still db-requests in progress. (ie. when accessor is still progressing) */
        Object.defineProperty(this, "errorHandling_during", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "ignore"
        });
        /** How to handle errors that occur in accessor, when no db-requests are still in progress. (ie. on final accessor call) */
        Object.defineProperty(this, "errorHandling_final", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: "reject"
        });
        /** If true, db requests within dataGetterFunc that find themselves waiting for remote db-data, with throw an error immediately. (avoiding higher-level processing) */
        Object.defineProperty(this, "throwImmediatelyOnDBWait", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
    }
}
Object.defineProperty(GetAsync_Options, "default", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new GetAsync_Options()
});
export let GetAsync_throwImmediatelyOnDBWait_activeDepth = 0;
export function NotifyWaitingForDB(dbPath) {
    if (GetAsync_throwImmediatelyOnDBWait_activeDepth > 0) {
        throw new Error(`DB tree-node for "${dbPath}" is waiting for database data that isn't ready yet. Throwing error now (to avoid higher-level processing) until data is ready.`);
    }
}
export async function GetAsync(dataGetterFunc, options) {
    const opt = E(defaultFireOptions, GetAsync_Options.default, options);
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
    return new Promise((resolve, reject) => {
        let iterationIndex = -1;
        let dispose = reaction(() => {
            iterationIndex++;
            // prep for getter-func
            watcher.Start();
            if (options === null || options === void 0 ? void 0 : options.throwImmediatelyOnDBWait)
                GetAsync_throwImmediatelyOnDBWait_activeDepth++;
            // flip some flag here to say, "don't use cached data -- re-request!"
            opt.fire.storeAccessorCachingTempDisabled = true;
            let result;
            let accessor_lastError;
            function HandleAccessorError(ex, handling) {
                /*if (ex instanceof BailMessage) {
                    return; // always ignore bail-messages in GetAsync (is this the ideal behavior?)
                }*/
                accessor_lastError = ex;
                // if last iteration, never catch -- we want to see the error, as it's likely the cause of the seemingly-infinite iteration
                if (handling == "reject" || handling == "rejectAndLog") {
                    reject(ex); // call reject, so that caller of GetAsync() can receives/can-catch the error (rather than the global mobx "reaction()" catching it)
                    //throw ex; // also rethrow it, so reaction stops, and we see error message in server log // commented; caller of GetAsync() may want to catch it
                    if (handling == "rejectAndLog")
                        console.error(ex); // also log error
                    // also end/dispose reaction (unless first iteration; attempting it then causes an error, and would be unnecesary anyway)
                    if (iterationIndex > 0)
                        dispose();
                }
                else if (handling == "log") {
                    console.error(ex);
                }
            }
            // execute getter-func
            try {
                result = dataGetterFunc();
            }
            catch (ex) {
                HandleAccessorError(ex, opt.errorHandling_during);
            }
            // cleanup for getter-func
            opt.fire.storeAccessorCachingTempDisabled = false;
            if (options === null || options === void 0 ? void 0 : options.throwImmediatelyOnDBWait)
                GetAsync_throwImmediatelyOnDBWait_activeDepth--;
            watcher.Stop();
            let nodesRequested_array = Array.from(watcher.nodesRequested);
            //let requestsBeingWaitedFor = nodesRequested_array.filter(node=>node.status == DataStatus.Waiting);
            //let requestsBeingWaitedFor = nodesRequested_array.filter(node=>node.status != DataStatus.Received);
            let requestsBeingWaitedFor = nodesRequested_array.filter(node => node.status != DataStatus.Received_Full);
            const dbRequestsAllResolved = requestsBeingWaitedFor.length == 0;
            const maxIterationsReached = iterationIndex >= opt.maxIterations - 1;
            let finalCall = dbRequestsAllResolved || maxIterationsReached;
            if (finalCall && accessor_lastError != null) {
                //Assert(error == null, `Error occurred during final GetAsync iteration: ${error}`);
                AssertV_triggerDebugger = true;
                try {
                    //result = dataGetterFunc();
                    //dataGetterFunc();
                    dataGetterFunc();
                }
                catch (ex) {
                    HandleAccessorError(ex, opt.errorHandling_final);
                }
                finally {
                    AssertV_triggerDebugger = false;
                }
            }
            if (maxIterationsReached && !dbRequestsAllResolved) {
                reject(StringCE(`
					GetAsync reached the maxIterations (${opt.maxIterations}) without completely resolving. Call was cancelled/rejected.
					
					Setting "window.logTypes.subscriptions = true" in console may help with debugging.
				`).AsMultiline(0));
            }
            return { result, nodesRequested_array, fullyResolved: dbRequestsAllResolved };
        }, data => {
            // if data is null, it means an error occured in the computation-func above
            if (data == null)
                return;
            let { result, nodesRequested_array, fullyResolved } = data;
            if (!fullyResolved)
                return;
            //Assert(result != null, "GetAsync should not usually return null.");
            WaitXThenRun(0, () => dispose()); // wait a bit, so dispose-func is ready (for when fired immediately)
            resolve(result);
        }, { fireImmediately: true });
    });
}
export let AssertV_triggerDebugger = false;
/** Variant of Assert, which does not trigger the debugger. (to be used in mobx-firelink Command.Validate functions, since it's okay/expected for those to fail asserts) */
export function AssertV(condition, messageOrMessageFunc) {
    Assert(condition, messageOrMessageFunc, AssertV_triggerDebugger);
    return true;
}
export const AV = ((propName) => {
    return new AVWrapper(propName);
});
Object.defineProperty(AV, "NonNull_", { configurable: true, value: (value) => AVWrapper.generic.NonNull_(value) });
Object.defineProperty(AV, "NonNull", { configurable: true, set: (value) => AVWrapper.generic.NonNull = value });
class AVWrapper {
    constructor(propName) {
        Object.defineProperty(this, "propName", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: propName
        });
    }
    NonNull_(value) {
        AssertV(value != null, () => `Value${this.propName ? ` of prop "${this.propName}"` : ""} cannot be null. (provided value: ${value})`);
        return value;
    }
    set NonNull(value) {
        this.NonNull_(value);
    }
}
Object.defineProperty(AVWrapper, "generic", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: new AVWrapper("")
});
//export let storeAccessorCachingTempDisabled = false;
