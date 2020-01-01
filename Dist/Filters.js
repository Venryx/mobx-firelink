export class Filter {
    static ParseData(json) {
        if (json.type == "where")
            return new WhereFilter(json.fieldPath, json.comparison, json.value);
        return null;
    }
}
export class WhereFilter extends Filter {
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
export const Where = (...args) => {
    return new WhereFilter(...args);
};
//# sourceMappingURL=Filters.js.map