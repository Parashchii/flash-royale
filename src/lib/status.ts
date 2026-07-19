import type { ChoiceKey, FlashDrive, StoryChoices } from "../data/types";

export function isLockedMissed(
  flash: FlashDrive,
  choices: StoryChoices,
): boolean {
  const key = flash.lock?.choiceKey as ChoiceKey | null | undefined;
  if (!key) return false;
  const value = choices[key];
  // User explicitly chose the blocking path
  return value === false;
}

export function statusOf(
  flash: FlashDrive,
  collected: Set<string>,
  choices: StoryChoices,
): "collected" | "locked_missed" | "missing" {
  if (collected.has(flash.blueprintKey)) return "collected";
  if (isLockedMissed(flash, choices)) return "locked_missed";
  return "missing";
}
