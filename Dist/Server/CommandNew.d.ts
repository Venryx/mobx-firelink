import { FireOptions, FireUserInfo } from "../Firelink";
export declare const commandsWaitingToComplete_new: CommandNew<any, any>[];
export declare abstract class CommandNew<Payload, ReturnData = void> {
    static defaultPayload: {};
    constructor(payload: Payload);
    constructor(options: Partial<FireOptions>, payload: Payload);
    get userInfo(): FireUserInfo | null;
    type: string;
    options: FireOptions;
    payload: Payload;
    returnData: any;
    parentCommand: CommandNew<any, any>;
    MarkAsSubcommand(parentCommand: CommandNew<any, any>): this;
    /** Transforms the payload data (eg. combining it with existing db-data) in preparation for constructing the db-updates-map, while also validating user permissions and such along the way. */
    abstract Validate(): void;
    /** Last validation error, from calling Validate_Safe(). */
    validateError: string | n;
    Validate_Safe(): any;
    Validate_Async(): Promise<void>;
    /** Retrieves the actual database updates that are to be made. (so we can do it in one atomic call) */
    abstract GetDBUpdates(): {};
    PreRun(): Promise<void>;
    /** [async] Validates the data, prepares it, and executes it -- thus applying it into the database. */
    Run(maxUpdatesPerChunk?: number): Promise<ReturnData>;
    Validate_LateHeavy(dbUpdates: any): Promise<void>;
}
