export class Filter {
}
export class WhereFilter extends Filter {
    constructor(propPath, comparison, value) {
        super();
        this.fieldPath = propPath;
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