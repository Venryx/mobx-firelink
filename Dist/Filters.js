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
        return collection.where(this.fieldPath, this.comparison, this.value);
    }
}
export const Where = (...args) => {
    return new WhereFilter(...args);
};
//# sourceMappingURL=Filters.js.map