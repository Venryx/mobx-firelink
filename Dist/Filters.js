"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Filter {
}
exports.Filter = Filter;
class WhereFilter extends Filter {
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
exports.WhereFilter = WhereFilter;
exports.Where = (...args) => {
    return new WhereFilter(...args);
};
//# sourceMappingURL=Filters.js.map