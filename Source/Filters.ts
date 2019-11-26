export class Filter {}
export class WhereFilter extends Filter {
	constructor(propPath: string, comparison: string, value: string) {
		super();
		this.propPath = propPath;
		this.comparison = comparison;
		this.value = value;
	}
	propPath: string;
	comparison: string;
	value: string;
}
export const Where = (...args: ConstructorParameters<typeof WhereFilter>)=> {
	return new WhereFilter(...args);
};