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

export async function loadRules() {
  const rules = await aha.account.getExtensionField<Rule[]>(
    EXTENSION_ID,
    "rules"
  );
  return rules || [];
}

export async function saveRules(rules: Rule[]) {
  await aha.account.setExtensionField(EXTENSION_ID, "rules", rules);
}
