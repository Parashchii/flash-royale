import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const emptyChoices = {
  spark: null as boolean | null,
  polissya: null as boolean | null,
  ninth: null as boolean | null,
};

const choicesValidator = v.object({
  spark: v.union(v.boolean(), v.null()),
  polissya: v.union(v.boolean(), v.null()),
  ninth: v.union(v.boolean(), v.null()),
});

const emptyProgressArrays = {
  collectedKeys: [] as string[],
  verifiedGearIds: [] as string[],
  collectedArtifactIds: [] as string[],
  foundArtifactIds: [] as string[],
  collectedScannerIds: [] as string[],
  collectedArchArtifactIds: [] as string[],
};

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const row = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!row) {
      return {
        ...emptyProgressArrays,
        choices: emptyChoices,
        updatedAt: 0,
      };
    }

    return {
      collectedKeys: row.collectedKeys,
      verifiedGearIds: row.verifiedGearIds ?? [],
      collectedArtifactIds: row.collectedArtifactIds ?? [],
      foundArtifactIds: row.foundArtifactIds ?? [],
      collectedScannerIds: row.collectedScannerIds ?? [],
      collectedArchArtifactIds: row.collectedArchArtifactIds ?? [],
      choices: row.choices,
      updatedAt: row.updatedAt,
    };
  },
});

export const ensure = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const existing = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("userProgress", {
      userId: identity.subject,
      ...emptyProgressArrays,
      choices: emptyChoices,
      updatedAt: Date.now(),
    });
  },
});

export const toggleCollected = mutation({
  args: { blueprintKey: v.string() },
  handler: async (ctx, { blueprintKey }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    let row = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!row) {
      const id = await ctx.db.insert("userProgress", {
        userId: identity.subject,
        ...emptyProgressArrays,
        collectedKeys: [blueprintKey],
        choices: emptyChoices,
        updatedAt: Date.now(),
      });
      return id;
    }

    const has = row.collectedKeys.includes(blueprintKey);
    const collectedKeys = has
      ? row.collectedKeys.filter((k) => k !== blueprintKey)
      : [...row.collectedKeys, blueprintKey];

    await ctx.db.patch(row._id, {
      collectedKeys,
      updatedAt: Date.now(),
    });
  },
});

export const toggleVerified = mutation({
  args: { gearId: v.string() },
  handler: async (ctx, { gearId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    let row = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!row) {
      await ctx.db.insert("userProgress", {
        userId: identity.subject,
        ...emptyProgressArrays,
        verifiedGearIds: [gearId],
        choices: emptyChoices,
        updatedAt: Date.now(),
      });
      return;
    }

    const current = row.verifiedGearIds ?? [];
    const has = current.includes(gearId);
    const verifiedGearIds = has
      ? current.filter((k) => k !== gearId)
      : [...current, gearId];

    await ctx.db.patch(row._id, {
      verifiedGearIds,
      updatedAt: Date.now(),
    });
  },
});

export const setArtifactStatus = mutation({
  args: {
    artifactId: v.string(),
    status: v.union(
      v.literal("missing"),
      v.literal("found"),
      v.literal("present"),
    ),
  },
  handler: async (ctx, { artifactId, status }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    let row = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    const presentSeed =
      status === "present" ? [artifactId] : ([] as string[]);
    const foundSeed = status === "found" ? [artifactId] : ([] as string[]);

    if (!row) {
      await ctx.db.insert("userProgress", {
        userId: identity.subject,
        ...emptyProgressArrays,
        collectedArtifactIds: presentSeed,
        foundArtifactIds: foundSeed,
        choices: emptyChoices,
        updatedAt: Date.now(),
      });
      return;
    }

    const present = (row.collectedArtifactIds ?? []).filter(
      (id) => id !== artifactId,
    );
    const found = (row.foundArtifactIds ?? []).filter((id) => id !== artifactId);

    await ctx.db.patch(row._id, {
      collectedArtifactIds:
        status === "present" ? [...present, artifactId] : present,
      foundArtifactIds: status === "found" ? [...found, artifactId] : found,
      updatedAt: Date.now(),
    });
  },
});

