import { EXTENSION_ID } from "../extension";
import { getField, setField } from "./store";

export interface RuleMatcher {
  path: string;
  value: string;
}

export interface RuleEvent {
  event: string;
  matchers: RuleMatcher[];
  identifierPath: string;
}

export interface Rule {
  name: string;
  title: string;
  startEvent: RuleEvent;
  finishEvent: RuleEvent;
  aggregate: "count" | "time";
  timeoutHours: number;
}

export interface Collected {
  start?: number;
  finish?: number;
}

export const collectorFieldName = (rule: Rule, id: string) =>
  `${rule.name}.collector.${id}`;

function createPath(path: string) {
  const elements = path.split(".");
  return (object: any) =>
    elements.reduce((acc, el) => {
      if (!acc) return acc;
      return acc[el];
    }, object);
}

function createMatcher(matcher: RuleMatcher) {
  const path = createPath(matcher.path);
  return (object: any) => {
    const value = path(object);

    switch (typeof value) {
      case "bigint":
        return value === BigInt(matcher.value);
      case "number":
        return value === Number(matcher.value);
      case "boolean":
        return (
          (value && matcher.value === "true") ||
          (!value && matcher.value === "false")
        );
      case "object":
        if (Array.isArray(value)) {
          return value.includes(matcher.value);
        }
      default:
        return value === matcher.value;
    }
  };
}

function matchEvent(event: string, payload: any, ruleEvent: RuleEvent) {
  if (ruleEvent.event !== event) return false;
  const matchers = ruleEvent.matchers.map(createMatcher);
  return matchers.every((m) => m(payload));
}

export function processRule(event: string, payload: any) {
  return async (rule: Rule) => {
    if (matchEvent(event, payload, rule.startEvent)) {
      const id: string = createPath(rule.startEvent.identifierPath)(payload);
      if (!id) return;
      console.log("matched starting rule");
      await storeStartedAt(rule, id);
    }

    if (matchEvent(event, payload, rule.finishEvent)) {
      const id: string = createPath(rule.finishEvent.identifierPath)(payload);
      if (!id) return;
      console.log("matched finishing rule");
      await storeFinishedAt(rule, id);
    }
  };
}

export async function storeStartedAt(rule: Rule, id: string) {
  await setField(collectorFieldName(rule, id), {
    start: new Date().valueOf() / 1000,
  });
}

export async function storeFinishedAt(rule: Rule, id: string) {
  const data = await getField<Collected>(collectorFieldName(rule, id));
  if (!data || !data.start) return;
  data.finish = new Date().valueOf() / 1000;

  await setField(collectorFieldName(rule, id), data);

  aha.triggerServer(`${EXTENSION_ID}.bin`, { rule, id });
}

export async function loadRules() {
  const rules = await getField<Rule[]>("rules");
  return rules || [];
}

export async function saveRules(rules: Rule[]) {
  await setField("rules", rules);
}
