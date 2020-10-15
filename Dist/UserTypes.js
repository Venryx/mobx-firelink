/*
The interfaces below should be extended by the user project.

Example:
==========
import MyRootStoreShape from "some/path/to/project/type";
import MyDBShape from "some/path/to/project/type";

declare module 'mobx-firelink/Dist/UserTypes' {
    interface RootStoreShape extends MyRootStoreShape {}
    interface DBShape extends MyDBShape {}
}
==========

This enables you to get typing within StoreAccessor, GetDocs, etc. without having to pass type-data in each call.

Note: This approach only works "once" per codebase; so it shouldn't be used by libraries. For libraries, you should do the following:
==========
// in some module
export const fire = new Firelink<RootStoreShape, DBShape>();

// in other modules (store/db shapes will be extracted from the type-data of the passed "fire" variable)
export const GetPerson = StoreAccessor({fire}, ...);
export const person = GetDoc({fire}, ...);
==========
*/
export {};
