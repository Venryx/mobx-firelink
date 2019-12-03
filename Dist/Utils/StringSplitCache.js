"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let splitCache_forwardSlash = {};
//export function SplitString_Cached(str: string, splitChar: string) {
function SplitStringBySlash_Cached(str) {
    return splitCache_forwardSlash[str] || (splitCache_forwardSlash[str] = str.split("/"));
}
exports.SplitStringBySlash_Cached = SplitStringBySlash_Cached;
//# sourceMappingURL=StringSplitCache.js.map