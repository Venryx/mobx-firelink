"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TreeRequestWatcher {
    constructor(fire) {
        this.nodesRequested = new Set();
        this.fire = fire;
    }
    Start() {
        this.nodesRequested.clear();
        this.fire.treeRequestWatchers.add(this);
    }
    Stop() {
        this.fire.treeRequestWatchers.delete(this);
    }
}
exports.TreeRequestWatcher = TreeRequestWatcher;
/*export function CreateTreeAccessWatcher(opt: FireOptions) {
    let watcher = new TreeAccessWatcher(opt.fire);
    opt.fire.treeAccessWatchers.push(watcher);
}*/ 
//# sourceMappingURL=TreeRequestWatcher.js.map