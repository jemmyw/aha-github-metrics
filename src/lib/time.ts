export const DURATIONS = {
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

/**
 * @param d date
 * @returns seconds since epoch
 */
export function seconds(d: Date) {
  return d.valueOf() / 1000;
}

/**
 * @returns seconds since epoch
 */
export function nowSeconds() {
  return seconds(new Date());
}

/**
 * @param s duration in seconds
 * @returns friendly duration. 1mo | 1w | 1d | 1h | 1m | 1s
 */
export function formatSeconds(s: number) {
  for (let t of ["month", "week", "day", "hour", "minute"] as Array<
    keyof typeof DURATIONS
  >) {
    if (s > DURATIONS[t])
      return `${Math.floor(s / DURATIONS[t])}${POSTFIXES[t]}`;
  }
  return `${Math.round(s * 100) / 100}s`;
}
