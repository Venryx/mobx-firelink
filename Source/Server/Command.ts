import u from "updeep";
import {Clone, Assert, E, ObjectCE, ArrayCE, CE} from "js-vextensions";
import {maxDBUpdatesPerBatch, ApplyDBUpdates, ApplyDBUpdates_Local} from "../Utils/DatabaseHelpers";
import {MaybeLog_Base} from "../Utils/General";
import {FireOptions, defaultFireOptions, FireUserInfo} from "../Firelink";
import {DBPath} from "../Utils/PathHelpers";
import {CommandNew} from "./CommandNew";

export const commandsWaitingToComplete = [] as Command<any, any>[];

let currentCommandRun_listeners = [] as {resolve, reject}[];
async function WaitTillCurrentCommandFinishes() {
	return new Promise((resolve, reject)=>{
		currentCommandRun_listeners.push({resolve, reject});
	});
}
function NotifyListenersThatCurrentCommandFinished() {
	const currentCommandRun_listeners_copy = currentCommandRun_listeners;
	currentCommandRun_listeners = [];
	for (const listener of currentCommandRun_listeners_copy) {
		listener.resolve();
	}
}

export abstract class Command<Payload, ReturnData = void> {
	static defaultPayload = {};
	constructor(payload: Payload);
	constructor(opt: Partial<FireOptions>, payload: Payload);
	constructor(...args) {
		let options: Partial<FireOptions>, payload: Payload;
		if (args.length == 1) [payload] = args;
		else [options, payload] = args;
		const opt = E(defaultFireOptions, options!) as FireOptions;

		//this.userInfo = {id: opt.fire.userID}; // temp
		//this.userInfo = opt.fire.userInfo; // temp (needs rework to be server-compatible in future)
		this.type = this.constructor.name;
		this.options = opt;
		this.payload = E(this.constructor["defaultPayload"], payload);
	}
	//userInfo: FireUserInfo;
	get userInfo() { return this.options.fire.userInfo; }
	type: string;
	options: FireOptions;
	payload: Payload;

	//prepareStartTime: number;
	//runStartTime: number;
	returnData;

	// these methods are executed on the server (well, will be later)
	// ==========

	// parent commands should call MarkAsSubcommand() immediately after setting a subcommand's payload
	asSubcommand = false;
	MarkAsSubcommand() {
		this.asSubcommand = true;
		this.Validate_Early();
		return this;
	}

	/** [sync] Validates the payload data. (ie. the validation that doesn't require accessing the database) */
	Validate_Early() {}
	/** [async] Transforms the payload data, combines it with database data, and so on, in preparation for the database-updates-map construction. */
	abstract Prepare(): Promise<void>
	/** [async] Validates the prepared data, mostly using ajv shape-validation. */
	abstract Validate(): Promise<void>
	/** [sync] Retrieves the actual database updates that are to be made. (so we can do it in one atomic call) */
	abstract GetDBUpdates(): {}

	async PreRun() {
		//RemoveHelpers(this.payload);
		this.Validate_Early(); // have this run locally, before sending, to save on bandwidth
		await this.Prepare();
		await this.Validate();
	}

	/** [async] Validates the data, prepares it, and executes it -- thus applying it into the database. */
	async Run(maxUpdatesPerChunk = maxDBUpdatesPerBatch): Promise<ReturnData> {
		if (commandsWaitingToComplete.length > 0) {
			MaybeLog_Base(a=>a.commands, l=>l(`Queing command, since ${commandsWaitingToComplete.length} ${commandsWaitingToComplete.length == 1 ? "is" : "are"} already waiting for completion.${""
				}@type:`, this.constructor.name, " @payload(", this.payload, ")"));
		}
		commandsWaitingToComplete.push(this);
		while (commandsWaitingToComplete[0] != this) {
			await WaitTillCurrentCommandFinishes();
		}
		currentCommandRun_listeners = [];

		MaybeLog_Base(a=>a.commands, l=>l("Running command. @type:", this.constructor.name, " @payload(", this.payload, ")"));

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
			MaybeLog_Base(a=>a.commands, l=>l("Finishing command. @type:", this.constructor.name, " @command(", this, ") @dbUpdates(", dbUpdates, ")"));
		} finally {
			//const areOtherCommandsBuffered = currentCommandRun_listeners.length > 0;
			ArrayCE(commandsWaitingToComplete).Remove(this);
			NotifyListenersThatCurrentCommandFinished();
		}

		// later on (once set up on server), this will send the data back to the client, rather than return it
		return this.returnData;
	}

	// standard validation of common paths/object-types; perhaps disable in production
	async Validate_LateHeavy(dbUpdates: any) {
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
		this.options.fire.ValidateDBData!(newData);
	}
}

/* type Update = {path: string, data: any};
function FixDBUpdates(updatesMap) {
	let updates = updatesMap.Props().map(prop=>({path: prop.name, data: prop.value}));
	for (let update of updates) {
		let otherUpdatesToMergeIntoThisOne: Update[] = updates.filter(update2=> {
			return update2.path.startsWith(update.path);
		});
		for (let updateToMerge of otherUpdatesToMergeIntoThisOne) {
			delete updates[updateToMerge.path];

			let updateToMerge_relativePath = updateToMerge.path.substr(0, update.path.length);
			update.data = u.updateIn(updateToMerge_relativePath, constant(updateToMerge.data), update.data)
		}
	}
} */
type Update = {path: string, data: any};
export function MergeDBUpdates(baseUpdatesMap: Object, updatesToMergeMap: Object) {
	const baseUpdates = ObjectCE(baseUpdatesMap).Pairs().map(pair=>({path: pair.key, data: pair.value})) as Update[];
	const updatesToMerge = ObjectCE(updatesToMergeMap).Pairs().map(pair=>({path: pair.key, data: pair.value})) as Update[];

	for (const update of updatesToMerge) {
		Assert(!(update.data instanceof Command) && !(update.data instanceof CommandNew), "You forgot to add the GetDBUpdates() method-call, ie: sub.GetDBUpdates().");
		// if an update-to-merge exists for a path, remove any base-updates starting with that path (since the to-merge ones have priority)
		if (update.data == null) {
			for (const update2 of baseUpdates.slice()) { // make copy, since Remove() seems to break iteration otherwise
				if (update2.path.startsWith(update.path)) {
					CE(baseUpdates).Remove(update2);
				}
			}
		}
	}

	const finalUpdates = [] as Update[];
	for (const update of baseUpdates) {
		// find updates-to-merge where a field under this path is updated (collection-updates under this path are left alone since they're supposed to be separate updates)
		const updatesToMergeIntoThisOne: Update[] = updatesToMerge.filter(update2=>update2.path.startsWith(`${update.path}/.`));
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

	const finalUpdatesMap = finalUpdates.reduce((result, current)=>ObjectCE(result).VSet(current.path, current.data), {});
	return finalUpdatesMap;
}
export function MergeDBUpdates_Multi(...dbUpdateMaps: Object[]) {
	let result = {};
	for (let dbUpdateMap of dbUpdateMaps) {
		result = MergeDBUpdates(result, dbUpdateMap);
	}
	return result;
}