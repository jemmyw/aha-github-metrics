import { EXTENSION_ID } from "../extension";
import { collectorFieldName, Rule } from "./rules";

export interface Versioned {
  version: number;
}

export interface CollectionStore {
  data: Record<string, { start?: number; finish?: number }>;
}

export async function storeVersioned<
  T,
  V extends T & Versioned = T & Versioned
>(name: string, defaultValue: T, updater: (value: T) => Promise<T>) {
  while (true) {
    let existing =
      ((await aha.account.getExtensionField(EXTENSION_ID, name)) as V) ||
      ({
        ...defaultValue,
        version: 0,
      } as V);
    const newValue = {
      ...(await updater(existing)),
      version: existing.version + 1,
    };
    let conflict = (await aha.account.getExtensionField(
      EXTENSION_ID,
      name
    )) as V;

    if (!conflict || conflict.version === existing.version) {
      await aha.account.setExtensionField(EXTENSION_ID, name, newValue);
      return newValue;
    }
  }
}

export async function storeStartedAt(rule: Rule, id: string) {
  const data = await storeVersioned<CollectionStore>(
    collectorFieldName(rule),
    { data: {} },
    async (value) => ({
      data: {
        ...value.data,
        [id]: { start: new Date().valueOf() / 1000 },
      },
    })
  );

  if (data.data[id] && data.data[id].start && data.data[id].finish) {
    aha.triggerServer(`${EXTENSION_ID}.bin`, { rule, id });
  }
}

export async function storeFinishedAt(rule: Rule, id: string) {
  const data = await storeVersioned<CollectionStore>(
    `${rule}-collector`,
    { data: {} },
    async (value) => ({
      data: {
        ...value.data,
        [id]: { finish: new Date().valueOf() / 1000 },
      },
    })
  );

  if (data.data[id] && data.data[id].start && data.data[id].finish) {
    aha.triggerServer(`${EXTENSION_ID}.bin`, { rule, id });
  }
}
