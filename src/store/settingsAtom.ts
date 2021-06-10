import { atom, AtomEffect, DefaultValue } from "recoil";

function localStorageEffect<T>(key: string): AtomEffect<T> {
  return ({ setSelf, onSet, trigger }) => {
    const savedValue = localStorage.getItem(key);
    if (savedValue != null) {
      setSelf(JSON.parse(savedValue));
    }

    onSet((newValue) => {
      if (newValue instanceof DefaultValue) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newValue));
      }
    });
  };
}

export const showSettingsAtom = atom({
  default: false,
  key: "showSettings",
  effects_UNSTABLE: [localStorageEffect("showSettings")],
});

export const expandedRuleAtom = atom<number | null>({
  default: null,
  key: "expandedRule",
  effects_UNSTABLE: [localStorageEffect("expandedRule")],
});
