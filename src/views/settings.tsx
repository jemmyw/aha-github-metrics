import React, { useEffect, useRef, useState } from "react";
import { useRecoilState } from "recoil";
import { Rule, RuleEvent, RuleMatcher, saveRules } from "../lib/rules";
import { rulesAtom } from "../store/rulesAtom";
import { expandedRuleAtom } from "../store/settingsAtom";

const MatchEditor: React.FC<{
  matcher: RuleMatcher;
  onChange: (matcher: RuleMatcher) => void;
  onDelete: () => void;
}> = ({ matcher, onChange, onDelete }) => {
  const handleChange =
    (field: keyof RuleMatcher): React.ChangeEventHandler<HTMLInputElement> =>
    (event) => {
      onChange({ ...matcher, [field]: event.target.value });
    };

  return (
    <div className="match">
      <div className="editor-field path">
        <input
          type="text"
          value={matcher.path}
          onChange={handleChange("path")}
        />
        <span>==</span>
        <input
          type="text"
          value={matcher.value}
          onChange={handleChange("value")}
        />
        <aha-button onClick={onDelete}>Delete</aha-button>
      </div>
    </div>
  );
};

const RuleEventEditor: React.FC<{
  event: RuleEvent;
  onChange: (event: Partial<RuleEvent>) => void;
}> = ({ event, onChange }) => {
  const handleMatcherChange = (idx: number) => (matcher: RuleMatcher) => {
    const matchers = event.matchers.slice();
    matchers[idx] = matcher;
    onChange({ matchers });
  };
  const handleMatcherDelete = (idx: number) => () => {
    const matchers = event.matchers.slice();
    matchers.splice(idx, 1);
    onChange({ matchers });
  };
  const onAddMatcher = () => {
    const matchers = event.matchers.slice();
    matchers.push({ path: "", value: "" });
    onChange({ matchers });
  };

  return (
    <div className="rule-event">
      <div className="editor-field event">
        <label>Event name</label>
        <input
          type="text"
          placeholder="event"
          value={event.event}
          onChange={(e) => onChange({ event: e.target.value })}
        />
      </div>

      <div className="editor-field identifier">
        <label>Identifier path</label>
        <input
          type="text"
          value={event.identifierPath}
          onChange={(e) => onChange({ identifierPath: e.target.value })}
        />
      </div>

      <div
        className="matchers"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <span>Matchers</span>

        {event.matchers.map((matcher, idx) => {
          return (
            <MatchEditor
              matcher={matcher}
              onChange={handleMatcherChange(idx)}
              onDelete={handleMatcherDelete(idx)}
              key={idx}
            />
          );
        })}

        <div>
          <aha-button onClick={onAddMatcher}>Add matcher</aha-button>
        </div>
      </div>
    </div>
  );
};

const RuleEditor: React.FC<{
  onUpdate: (rule: Partial<Rule>) => void;
  onDelete(): void;
  onExpand(): void;
  rule: Rule;
  expanded: boolean;
}> = ({ rule, onUpdate, onDelete, expanded, onExpand }) => {
  const handleDelete = () => {
    if (confirm("Are you sure?")) {
      onDelete();
    }
  };

  if (!rule) {
    return <div>error</div>;
  }

  if (!expanded) {
    return (
      <div className="rule-editor collapsed">
        {rule.title || rule.name}
        <aha-button onClick={onExpand}>Edit</aha-button>
      </div>
    );
  }

  return (
    <div className="rule-editor expanded">
      <div className="editor-field name">
        <label>Name</label>
        <input
          type="text"
          value={rule.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />
      </div>

      <div className="editor-field name">
        <label>Title</label>
        <input
          type="text"
          value={rule.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
        />
      </div>

      <div className="start-event">
        <span>Start event</span>
        <RuleEventEditor
          event={rule.startEvent}
          onChange={(startEvent) =>
            onUpdate({ startEvent: { ...rule.startEvent, ...startEvent } })
          }
        />
      </div>

      <div className="finish-event">
        <span>Finish event</span>
        <RuleEventEditor
          event={rule.finishEvent}
          onChange={(finishEvent) =>
            onUpdate({
              finishEvent: {
                ...rule.finishEvent,
                ...finishEvent,
              },
            })
          }
        />
      </div>

      <div>
        <aha-button onClick={handleDelete}>Delete</aha-button>
      </div>
    </div>
  );
};

export const Settings: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [rules, setRules] = useRecoilState(rulesAtom);
  const [updating, setUpdating] = useState(false);
  const [expanded, setExpanded] = useRecoilState(expandedRuleAtom);
  const updatePromise = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (updatePromise.current) {
      updatePromise.current.then(() => update(rules));
    } else {
      updatePromise.current = update(rules);
    }
  }, [rules]);

  const update = async (rules: Rule[]) => {
    setUpdating(true);
    await saveRules(rules);
    setUpdating(false);
  };

  const onAddRule = () => {
    const newRule: Rule = {
      aggregate: "time",
      startEvent: {
        event: "pull_request",
        matchers: [],
        identifierPath: "number",
      },
      finishEvent: {
        event: "pull_request",
        matchers: [],
        identifierPath: "number",
      },
      name: "",
      title: "New rule",
      timeoutHours: 1,
    };
    setRules((rules) => [...rules, newRule]);
    setExpanded(rules.length - 1);
  };

  const updateRule = (idx: number, updates: Partial<Rule>) => {
    setRules((rules) => {
      rules[idx] = { ...rules[idx], ...updates };
      update(rules);
      return rules;
    });
  };

  const deleteRule = (idx: number) => {
    setRules((rules) => {
      rules.splice(idx, 1);
      update(rules);
      return rules;
    });
  };

  return (
    <div
      className="settings"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <h2>Settings</h2>

      <div className="rules">
        {rules.map((rule, idx) => {
          const handleUpdate = (updates: Partial<Rule>) =>
            updateRule(idx, updates);
          const handleDelete = () => deleteRule(idx);
          const handleExpand = () => setExpanded(idx);

          return (
            <RuleEditor
              rule={rule}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onExpand={handleExpand}
              expanded={expanded === idx}
              key={idx}
            />
          );
        })}
      </div>
      <div className="buttons">
        <aha-button onClick={onAddRule}>Add rule</aha-button>
        <aha-button onClick={onDone}>Done</aha-button>

        {updating && (
          <span>
            <aha-spinner /> Saving
          </span>
        )}
      </div>
    </div>
  );
};
