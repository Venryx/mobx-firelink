export abstract class QueryOp {
	static ParseData(json: any) {
		if (json.type == "where") return new WhereOp(json.fieldPath, json.comparison, json.value);
		if (json.type == "orderBy") return new OrderByOp(json.fieldPath, json.direction);
		return null as never;
	}

	type: "where" | "orderBy";
	abstract Apply(collection: firebase.firestore.CollectionReference);
}

export class WhereOp extends QueryOp {
	constructor(fieldPath: string, comparison: firebase.firestore.WhereFilterOp, value: any) {
		super();
		this.type = "where";
		this.fieldPath = fieldPath;
		this.comparison = comparison;
		this.value = value;
	}
	fieldPath: string;
	comparison: firebase.firestore.WhereFilterOp;
	value: any;

	Apply(collection: firebase.firestore.CollectionReference) {
		// collection.where complains if value is undefined, so use null instead
		return collection.where(this.fieldPath, this.comparison, this.value ?? null);
	}
}
/*export const Where = (...args: ConstructorParameters<typeof WhereOp>)=> {
	return new WhereOp(...args);
};*/

export class OrderByOp extends QueryOp {
	constructor(fieldPath: string, direction: firebase.firestore.OrderByDirection = "asc") {
		super();
		this.type = "orderBy";
		this.fieldPath = fieldPath;
		this.direction = direction;
	}
	fieldPath: string;
	direction: firebase.firestore.OrderByDirection;

	Apply(collection: firebase.firestore.CollectionReference) {
		return collection.orderBy(this.fieldPath, this.direction);
	}
}