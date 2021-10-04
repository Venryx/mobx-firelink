import { Clone, E, ArrayCE } from "js-vextensions";
import { maxDBUpdatesPerBatch, ApplyDBUpdates, ApplyDBUpdates_Local } from "../Utils/DatabaseHelpers.js";
import { MaybeLog_Base } from "../Utils/General.js";
import { defaultFireOptions } from "../Firelink.js";
export const commandsWaitingToComplete = [];
let currentCommandRun_listeners = [];
async function WaitTillCurrentCommandFinishes() {
    return new Promise((resolve, reject) => {
        currentCommandRun_listeners.push({ resolve, reject });
    });
}
function NotifyListenersThatCurrentCommandFinished() {
    const currentCommandRun_listeners_copy = currentCommandRun_listeners;
    currentCommandRun_listeners = [];
    for (const listener of currentCommandRun_listeners_copy) {
        listener.resolve();
    }
}
export class Command_Old {
    constructor(...args) {
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "options", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "payload", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        //prepareStartTime: number;
        //runStartTime: number;
        Object.defineProperty(this, "returnData", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // these methods are executed on the server (well, will be later)
        // ==========
        // parent commands should call MarkAsSubcommand() immediately after setting a subcommand's payload
        Object.defineProperty(this, "asSubcommand", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
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
    async PreRun() {
        //RemoveHelpers(this.payload);
        this.Validate_Early(); // have this run locally, before sending, to save on bandwidth
        await this.Prepare();
        await this.Validate();
    }
    /** [async] Validates the data, prepares it, and executes it -- thus applying it into the database. */
    async Run(maxUpdatesPerChunk = maxDBUpdatesPerBatch) {
        if (commandsWaitingToComplete.length > 0) {
            MaybeLog_Base(a => a.commands, l => l(`Queing command, since ${commandsWaitingToComplete.length} ${commandsWaitingToComplete.length == 1 ? "is" : "are"} already waiting for completion.${""}@type:`, this.constructor.name, " @payload(", this.payload, ")"));
        }
        commandsWaitingToComplete.push(this);
        while (commandsWaitingToComplete[0] != this) {
            await WaitTillCurrentCommandFinishes();
        }
        currentCommandRun_listeners = [];
        MaybeLog_Base(a => a.commands, l => l("Running command. @type:", this.constructor.name, " @payload(", this.payload, ")"));
        try {
            //this.runStartTime = Date.now();
            await this.PreRun();
            const dbUpdates = this.GetDBUpdates();
            if (this.options.fire.ValidateDBData) {
                await this.Validate_LateHeavy(dbUpdates);
            }
            // FixDBUpdates(dbUpdates);
            // await store.firebase.helpers.DBRef().update(dbUpdates);
            await ApplyDBUpdates(this.options, dbUpdates);
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
        const oldData = Clone(this.options.fire.tree.AsRawData());
        const newData = ApplyDBUpdates_Local(oldData, dbUpdates);
        this.options.fire.ValidateDBData(newData);
    }
}
Object.defineProperty(Command_Old, "defaultPayload", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {}
});
