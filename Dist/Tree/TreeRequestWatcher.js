export class TreeRequestWatcher {
    constructor(fire) {
        Object.defineProperty(this, "fire", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "nodesRequested", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
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
/*export function CreateTreeAccessWatcher(opt: FireOptions) {
    let watcher = new TreeAccessWatcher(opt.fire);
    opt.fire.treeAccessWatchers.push(watcher);
}*/ 
