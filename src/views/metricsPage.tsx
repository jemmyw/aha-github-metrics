import React, { useEffect, useState } from "react";
import { RecoilRoot, useRecoilState } from "recoil";
import { loadRules } from "../lib/rules";
import { rulesAtom } from "../store/rulesAtom";
import { showSettingsAtom } from "../store/settingsAtom";
import { Settings } from "./settings";

const Styles = () => {
  return (
    <style>
      {`
      .settings label {
        font-size: 90%;
        margin-bottom: 0;
      }
      .rule-editor {
        border: 1px solid var(--aha-gray-200);
        background-color: var(--aha-gray-100);
      }
      .settings .rules {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .rule-event {
        border: 1px solid var(--aha-gray-400);
        padding: 3px;
        margin: 3px;
      }
      .match .path {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }
      .match .path input {
        margin-bottom: 0;
      }
    `}
    </style>
  );
};

const Page: React.FC<{}> = () => {
  const [rules, setRules] = useRecoilState(rulesAtom);
  const [loaded, setLoaded] = useState(false);
  const [showSettings, setShowSettings] = useRecoilState(showSettingsAtom);

  useEffect(() => {
    loadRules().then((rules) => {
      setRules(rules);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (rules.length === 0) {
      setShowSettings(true);
    }
  }, [loaded]);

  if (!loaded) return <aha-spinner />;

  if (showSettings) return <Settings onDone={() => setShowSettings(false)} />;

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div>
          <aha-button onClick={() => setShowSettings(true)}>
            Settings
          </aha-button>
        </div>
      </div>
    </div>
  );
};

aha.on("metricsPage", ({}, {}) => {
  return (
    <RecoilRoot>
      <>
        <Styles />
        <div className="header">
          <h1 className="title">Metrics Page</h1>
        </div>

        <Page />
      </>
    </RecoilRoot>
  );
});
