import { Clone, E, ArrayCE } from "js-vextensions";
import { ApplyDBUpdates, ApplyDBUpdates_Local } from "../Utils/DatabaseHelpers.js";
import { MaybeLog_Base } from "../Utils/General.js";
import { defaultFireOptions } from "../Firelink.js";
import { GetAsync } from "../Accessors/Helpers.js";
export const commandsWaitingToComplete_new = [];
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
export class Command {
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
        Object.defineProperty(this, "parentCommand", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Last validation error, from passing "catchAndStoreError=true" to Validate_Full() or Validate_Async(). */
        Object.defineProperty(this, "validateError", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
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
        //this.payload = E(this.constructor["defaultPayload"], payload);
        // use Clone on the payload, so that behavior is consistent whether called locally or over the network
        this.payload = E(Clone(this.constructor["defaultPayload"]), Clone(payload));
    }
    //userInfo: FireUserInfo;
    get userInfo() { return this.options.fire.userInfo; }
    MarkAsSubcommand(parentCommand) {
        this.parentCommand = parentCommand;
        //this.Validate_Early();
        return this;
    }
    get ValidateErrorStr() {
        var _a;
        const err = this.validateError;
        return (_a = err === null || err === void 0 ? void 0 : err["message"]) !== null && _a !== void 0 ? _a : err === null || err === void 0 ? void 0 : err.toString();
    }
    /** Same as the command-provided Validate() function, except also validating the payload and return-data against their schemas. *#/
    /*Validate_Full() {
        const meta = GetCommandClassMetadata(this.constructor.name);
        AssertValidate(meta.payloadSchema, this.payload, "Payload is invalid.", {addSchemaObject: true});
        this.Validate();
        /*if (Command.augmentValidate) {
            Command.augmentValidate(this);
        }*#/
        AssertValidate(meta.returnSchema, this.returnData, "Return-data is invalid.", {addSchemaObject: true});
    }*/
    Validate_Safe() {
        var _a;
        try {
            //this.Validate_Full();
            this.Validate();
            this.validateError = undefined;
        }
        catch (ex) {
            this.validateError = ex;
            //return ex;
            return (_a = ex === null || ex === void 0 ? void 0 : ex.message) !== null && _a !== void 0 ? _a : ex === null || ex === void 0 ? void 0 : ex.toString();
        }
    }
    async Validate_Async(options) {
        //await GetAsync(()=>this.Validate(), E({errorHandling: "ignore"}, IsNumber(maxIterations) && {maxIterations}));
        //await GetAsync(()=>this.Validate(), {errorHandling: "ignore", maxIterations: OmitIfFalsy(maxIterations)});
        //await GetAsync(()=>this.Validate_Full(), E({throwImmediatelyOnDBWait: true} as Partial<GetAsync_Options>, options));
        await GetAsync(() => this.Validate(), E({ throwImmediatelyOnDBWait: true }, options));
    }
    async Validate_Async_Safe(options) {
        var _a;
        try {
            await this.Validate_Async(options);
            this.validateError = undefined;
        }
        catch (ex) {
            this.validateError = ex;
            //return ex;
            return (_a = ex === null || ex === void 0 ? void 0 : ex.message) !== null && _a !== void 0 ? _a : ex === null || ex === void 0 ? void 0 : ex.toString();
        }
    }
    async PreRun() {
        //RemoveHelpers(this.payload);
        await this.Validate_Async();
    }
    /** [async] Validates the data, prepares it, and executes it -- thus applying it into the database. */
    async Run() {
        if (commandsWaitingToComplete_new.length > 0) {
            MaybeLog_Base(a => a.commands, l => l(`Queing command, since ${commandsWaitingToComplete_new.length} ${commandsWaitingToComplete_new.length == 1 ? "is" : "are"} already waiting for completion.${""}@type:`, this.constructor.name, " @payload(", this.payload, ")"));
        }
        commandsWaitingToComplete_new.push(this);
        while (commandsWaitingToComplete_new[0] != this) {
            await WaitTillCurrentCommandFinishes();
        }
        currentCommandRun_listeners = [];
        MaybeLog_Base(a => a.commands, l => l("Running command. @type:", this.constructor.name, " @payload(", this.payload, ")"));
        try {
            //this.runStartTime = Date.now();
            await this.PreRun();
            //const helper = new DBHelper(undefined);
            //const dbUpdates = this.GetDBUpdates(helper);
            const dbUpdates = this.GetDBUpdates();
            if (this.options.fire.ValidateDBData) {
                await this.Validate_LateHeavy(dbUpdates);
            }
            // FixDBUpdates(dbUpdates);
            // await store.firebase.helpers.DBRef().update(dbUpdates);
            //await ApplyDBUpdates(dbUpdates, true, helper.DeferConstraints);
            await ApplyDBUpdates(this.options, dbUpdates);
            // todo: make sure the db-changes we just made are reflected in our mobx store, *before* current command is marked as "completed" (else next command may start operating on not-yet-refreshed data)
            // MaybeLog(a=>a.commands, ()=>`Finishing command. @type:${this.constructor.name} @payload(${ToJSON(this.payload)}) @dbUpdates(${ToJSON(dbUpdates)})`);
            MaybeLog_Base(a => a.commands, l => l("Finishing command. @type:", this.constructor.name, " @command(", this, ") @dbUpdates(", dbUpdates, ")"));
        } /*catch (ex) {
            console.error(`Hit error while executing command of type "${this.constructor.name}". @error:`, ex, "@payload:", this.payload);
        }*/
        finally {
            //const areOtherCommandsBuffered = currentCommandRun_listeners.length > 0;
            ArrayCE(commandsWaitingToComplete_new).Remove(this);
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
Object.defineProperty(Command, "defaultPayload", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {}
});
