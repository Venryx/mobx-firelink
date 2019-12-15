var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import u from "updeep";
import { Clone, Assert, E, ObjectCE, ArrayCE, CE } from "js-vextensions";
import { maxDBUpdatesPerBatch, ApplyDBUpdates, ApplyDBUpdates_Local } from "../Utils/DatabaseHelpers";
import { MaybeLog_Base } from "../Utils/General";
import { defaultFireOptions } from "../Firelink";
import { DBPath } from "../Utils/PathHelpers";
export const commandsWaitingToComplete = [];
let currentCommandRun_listeners = [];
function WaitTillCurrentCommandFinishes() {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            currentCommandRun_listeners.push({ resolve, reject });
        });
    });
}
function NotifyListenersThatCurrentCommandFinished() {
    const currentCommandRun_listeners_copy = currentCommandRun_listeners;
    currentCommandRun_listeners = [];
    for (const listener of currentCommandRun_listeners_copy) {
        listener.resolve();
    }
}
export class Command {
    constructor(...args) {
        // these methods are executed on the server (well, will be later)
        // ==========
        // parent commands should call MarkAsSubcommand() immediately after setting a subcommand's payload
        this.asSubcommand = false;
        let options, payload;
        if (args.length == 1)
            [payload] = args;
        else
            [options, payload] = args;
        const opt = E(defaultFireOptions, options);
        //this.userInfo = {id: opt.fire.userID}; // temp
        //this.userInfo = opt.fire.userInfo; // temp (needs rework to be server-compatible in future)
        this.type = this.constructor.name;
        this.options = opt;
        this.payload = E(this.constructor["defaultPayload"], payload);
    }
    //userInfo: FireUserInfo;
    get userInfo() { return this.options.fire.userInfo; }
    MarkAsSubcommand() {
        this.asSubcommand = true;
        this.Validate_Early();
        return this;
    }
    /** [sync] Validates the payload data. (ie. the validation that doesn't require accessing the database) */
    Validate_Early() { }
    PreRun() {
        return __awaiter(this, void 0, void 0, function* () {
            //RemoveHelpers(this.payload);
            this.Validate_Early(); // have this run locally, before sending, to save on bandwidth
            yield this.Prepare();
            yield this.Validate();
        });
    }
    /** [async] Validates the data, prepares it, and executes it -- thus applying it into the database. */
    Run(maxUpdatesPerChunk = maxDBUpdatesPerBatch) {
        return __awaiter(this, void 0, void 0, function* () {
            if (commandsWaitingToComplete.length > 0) {
                MaybeLog_Base(a => a.commands, l => l(`Queing command, since ${commandsWaitingToComplete.length} ${commandsWaitingToComplete.length == 1 ? "is" : "are"} already waiting for completion.${""}@type:`, this.constructor.name, " @payload(", this.payload, ")"));
            }
            commandsWaitingToComplete.push(this);
            while (currentCommandRun_listeners) {
                yield WaitTillCurrentCommandFinishes();
            }
            currentCommandRun_listeners = [];
            MaybeLog_Base(a => a.commands, l => l("Running command. @type:", this.constructor.name, " @payload(", this.payload, ")"));
            try {
                //this.runStartTime = Date.now();
                yield this.PreRun();
                const dbUpdates = this.GetDBUpdates();
                if (this.options.fire.ValidateDBData) {
                    yield this.Validate_LateHeavy(dbUpdates);
                }
                // FixDBUpdates(dbUpdates);
                // await store.firebase.helpers.DBRef().update(dbUpdates);
                yield ApplyDBUpdates(this.options, DBPath(this.options), dbUpdates);
                // MaybeLog(a=>a.commands, ()=>`Finishing command. @type:${this.constructor.name} @payload(${ToJSON(this.payload)}) @dbUpdates(${ToJSON(dbUpdates)})`);
                MaybeLog_Base(a => a.commands, l => l("Finishing command. @type:", this.constructor.name, " @command(", this, ") @dbUpdates(", dbUpdates, ")"));
            }
            finally {
                //const areOtherCommandsBuffered = currentCommandRun_listeners.length > 0;
                ArrayCE(commandsWaitingToComplete).Remove(this);
                NotifyListenersThatCurrentCommandFinished();
            }
            // later on (once set up on server), this will send the data back to the client, rather than return it
            return this.returnData;
        });
    }
    // standard validation of common paths/object-types; perhaps disable in production
    Validate_LateHeavy(dbUpdates) {
        return __awaiter(this, void 0, void 0, function* () {
            // validate "nodes/X"
            /* let nodesBeingUpdated = (dbUpdates.VKeys() as string[]).map(a=> {
                let match = a.match(/^nodes\/([0-9]+).*#/);
                return match ? match[1].ToInt() : null;
            }).filter(a=>a).Distinct();
            for (let nodeID of nodesBeingUpdated) {
                let oldNodeData = await GetAsync_Raw(()=>GetNode(nodeID));
                let updatesForNode = dbUpdates.Props().filter(a=>a.name.match(`^nodes/${nodeID}($|/)`));
    
                let newNodeData = oldNodeData;
                for (let update of updatesForNode) {
                    newNodeData = u.updateIn(update.name.replace(new RegExp(`^nodes/${nodeID}($|/)`), "").replace(/\//g, "."), u.constant(update.value), newNodeData);
                }
                if (newNodeData != null) { // (if null, means we're deleting it, which is fine)
                    AssertValidate("MapNode", newNodeData, `New node-data is invalid.`);
                }
            } */
            // locally-apply db-updates, then validate the result (for now, only works for already-loaded data paths)
            const oldData = Clone(this.options.fire.tree.AsRawData());
            const newData = ApplyDBUpdates_Local(oldData, dbUpdates);
            this.options.fire.ValidateDBData(newData);
        });
    }
}
Command.defaultPayload = {};
export function MergeDBUpdates(baseUpdatesMap, updatesToMergeMap) {
    const baseUpdates = ObjectCE(baseUpdatesMap).Pairs().map(pair => ({ path: pair.key, data: pair.value }));
    const updatesToMerge = ObjectCE(updatesToMergeMap).Pairs().map(pair => ({ path: pair.key, data: pair.value }));
    for (const update of updatesToMerge) {
        Assert(!(update.data instanceof Command), "You forgot to add the GetDBUpdates() method-call, ie: sub.GetDBUpdates().");
        // if an update-to-merge exists for a path, remove any base-updates starting with that path (since the to-merge ones have priority)
        if (update.data == null) {
            for (const update2 of baseUpdates.slice()) { // make copy, since Remove() seems to break iteration otherwise
                if (update2.path.startsWith(update.path)) {
                    CE(baseUpdates).Remove(update2);
                }
            }
        }
    }
    const finalUpdates = [];
    for (const update of baseUpdates) {
        // find updates-to-merge where a field under this path is updated (collection-updates under this path are left alone since they're supposed to be separate updates)
        const updatesToMergeIntoThisOne = updatesToMerge.filter(update2 => update2.path.startsWith(`${update.path}/.`));
        for (const updateToMerge of updatesToMergeIntoThisOne) {
            const updateToMerge_relativePath = updateToMerge.path.substr(`${update.path}/`.length);
            // if (updateToMerge.data) {
            // assume that the update-to-merge has priority, so have it completely overwrite the data at its path
            update.data = u.updateIn(updateToMerge_relativePath.replace(/\//g, "."), u.constant(updateToMerge.data), update.data);
            /* } else {
                update.data = null;
            } */
            // remove from updates-to-merge list (since we just merged it)
            CE(updatesToMerge).Remove(updateToMerge);
        }
        finalUpdates.push(update);
    }
    // for any "update to merge" which couldn't be merged into one of the base-updates, just add it as its own update (it won't clash with the others)
    for (const update of updatesToMerge) {
        finalUpdates.push(update);
    }
    const finalUpdatesMap = finalUpdates.reduce((result, current) => ObjectCE(result).VSet(current.path, current.data), {});
    return finalUpdatesMap;
}
//# sourceMappingURL=Command.js.map