export abstract class Filter {
	abstract Apply(collection: firebase.firestore.CollectionReference);
}
export class WhereFilter extends Filter {
	constructor(propPath: string, comparison: firebase.firestore.WhereFilterOp, value: string) {
		super();
		this.fieldPath = propPath;
		this.comparison = comparison;
		this.value = value;
	}
	fieldPath: string;
	comparison: firebase.firestore.WhereFilterOp;
	value: string;

	Apply(collection: firebase.firestore.CollectionReference) {
		return collection.where(this.fieldPath, this.comparison, this.value);
	}
}
export const Where = (...args: ConstructorParameters<typeof WhereFilter>)=> {
	return new WhereFilter(...args);
};