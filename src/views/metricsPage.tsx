import React, { useEffect, useState } from "react";
import { unstable_batchedUpdates } from "react-dom";
import { RecoilRoot, useSetRecoilState } from "recoil";
import { loadRules, rulesAtom } from "../store/rulesAtom";
import { Settings } from "./settings";

const Styles = () => {
  return (
    <style>
      {`
    `}
    </style>
  );
};

const Page: React.FC<{}> = () => {
  const setRules = useSetRecoilState(rulesAtom);
  const [loaded, setLoaded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadRules().then((rules) => {
      unstable_batchedUpdates(() => {
        setRules(rules);
        setShowSettings(rules.length === 0);
        setLoaded(true);
      });
    });
  }, []);

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

aha.on("metricsPage", ({ fields, onUnmounted }, { identifier, settings }) => {
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
