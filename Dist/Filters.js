"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Filter {
}
exports.Filter = Filter;
class WhereFilter extends Filter {
    constructor(propPath, comparison, value) {
        super();
        this.propPath = propPath;
        this.comparison = comparison;
        this.value = value;
    }
}
exports.WhereFilter = WhereFilter;
exports.Where = (...args) => {
    return new WhereFilter(...args);
};
//# sourceMappingURL=Filters.js.map