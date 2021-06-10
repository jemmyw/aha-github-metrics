import { EXTENSION_ID } from "../extension";
import { loadRules, processRule } from "../lib/rules";

aha.on(
  { event: `${EXTENSION_ID}.collector` },
  async ({ event, payload }: { event: string; payload: any }) => {
    console.log("responding to webhook", event);
    const rules = await loadRules();
    console.log(`${rules.length} rules to process`);
    await Promise.all(rules.map(processRule(event, payload)));
  }
);
