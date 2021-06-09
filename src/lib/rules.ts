import { storeFinishedAt, storeStartedAt } from "./store";

export interface RuleMatcher {
  path: string;
  value: string;
}

export interface RuleEvent {
  event: string;
  matchers: RuleMatcher[];
}

export interface Rule {
  name: string;
  identifierPath: string;
  startEvent: RuleEvent;
  finishEvent: RuleEvent;
  aggregate: "count" | "time";
  timeoutHours: number;
}

export const collectorFieldName = (rule: Rule) => `${rule.name}-collector`;

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
    const id: string = createPath(rule.identifierPath)(payload);
    if (!id) return;

    if (matchEvent(event, payload, rule.startEvent)) {
      await storeStartedAt(rule, id);
    }

    if (matchEvent(event, payload, rule.finishEvent)) {
      await storeFinishedAt(rule, id);
    }
  };
}
