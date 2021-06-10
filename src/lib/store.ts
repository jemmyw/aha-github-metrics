import { EXTENSION_ID } from "../extension";
import { collectorFieldName, Rule } from "./rules";

export interface Versioned {
  version: number;
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

export async function deleteField(name: string) {
  await (aha as any).graphMutate(`
    mutation {
      deleteExtensionField(extensionIdentifier: "${EXTENSION_ID}", extensionFieldableType: "Account", name: "${name}") {
        success
      }
    }
  `);
}
