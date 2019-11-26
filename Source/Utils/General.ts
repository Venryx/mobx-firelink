import {StringCE} from "js-vextensions";

export function Assert(condition, messageOrMessageFunc?: string | Function): condition is true {
	if (condition) return;

	var message = (messageOrMessageFunc as any) instanceof Function ? (messageOrMessageFunc as any)() : messageOrMessageFunc;

	JSVE.logFunc(`Assert failed) ${message}\n\nStackTrace) ${GetStackTraceStr()}`);
	console.error("Assert failed) " + message);

	let skipError = false; // add flag which you can use to skip the error, when paused in debugger
	debugger;
	if (!skipError) throw new Error("Assert failed) " + message);
}
export function AssertWarn(condition, messageOrMessageFunc?: string | Function) {
	if (condition) return;

	var message = messageOrMessageFunc instanceof Function ? messageOrMessageFunc() : messageOrMessageFunc;

	console.warn(`Assert-warn failed) ${message}\n\nStackTrace) ${GetStackTraceStr()}`);
}

//static GetStackTraceStr(stackTrace?: string, sourceStackTrace?: boolean);
export function GetStackTraceStr(sourceStackTrace?: boolean);
//@((()=> { if (g.onclick == null) g.onclick = ()=>console.log(V.GetStackTraceStr()); }) as any)
export function GetStackTraceStr(...args) {
	var stackTrace: string, sourceStackTrace = true;
	if (typeof args[0] == "string") [stackTrace, sourceStackTrace] = args;
	else [sourceStackTrace] = args;

	//stackTrace = stackTrace || new Error()[sourceStackTrace ? "Stack" : "stack"];
	//stackTrace = stackTrace || (sourceStackTrace ? StackTrace.get().then(stack=>stackTrace = stack.map(a=>a.toString()).join("\n")) : new Error().stack);
	//stackTrace = stackTrace || new Error().stack;

	if (stackTrace == null) {
		//let fakeError = {}.VAct(a=>Error.captureStackTrace(a));
		let oldStackLimit = (Error as any).stackTraceLimit;
		(Error as any).stackTraceLimit = Infinity;

		let fakeError = new Error();
		stackTrace = fakeError.stack;
		
		(Error as any).stackTraceLimit = oldStackLimit;
	}

	return stackTrace.substr(StringCE(stackTrace).IndexOf_X("\n", 1)); // remove "Error" line and first stack-frame (that of this method)
}