import { EXTENSION_ID } from "../extension";
import { Rule } from "./rules";

export const binsFieldName = (rule: Rule) => `${rule.name}.bins`;
export const binFieldName = (rule: Rule, n: number) => `${rule.name}.bin.${n}`;

export interface Bins {
  length: number;
  lastBinStart?: number;
}

export interface Bin {
  startAt: number;
  lastAt: number;
  count: number;
  mean: number;
  min: number;
  max: number;
  version: number;
}

export async function getRuleBins(rule: Rule) {
  return aha.account.getExtensionField<Bins>(EXTENSION_ID, binsFieldName(rule));
}
