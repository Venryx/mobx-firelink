export class QueryOp {
    static ParseData(json) {
        if (json.type == "where")
            return new WhereOp(json.fieldPath, json.comparison, json.value);
        if (json.type == "orderBy")
            return new OrderByOp(json.fieldPath, json.direction);
        if (json.type == "limit")
            return new LimitOp(json.count);
        return null;
    }
}
export class WhereOp extends QueryOp {
    constructor(fieldPath, comparison, value) {
        super();
        this.fieldPath = fieldPath;
        this.comparison = comparison;
        this.value = value;
        this.type = "where";
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
        this.fieldPath = fieldPath;
        this.direction = direction;
        this.type = "orderBy";
    }
    Apply(collection) {
        return collection.orderBy(this.fieldPath, this.direction);
    }
}
export class LimitOp extends QueryOp {
    constructor(count) {
        super();
        this.count = count;
        this.type = "limit";
    }
    Apply(collection) {
        return collection.limit(this.count);
    }
}
