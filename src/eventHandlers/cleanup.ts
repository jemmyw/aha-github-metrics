import { EXTENSION_ID } from "../extension";
import { Rule, Collected } from "../lib/rules";
import { deleteField } from "../lib/store";

aha.on(
  { event: `${EXTENSION_ID}.cleanup` },
  async ({ rule }: { rule: Rule }) => {
    let reRun = false;
    let allFields = (await aha.account.getExtensionFields(EXTENSION_ID)) as {
      name: string;
      value: any;
    }[];

    const stale = new Date().valueOf() / 1000 - 1200;

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
