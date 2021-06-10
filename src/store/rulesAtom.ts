import { atom } from "recoil";
import { EXTENSION_ID } from "../extension";
import { Rule } from "../lib/rules";

interface Loadable<T> {
  loaded: boolean;
  data: T;
}

export const rulesAtom = atom<Rule[]>({
  key: "rules",
  default: [],
});