import { Firelink } from "../Firelink";
import { TreeNode } from "./TreeNode";
export declare class TreeAccessWatcher {
    constructor(fire: Firelink<any>);
    fire: Firelink<any>;
    Start(): void;
    Stop(): void;
    nodesAccessed: Set<TreeNode<any>>;
}
