import { FireOptions, FireUserInfo } from "../Firelink";
export declare const commandsWaitingToComplete: Command_Old<any, any>[];
export declare abstract class Command_Old<Payload, ReturnData = void> {
    static defaultPayload: {};
    constructor(payload: Payload);
    constructor(opt: Partial<FireOptions>, payload: Payload);
    get userInfo(): FireUserInfo | null;
    type: string;
    options: FireOptions;
    payload: Payload;
    returnData: any;
    asSubcommand: boolean;
    MarkAsSubcommand(): this;
    /** [sync] Validates the payload data. (ie. the validation that doesn't require accessing the database) */
    Validate_Early(): void;
    /** [async] Transforms the payload data, combines it with database data, and so on, in preparation for the database-updates-map construction. */
    abstract Prepare(): Promise<void>;
    /** [async] Validates the prepared data, mostly using ajv shape-validation. */
    abstract Validate(): Promise<void>;
    /** [sync] Retrieves the actual database updates that are to be made. (so we can do it in one atomic call) */
    abstract GetDBUpdates(): {};
    PreRun(): Promise<void>;
    /** [async] Validates the data, prepares it, and executes it -- thus applying it into the database. */
    Run(maxUpdatesPerChunk?: number): Promise<ReturnData>;
    Validate_LateHeavy(dbUpdates: any): Promise<void>;
}
