import { EXTENSION_ID } from "../extension";
import { collectorFieldName, Rule } from "../lib/rules";
import { CollectionStore } from "../lib/store";

aha.on(
  { event: `${EXTENSION_ID}.bin` },
  async ({ rule, id }: { rule: Rule; id: string }) => {
    const store = (await aha.account.getExtensionField(
      EXTENSION_ID,
      collectorFieldName(rule)
    )) as CollectionStore;
    const { start, finish } = store.data[id];
    const duration = finish - start;
  }
);
