import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  userProgress: defineTable({
    userId: v.string(),
    collectedKeys: v.array(v.string()),
    verifiedGearIds: v.optional(v.array(v.string())),
    collectedArtifactIds: v.optional(v.array(v.string())),
    foundArtifactIds: v.optional(v.array(v.string())),
    collectedScannerIds: v.optional(v.array(v.string())),
    collectedArchArtifactIds: v.optional(v.array(v.string())),
    choices: v.object({
      spark: v.union(v.boolean(), v.null()),
      polissya: v.union(v.boolean(), v.null()),
      ninth: v.union(v.boolean(), v.null()),
    }),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),
});
