"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TreeAccessWatcher {
    constructor(fire) {
        this.nodesAccessed = new Set();
        this.fire = fire;
    }
    Start() {
        this.nodesAccessed.clear();
        this.fire.treeAccessWatchers.add(this);
    }
    Stop() {
        this.fire.treeAccessWatchers.delete(this);
    }
}
exports.TreeAccessWatcher = TreeAccessWatcher;
/*export function CreateTreeAccessWatcher(opt: FireOptions) {
    let watcher = new TreeAccessWatcher(opt.fire);
    opt.fire.treeAccessWatchers.push(watcher);
}*/ 
//# sourceMappingURL=TreeAccessWatcher.js.map