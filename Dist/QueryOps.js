import { limit, orderBy, query, where } from "firebase/firestore";
export class QueryOp {
    constructor() {
        Object.defineProperty(this, "type", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
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
        Object.defineProperty(this, "fieldPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: fieldPath
        });
        Object.defineProperty(this, "comparison", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: comparison
        });
        Object.defineProperty(this, "value", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: value
        });
        this.type = "where";
    }
    Apply(collection) {
        var _a;
        // collection.where complains if value is undefined, so use null instead
        return query(collection, where(this.fieldPath, this.comparison, (_a = this.value) !== null && _a !== void 0 ? _a : null));
    }
}
/*export const Where = (...args: ConstructorParameters<typeof WhereOp>)=> {
    return new WhereOp(...args);
};*/
export class OrderByOp extends QueryOp {
    constructor(fieldPath, direction = "asc") {
        super();
        Object.defineProperty(this, "fieldPath", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: fieldPath
        });
        Object.defineProperty(this, "direction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: direction
        });
        this.type = "orderBy";
    }
    Apply(collection) {
        return query(collection, orderBy(this.fieldPath, this.direction));
    }
}
export class LimitOp extends QueryOp {
    constructor(count) {
        super();
        Object.defineProperty(this, "count", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: count
        });
        this.type = "limit";
    }
    Apply(collection) {
        return query(collection, limit(this.count));
    }
}
