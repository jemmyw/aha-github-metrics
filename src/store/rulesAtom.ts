import { atom } from "recoil";
import { Rule } from "../lib/rules";

export const rulesAtom = atom<Rule[]>({
  key: "rules",
  default: [],
});
