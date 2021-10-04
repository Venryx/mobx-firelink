import { Firelink } from "../Firelink.js";
import { TreeNode } from "./TreeNode.js";
export declare class TreeRequestWatcher {
    constructor(fire: Firelink<any, any>);
    fire: Firelink<any, any>;
    Start(): void;
    Stop(): void;
    nodesRequested: Set<TreeNode<any>>;
}
