"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const js_vextensions_1 = require("js-vextensions");
function Assert(condition, messageOrMessageFunc) {
    if (condition)
        return;
    var message = messageOrMessageFunc instanceof Function ? messageOrMessageFunc() : messageOrMessageFunc;
    //JSVE.logFunc(`Assert failed) ${message}\n\nStackTrace) ${GetStackTraceStr()}`);
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
function Log(...args) {
    return console.log(...args);
}
exports.Log = Log;
// maybe temp
class LogTypes_Base {
    constructor() {
        // from vwebapp-framework
        this.dbRequests = false;
        this.dbRequests_onlyFirst = false;
        this.cacheUpdates = false;
        this.commands = false;
    }
}
exports.LogTypes_Base = LogTypes_Base;
function ShouldLog_Base(shouldLogFunc) {
    return shouldLogFunc(window["logTypes"] || {});
}
exports.ShouldLog_Base = ShouldLog_Base;
function MaybeLog_Base(shouldLogFunc, loggerFunc) {
    if (!ShouldLog_Base(shouldLogFunc))
        return;
    // let loggerFuncReturnsString = loggerFunc.arguments.length == 0;
    const loggerFuncIsSimpleGetter = loggerFunc.toString().replace(/ /g, "").includes("function()");
    if (loggerFuncIsSimpleGetter)
        Log(loggerFunc());
    else
        loggerFunc(Log);
}
exports.MaybeLog_Base = MaybeLog_Base;
//# sourceMappingURL=General.js.map