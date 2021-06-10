import { EXTENSION_ID } from "../extension";
import { Rule } from "./rules";
import { getField } from "./store";

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
  return getField<Bins>(binsFieldName(rule));
}

export function combineBins(bin1: Bin, bin2: Bin): Bin {
  return {
    count: bin1.count + bin2.count,
    lastAt: Math.max(bin1.lastAt, bin2.lastAt),
    startAt: Math.min(bin1.startAt, bin2.startAt),
    max: Math.max(bin1.max, bin2.max),
    mean:
      (bin1.mean * bin1.count + bin2.mean * bin2.count) /
      (bin1.count + bin2.count),
    min: Math.min(bin1.min, bin2.min),
    version: 0,
  };
}
