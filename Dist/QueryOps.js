export class QueryOp {
    static ParseData(json) {
        if (json.type == "where")
            return new WhereOp(json.fieldPath, json.comparison, json.value);
        if (json.type == "orderBy")
            return new OrderByOp(json.fieldPath, json.direction);
        return null;
    }
}
export class WhereOp extends QueryOp {
    constructor(fieldPath, comparison, value) {
        super();
        this.type = "where";
        this.fieldPath = fieldPath;
        this.comparison = comparison;
        this.value = value;
    }
    Apply(collection) {
        var _a;
        // collection.where complains if value is undefined, so use null instead
        return collection.where(this.fieldPath, this.comparison, (_a = this.value, (_a !== null && _a !== void 0 ? _a : null)));
    }
}
/*export const Where = (...args: ConstructorParameters<typeof WhereOp>)=> {
    return new WhereOp(...args);
};*/
export class OrderByOp extends QueryOp {
    constructor(fieldPath, direction = "asc") {
        super();
        this.type = "orderBy";
        this.fieldPath = fieldPath;
        this.direction = direction;
    }
    Apply(collection) {
        return collection.orderBy(this.fieldPath, this.direction);
    }
}
