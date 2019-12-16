export abstract class Filter {
	static ParseData(json: any) {
		if (json.type == "where") return new WhereFilter(json.fieldPath, json.comparison, json.value);
		return null as never;
	}

	type: "where";
	abstract Apply(collection: firebase.firestore.CollectionReference);
}
export class WhereFilter extends Filter {
	constructor(fieldPath: string, comparison: firebase.firestore.WhereFilterOp, value: string) {
		super();
		this.type = "where";
		this.fieldPath = fieldPath;
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