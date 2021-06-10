import { EXTENSION_ID } from "../extension";
import { Rule, Collected } from "../lib/rules";
import { deleteField } from "../lib/store";
import { nowSeconds } from "../lib/time";

const STALE_AFTER = 1200; // 20 minutes

aha.on(
  { event: `${EXTENSION_ID}.cleanup` },
  async ({ rule }: { rule: Rule }) => {
    let reRun = false;
    let allFields = (await aha.account.getExtensionFields(EXTENSION_ID)) as {
      name: string;
      value: any;
    }[];

    const stale = nowSeconds() - STALE_AFTER;

    if (allFields.length > 100) {
      reRun = true;
      allFields = allFields.slice(0, 100);
    }

    await Promise.all(
      allFields
        .map((field) => {
          if (field.name.includes(".collector.")) {
            const value = field.value as Collected;
            if (value.finish && value.finish < stale) {
              return deleteField(field.name);
            }
          }
        })
        .filter(Boolean)
    );

    if (reRun) {
      aha.triggerServer(`${EXTENSION_ID}.cleanup`, { rule });
    }
  }
);
