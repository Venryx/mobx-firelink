"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const updeep_1 = require("updeep");
const js_vextensions_1 = require("js-vextensions");
const DatabaseHelpers_1 = require("../Utils/DatabaseHelpers");
class CommandUserInfo {
}
exports.CommandUserInfo = CommandUserInfo;
exports.commandsWaitingToComplete = [];
let currentCommandRun_listeners = null;
async function WaitTillCurrentCommandFinishes() {
    return new Promise((resolve, reject) => {
        currentCommandRun_listeners.push({ resolve, reject });
    });
}
function NotifyListenersThatCurrentCommandFinished() {
    const currentCommandRun_listeners_copy = currentCommandRun_listeners;
    currentCommandRun_listeners = null;
    for (const listener of currentCommandRun_listeners_copy) {
        listener.resolve();
    }
}
class Command {
    constructor(payload) {
        // these methods are executed on the server (well, will be later)
        // ==========
        // parent commands should call MarkAsSubcommand() immediately after setting a subcommand's payload
        this.asSubcommand = false;
        this.userInfo = { id: manager.GetUserID() }; // temp
        this.type = this.constructor.name;
        this.payload = js_vextensions_1.E(this.constructor["defaultPayload"], payload);
    }
    MarkAsSubcommand() {
        this.asSubcommand = true;
        this.Validate_Early();
        return this;
    }
    /** [sync] Validates the payload data. (ie. the validation that doesn't require accessing the database) */
    Validate_Early() { }
    async PreRun() {
        //RemoveHelpers(this.payload);
        this.Validate_Early(); // have this run locally, before sending, to save on bandwidth
        await this.Prepare();
        await this.Validate();
    }
    /** [async] Validates the data, prepares it, and executes it -- thus applying it into the database. */
    async Run(maxUpdatesPerChunk = DatabaseHelpers_1.maxDBUpdatesPerBatch) {
        if (exports.commandsWaitingToComplete.length > 0) {
            MaybeLog_Base(a => a.commands, l => l(`Queing command, since ${exports.commandsWaitingToComplete.length} ${exports.commandsWaitingToComplete.length == 1 ? "is" : "are"} already waiting for completion.${""}@type:`, this.constructor.name, " @payload(", this.payload, ")"));
        }
        exports.commandsWaitingToComplete.push(this);
        while (currentCommandRun_listeners) {
            await WaitTillCurrentCommandFinishes();
        }
        currentCommandRun_listeners = [];
        MaybeLog_Base(a => a.commands, l => l("Running command. @type:", this.constructor.name, " @payload(", this.payload, ")"));
        try {
            //this.runStartTime = Date.now();
            await this.PreRun();
            const dbUpdates = this.GetDBUpdates();
            if (manager.ValidateDBData) {
                await this.Validate_LateHeavy(dbUpdates);
            }
            // FixDBUpdates(dbUpdates);
            // await store.firebase.helpers.DBRef().update(dbUpdates);
            await DatabaseHelpers_1.ApplyDBUpdates(DBPath(), dbUpdates);
            // MaybeLog(a=>a.commands, ()=>`Finishing command. @type:${this.constructor.name} @payload(${ToJSON(this.payload)}) @dbUpdates(${ToJSON(dbUpdates)})`);
            MaybeLog_Base(a => a.commands, l => l("Finishing command. @type:", this.constructor.name, " @command(", this, ") @dbUpdates(", dbUpdates, ")"));
        }
        finally {
            //const areOtherCommandsBuffered = currentCommandRun_listeners.length > 0;
            js_vextensions_1.ArrayCE(exports.commandsWaitingToComplete).Remove(this);
            NotifyListenersThatCurrentCommandFinished();
        }
        // later on (once set up on server), this will send the data back to the client, rather than return it
        return this.returnData;
    }
    // standard validation of common paths/object-types; perhaps disable in production
    async Validate_LateHeavy(dbUpdates) {
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
        const oldData = WithoutHelpers(js_vextensions_1.DeepGet(manager.store, `firestore/data/${DBPath()}`));
        const newData = DatabaseHelpers_1.ApplyDBUpdates_Local(oldData, dbUpdates);
        manager.ValidateDBData(newData);
    }
}
exports.Command = Command;
Command.defaultPayload = {};
function MergeDBUpdates(baseUpdatesMap, updatesToMergeMap) {
    const baseUpdates = js_vextensions_1.ObjectCE(baseUpdatesMap).Pairs().map(pair => ({ path: pair.key, data: pair.value }));
    const updatesToMerge = js_vextensions_1.ObjectCE(updatesToMergeMap).Pairs().map(pair => ({ path: pair.key, data: pair.value }));
    for (const update of updatesToMerge) {
        js_vextensions_1.Assert(!(update.data instanceof Command), "You forgot to add the GetDBUpdates() method-call, ie: sub.GetDBUpdates().");
        // if an update-to-merge exists for a path, remove any base-updates starting with that path (since the to-merge ones have priority)
        if (update.data == null) {
            for (const update2 of baseUpdates.slice()) { // make copy, since Remove() seems to break iteration otherwise
                if (update2.path.startsWith(update.path)) {
                    js_vextensions_1.ArrayCE(baseUpdates).Remove(update2);
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
            update.data = updeep_1.default.updateIn(updateToMerge_relativePath.replace(/\//g, "."), updeep_1.default.constant(updateToMerge.data), update.data);
            /* } else {
                update.data = null;
            } */
            // remove from updates-to-merge list (since we just merged it)
            js_vextensions_1.ArrayCE(updatesToMerge).Remove(updateToMerge);
        }
        finalUpdates.push(update);
    }
    // for any "update to merge" which couldn't be merged into one of the base-updates, just add it as its own update (it won't clash with the others)
    for (const update of updatesToMerge) {
        finalUpdates.push(update);
    }
    const finalUpdatesMap = finalUpdates.reduce((result, current) => js_vextensions_1.ObjectCE(result).VSet(current.path, current.data), {});
    return finalUpdatesMap;
}
exports.MergeDBUpdates = MergeDBUpdates;
//# sourceMappingURL=Command.js.map