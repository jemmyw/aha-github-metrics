import { EXTENSION_ID } from "../extension";
import { collectorFieldName, Rule } from "../lib/rules";
import { Collected, CollectionStore, storeVersioned } from "../lib/store";

const BIN_DURATION = 300;

const binsFieldName = (rule: Rule) => `${rule.name}.bins`;
const binFieldName = (rule: Rule, n: number) => `${rule.name}.bin.${n}`;

interface Bins {
  length: number;
  lastBinStart?: number;
}

interface Bin {
  startAt: number;
  lastAt: number;
  count: number;
  mean: number;
  min: number;
  max: number;
  version: number;
}

const isItTimeForANewBin = (bins: Bins) =>
  new Date().valueOf() / 1000 - bins.lastBinStart > BIN_DURATION;

const deleteField = async (name: string) => {
  await (aha as any).graphMutate(`
    mutation {
      deleteExtensionField(extensionIdentifier: '${EXTENSION_ID}', extensionFieldableType: 'Account', name: '${name}') {
        success
      }
    }
  `);
};

aha.on(
  { event: `${EXTENSION_ID}.bin` },
  async ({ rule, id }: { rule: Rule; id: string }) => {
    const data = await aha.account.getExtensionField<Collected>(
      EXTENSION_ID,
      collectorFieldName(rule, id)
    );
    if (!data) return;
    await deleteField(collectorFieldName(rule, id));

    const { start, finish } = data;
    const duration = finish - start;
    let newBin = false;

    await storeVersioned<Bins>(
      collectorFieldName(rule, id),
      { length: 0 },
      async (bins) => {
        newBin = isItTimeForANewBin(bins);

        if (newBin) {
          const newBinNumber = bins.length + 1;
          const bin: Bin = {
            startAt: finish,
            lastAt: finish,
            count: 1,
            max: duration,
            min: duration,
            mean: duration,
            version: 0,
          };

          await aha.account.setExtensionField(
            EXTENSION_ID,
            binFieldName(rule, newBinNumber),
            bin
          );

          return {
            ...bins,
            length: newBinNumber,
            finish,
          };
        }

        storeVersioned<Bin>(
          binFieldName(rule, bins.length),
          {} as any,
          async (bin) => ({
            ...bin,
            count: bin.count + 1,
            lastAt: finish,
            max: Math.max(bin.max, duration),
            min: Math.min(bin.min, duration),
            mean: (bin.mean + duration) / (bin.count + 1),
          })
        );

        return bins;
      }
    );

    if (newBin) {
      aha.triggerServer("kealabs.github-metrics.rebin", { rule });
    }
  }
);
