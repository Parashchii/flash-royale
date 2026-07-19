/* eslint-disable */
/**
 * Minimal Convex server stubs for local typecheck before `npx convex dev`.
 */
export {
  queryGeneric as query,
  internalQueryGeneric as internalQuery,
  mutationGeneric as mutation,
  internalMutationGeneric as internalMutation,
  actionGeneric as action,
  internalActionGeneric as internalAction,
  httpActionGeneric as httpAction,
} from "convex/server";

export type {
  GenericActionCtx,
  GenericMutationCtx,
  GenericQueryCtx,
  DatabaseReader,
  DatabaseWriter,
} from "convex/server";
