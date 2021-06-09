import { EXTENSION_ID } from "../extension";
import { processRule, Rule } from "../lib/rules";

aha.on(
  { event: `${EXTENSION_ID}.webhook` },
  async ({ event, payload }, { settings }) => {
    const rules = settings.get("rules") || ([] as Rule[]);
    await Promise.all(rules.map(processRule(event, payload)));
  }
);
