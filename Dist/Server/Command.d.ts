import { FireOptions, FireUserInfo } from "../Firelink.js";
import { GetAsync_Options } from "../Accessors/Helpers.js";
export declare const commandsWaitingToComplete_new: Command<any, any>[];
export declare abstract class Command<Payload, ReturnData = void> {
    static defaultPayload: {};
    constructor(payload: Payload);
    constructor(options: Partial<FireOptions>, payload: Payload);
    get userInfo(): FireUserInfo | null;
    type: string;
    options: FireOptions;
    payload: Payload;
    returnData: any;
    parentCommand: Command<any, any>;
    MarkAsSubcommand(parentCommand: Command<any, any>): this;
    /** Transforms the payload data (eg. combining it with existing db-data) in preparation for constructing the db-updates-map, while also validating user permissions and such along the way. */
    protected abstract Validate(): void;
    /** Last validation error, from passing "catchAndStoreError=true" to Validate_Full() or Validate_Async(). */
    validateError?: Error | string | undefined;
    get ValidateErrorStr(): string | undefined;
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
    Validate_Safe(): string | undefined;
    Validate_Async(options?: Partial<FireOptions> & GetAsync_Options): Promise<void>;
    Validate_Async_Safe(options?: Partial<FireOptions> & GetAsync_Options): Promise<string | undefined>;
    /** Retrieves the actual database updates that are to be made. (so we can do it in one atomic call) */
    abstract GetDBUpdates(): {};
    PreRun(): Promise<void>;
    /** [async] Validates the data, prepares it, and executes it -- thus applying it into the database. */
    Run(): Promise<ReturnData>;
    Validate_LateHeavy(dbUpdates: any): Promise<void>;
}
