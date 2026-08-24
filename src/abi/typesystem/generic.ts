/**
 * Re-exports for backward compatibility.
 * Generic types have been moved to separate files:
 * - OptionType and OptionValue -> genericOption.ts
 * - ListType and List -> genericList.ts
 */
export { List, ListType } from "./genericList";
export { OptionType, OptionValue } from "./genericOption";
