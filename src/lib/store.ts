import { EXTENSION_ID } from "../extension";

export interface Versioned {
  version: number;
}

export async function storeVersioned<
  T,
  V extends T & Versioned = T & Versioned
>(name: string, defaultValue: T, updater: (value: T) => Promise<T>) {
  while (true) {
    let existing =
      (await getField<V>(name)) ||
      ({
        ...defaultValue,
        version: 0,
      } as V);
    const newValue = {
      ...(await updater(existing)),
      version: existing.version + 1,
    };
    let conflict = await getField<V>(name);

    if (!conflict || conflict.version === existing.version) {
      await setField(name, newValue);
      return newValue;
    }
  }
}

export async function deleteField(name: string) {
  await (aha as any).graphMutate(`
    mutation {
      deleteExtensionField(extensionIdentifier: "${EXTENSION_ID}", extensionFieldableType: "Account", name: "${name}") {
        success
      }
    }
  `);
}

export async function setField<T>(name: string, value: T) {
  await aha.account.setExtensionField(EXTENSION_ID, name, value);
}

export async function getField<T>(name: string): Promise<T | null> {
  return aha.account.getExtensionField(EXTENSION_ID, name);
}
