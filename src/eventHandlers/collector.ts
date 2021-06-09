import { EXTENSION_ID } from "../extension";
import { processRule, Rule } from "../lib/rules";
import { loadRules } from "../store/rulesAtom";

aha.on(
  { event: `${EXTENSION_ID}.webhook` },
  async ({ event, payload }, { settings }) => {
    console.log("responding to webhook", event);
    const rules = await loadRules();
    console.log(`${rules.length} rules to process`);
    await Promise.all(rules.map(processRule(event, payload)));
  }
);
