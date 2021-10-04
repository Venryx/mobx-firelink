// warn about multiple lib instances
let vLibCounts = (window["vLibCounts"] = window["vLibCounts"] || {});
vLibCounts["mobx-firelink"] = (vLibCounts["mobx-firelink"] || 0) + 1;
if (vLibCounts["mobx-firelink"] >= 2) {
	console.warn("More than one instance of mobx-firelink loaded. This can cause issues, eg. with WrapDBValue.");
}

// root
// ==========

export * from "./Firelink.js"; // main
export * from "./QueryOps.js";

// subfolders
// ==========

export * from "./Accessors/CreateAccessor.js";
export * from "./Accessors/DBAccessors.js";
export * from "./Accessors/Helpers.js";

export * from "./DBShape/Constructs.js";

// these "extensions" are separable from mobx-firelink, but are included for convenience, since I use them everywhere I use mobx-firelink
export * from "./Extensions/KeyGenerator.js";
export * from "./Extensions/SchemaHelpers.js";

export * from "./Server/Command_Old.js";
export * from "./Server/Command.js";

export * from "./Tree/TreeNode.js";

export * from "./Utils/DatabaseHelpers.js";
export * from "./Utils/DBUpdateMerging.js";
export * from "./Utils/General.js";
export * from "./Utils/PathHelpers.js";
export * from "./Utils/StringSplitCache.js";