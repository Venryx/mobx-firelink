export class TreeRequestWatcher {
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
/*export function CreateTreeAccessWatcher(opt: FireOptions) {
    let watcher = new TreeAccessWatcher(opt.fire);
    opt.fire.treeAccessWatchers.push(watcher);
}*/ 
