import { EXTENSION_ID } from "../extension";
import { Bin, binFieldName, Bins, binsFieldName } from "../lib/bins";
import { Collected, collectorFieldName, Rule } from "../lib/rules";
import { deleteField, getField, setField, storeVersioned } from "../lib/store";

const BIN_DURATION = 300;

const isItTimeForANewBin = (bins: Bins) =>
  !bins.lastBinStart ||
  new Date().valueOf() / 1000 - bins.lastBinStart > BIN_DURATION;

aha.on(
  { event: `${EXTENSION_ID}.bin` },
  async ({ rule, id }: { rule: Rule; id: string }) => {
    const data = await getField<Collected>(collectorFieldName(rule, id));
    if (!data) return;
    await deleteField(collectorFieldName(rule, id));

    const { start, finish } = data;
    if (!finish || !start) return;

    const duration = finish - start;
    let newBin = false;

    await storeVersioned<Bins>(
      binsFieldName(rule),
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

          console.log("Making a new bin", bin);

          await setField(binFieldName(rule, newBinNumber), bin);

          return {
            ...bins,
            length: newBinNumber,
            lastBinStart: finish,
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
            mean: (bin.mean * bin.count + duration) / (bin.count + 1),
          })
        );

        return bins;
      }
    );

    if (newBin) {
      aha.triggerServer(`${EXTENSION_ID}.cleanup`, { rule });
    }
  }
);
