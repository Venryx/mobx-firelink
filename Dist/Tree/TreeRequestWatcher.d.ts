import { Firelink } from "../Firelink";
import { TreeNode } from "./TreeNode";
export declare class TreeRequestWatcher {
    constructor(fire: Firelink<any, any>);
    fire: Firelink<any, any>;
    Start(): void;
    Stop(): void;
    nodesRequested: Set<TreeNode<any>>;
}
