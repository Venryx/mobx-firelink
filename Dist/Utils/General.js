"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const js_vextensions_1 = require("js-vextensions");
function Assert(condition, messageOrMessageFunc) {
    if (condition)
        return;
    var message = messageOrMessageFunc instanceof Function ? messageOrMessageFunc() : messageOrMessageFunc;
    JSVE.logFunc(`Assert failed) ${message}\n\nStackTrace) ${GetStackTraceStr()}`);
    console.error("Assert failed) " + message);
    let skipError = false; // add flag which you can use to skip the error, when paused in debugger
    debugger;
    if (!skipError)
        throw new Error("Assert failed) " + message);
}
exports.Assert = Assert;
function AssertWarn(condition, messageOrMessageFunc) {
    if (condition)
        return;
    var message = messageOrMessageFunc instanceof Function ? messageOrMessageFunc() : messageOrMessageFunc;
    console.warn(`Assert-warn failed) ${message}\n\nStackTrace) ${GetStackTraceStr()}`);
}
exports.AssertWarn = AssertWarn;
//@((()=> { if (g.onclick == null) g.onclick = ()=>console.log(V.GetStackTraceStr()); }) as any)
function GetStackTraceStr(...args) {
    var stackTrace, sourceStackTrace = true;
    if (typeof args[0] == "string")
        [stackTrace, sourceStackTrace] = args;
    else
        [sourceStackTrace] = args;
    //stackTrace = stackTrace || new Error()[sourceStackTrace ? "Stack" : "stack"];
    //stackTrace = stackTrace || (sourceStackTrace ? StackTrace.get().then(stack=>stackTrace = stack.map(a=>a.toString()).join("\n")) : new Error().stack);
    //stackTrace = stackTrace || new Error().stack;
    if (stackTrace == null) {
        //let fakeError = {}.VAct(a=>Error.captureStackTrace(a));
        let oldStackLimit = Error.stackTraceLimit;
        Error.stackTraceLimit = Infinity;
        let fakeError = new Error();
        stackTrace = fakeError.stack;
        Error.stackTraceLimit = oldStackLimit;
    }
    return stackTrace.substr(js_vextensions_1.StringCE(stackTrace).IndexOf_X("\n", 1)); // remove "Error" line and first stack-frame (that of this method)
}
exports.GetStackTraceStr = GetStackTraceStr;
//# sourceMappingURL=General.js.map