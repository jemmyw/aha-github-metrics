import { Line } from "@nivo/line";
import React, { useEffect, useState } from "react";
import { EXTENSION_ID } from "../extension";
import { Bin, binFieldName, getRuleBins } from "../lib/bins";
import { Rule } from "../lib/rules";

const CustomSymbol = ({ size, color, borderWidth, borderColor }: any) => (
  <g>
    <circle
      fill="#fff"
      r={size / 2}
      strokeWidth={borderWidth}
      stroke={borderColor}
    />
    <circle
      r={size / 5}
      strokeWidth={borderWidth}
      stroke={borderColor}
      fill={color}
      fillOpacity={0.35}
    />
  </g>
);

async function loadData(rule: Rule): Promise<Bin[]> {
  const bins = await getRuleBins(rule);
  if (!bins) throw new Error("No data collected yet");
  const binsFrom = Math.max(1, bins.length - 50);
  const binsTo = bins.length;

  // const binQueries = [];
  // const binNames = [];
  // const variables: Record<string, string> = {};

  // for (let i = binsFrom; i <= binsTo; i++) {
  //   const name = binFieldName(rule, i);
  //   binNames.push(`bin${i}`);
  //   variables[`name${i}`] = name;
  //   binQueries.push(`
  //     bin${i}: extensionFields(filters: {extensionIdentifier: $identifier, name: $name${i}}) {
  //       value
  //     }
  //   `);
  // }

  // const varParams = Object.keys(variables)
  //   .map((name) => `$${name}: String`)
  //   .join(", ");

  // const query = `query GetBins($identifier: String!, $accountId: ID!, ${varParams}) {
  //   account(id: $accountId) {
  //     ${binQueries.join("\n")}
  //   }
  // }`;
  // console.log(query);

  // const response = await (aha as any).graphQuery(query, {
  //   variables: {
  //     identifier: EXTENSION_ID,
  //     accountId: aha.account.id,
  //     ...variables,
  //   },
  // });
  // console.log(response);

  // return binNames
  //   .map((name) => response[name].extensionFields[0]?.value)
  //   .filter(Boolean) as Bin[];

  const promises: Promise<Bin | null>[] = [];
  for (let i = binsFrom; i <= binsTo; i++) {
    promises.push(
      aha.account.getExtensionField(EXTENSION_ID, binFieldName(rule, i))
    );
  }

  return Promise.all(promises).then((bins) => bins.filter(Boolean) as Bin[]);
}

const RulePanelContainer: React.FC<{ rule: Rule }> = ({ rule, children }) => {
  return (
    <div className="rule-panel">
      <h2>{rule.title || rule.name}</h2>
      {children}
    </div>
  );
};

const DURATIONS = {
  second: 1,
  minute: 60,
  hour: 60 * 60,
  day: 60 * 60 * 24,
  week: 60 * 60 * 24 * 7,
  month: (60 * 60 * 24 * 365) / 12,
};
const POSTFIXES = {
  second: "s",
  minute: "m",
  hour: "h",
  day: "d",
  week: "w",
  month: "mo",
};
function formatSeconds(s: number) {
  for (let t of ["month", "week", "day", "hour", "minute"] as Array<
    keyof typeof DURATIONS
  >) {
    if (s > DURATIONS[t])
      return `${Math.floor(s / DURATIONS[t])}${POSTFIXES[t]}`;
  }
  return `${Math.round(s * 100) / 100}s`;
}

export const RulePanel: React.FC<{ rule: Rule }> = ({ rule }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bins, setBins] = useState<Bin[] | null>(null);

  useEffect(() => {
    loadData(rule)
      .then((bins) => {
        setBins(bins);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  if (error) {
    return (
      <RulePanelContainer rule={rule}>
        <p>{error}</p>
      </RulePanelContainer>
    );
  }

  if (loading || !bins) {
    return (
      <RulePanelContainer rule={rule}>
        <aha-spinner />
      </RulePanelContainer>
    );
  }

  const data = bins.map((bin) => {
    const d = new Date((bin.startAt + (bin.lastAt - bin.startAt) / 2) * 1000);

    return {
      x: d,
      y: bin.mean,
    };
  });

  return (
    <RulePanelContainer rule={rule}>
      <Line
        width={900}
        height={400}
        margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
        animate={true}
        data={[
          {
            id: "Mean",
            data: data,
          },
        ]}
        xScale={{
          type: "time",
          format: "native",
          precision: "minute",
        }}
        xFormat="time:%Y-%m-%d %H:%M"
        yScale={{
          type: "linear",
          stacked: false,
        }}
        yFormat={(d) => formatSeconds(Number(d.valueOf()))}
        axisLeft={{}}
        axisBottom={{
          format: "%b %d %H:%M",
          // tickValues: "every 5 minutes",
        }}
        curve="linear"
        enablePointLabel={true}
        pointSymbol={CustomSymbol}
        pointSize={16}
        pointBorderWidth={1}
        pointBorderColor={{
          from: "color",
          modifiers: [["darker", 0.3]],
        }}
        useMesh={true}
        enableSlices={false}
      />
    </RulePanelContainer>
  );
};