export const toggleArtifact = mutation({
  args: { artifactId: v.string() },
  handler: async (ctx, { artifactId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    let row = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!row) {
      await ctx.db.insert("userProgress", {
        userId: identity.subject,
        ...emptyProgressArrays,
        foundArtifactIds: [artifactId],
        choices: emptyChoices,
        updatedAt: Date.now(),
      });
      return;
    }

    const present = row.collectedArtifactIds ?? [];
    const found = row.foundArtifactIds ?? [];
    const isPresent = present.includes(artifactId);
    const isFound = found.includes(artifactId);

    let nextPresent = present.filter((id) => id !== artifactId);
    let nextFound = found.filter((id) => id !== artifactId);
    if (isPresent) {
      // present -> missing
    } else if (isFound) {
      nextPresent = [...nextPresent, artifactId];
    } else {
      nextFound = [...nextFound, artifactId];
    }

    await ctx.db.patch(row._id, {
      collectedArtifactIds: nextPresent,
      foundArtifactIds: nextFound,
      updatedAt: Date.now(),
    });
  },
});

export const toggleScanner = mutation({
  args: { scannerId: v.string() },
  handler: async (ctx, { scannerId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    let row = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!row) {
      await ctx.db.insert("userProgress", {
        userId: identity.subject,
        ...emptyProgressArrays,
        collectedScannerIds: [scannerId],
        choices: emptyChoices,
        updatedAt: Date.now(),
      });
      return;
    }

    const current = row.collectedScannerIds ?? [];
    const has = current.includes(scannerId);
    const collectedScannerIds = has
      ? current.filter((k) => k !== scannerId)
      : [...current, scannerId];

    await ctx.db.patch(row._id, {
      collectedScannerIds,
      updatedAt: Date.now(),
    });
  },
});

export const toggleArchArtifact = mutation({
  args: { archId: v.string() },
  handler: async (ctx, { archId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    let row = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!row) {
      await ctx.db.insert("userProgress", {
        userId: identity.subject,
        ...emptyProgressArrays,
        collectedArchArtifactIds: [archId],
        choices: emptyChoices,
        updatedAt: Date.now(),
      });
      return;
    }

    const current = row.collectedArchArtifactIds ?? [];
    const has = current.includes(archId);
    const collectedArchArtifactIds = has
      ? current.filter((k) => k !== archId)
      : [...current, archId];

    await ctx.db.patch(row._id, {
      collectedArchArtifactIds,
      updatedAt: Date.now(),
    });
  },
});

export const setChoice = mutation({
  args: {
    key: v.union(
      v.literal("spark"),
      v.literal("polissya"),
      v.literal("ninth"),
    ),
    value: v.union(v.boolean(), v.null()),
  },
  handler: async (ctx, { key, value }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    let row = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!row) {
      await ctx.db.insert("userProgress", {
        userId: identity.subject,
        ...emptyProgressArrays,
        choices: { ...emptyChoices, [key]: value },
        updatedAt: Date.now(),
      });
      return;
    }

    await ctx.db.patch(row._id, {
      choices: { ...row.choices, [key]: value },
      updatedAt: Date.now(),
    });
  },
});

export const reset = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const row = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    if (!row) return;

    await ctx.db.patch(row._id, {
      ...emptyProgressArrays,
      choices: emptyChoices,
      updatedAt: Date.now(),
    });
  },
});

export const importProgress = mutation({
  args: {
    collectedKeys: v.array(v.string()),
    verifiedGearIds: v.optional(v.array(v.string())),
    collectedArtifactIds: v.optional(v.array(v.string())),
    foundArtifactIds: v.optional(v.array(v.string())),
    collectedScannerIds: v.optional(v.array(v.string())),
    collectedArchArtifactIds: v.optional(v.array(v.string())),
    choices: choicesValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const row = await ctx.db
      .query("userProgress")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .unique();

    const collectedArtifactIds = [...new Set(args.collectedArtifactIds ?? [])];
    const presentSet = new Set(collectedArtifactIds);
    const foundArtifactIds = [...new Set(args.foundArtifactIds ?? [])].filter(
      (id) => !presentSet.has(id),
    );

    const payload = {
      collectedKeys: [...new Set(args.collectedKeys)],
      verifiedGearIds: [...new Set(args.verifiedGearIds ?? [])],
      collectedArtifactIds,
      foundArtifactIds,
      collectedScannerIds: [...new Set(args.collectedScannerIds ?? [])],
      collectedArchArtifactIds: [
        ...new Set(args.collectedArchArtifactIds ?? []),
      ],
      choices: args.choices,
      updatedAt: Date.now(),
    };

    if (!row) {
      await ctx.db.insert("userProgress", {
        userId: identity.subject,
        ...payload,
      });
      return;
    }

    await ctx.db.patch(row._id, payload);
  },
});
