// utils.ts

// --------------------
// Number Helpers
// --------------------

/**
 * Clamp a number between a min and max.
 * @param num The number to clamp.
 * @param min Minimum allowed value.
 * @param max Maximum allowed value.
 * @returns Clamped number.
 */
export const clamp = (num: number, min: number, max: number): number =>
  Math.min(Math.max(num, min), max);

/**
 * Get a random integer between min and max (inclusive).
 * @param min Minimum integer.
 * @param max Maximum integer.
 * @returns Random integer.
 */
export const randomInt = (min: number, max: number): number =>
  Math.floor(random56Bit() * (max - min + 1)) + min;

/**
 * Get a random float between min and max.
 * @param min Minimum float.
 * @param max Maximum float.
 * @returns Random float.
 */
export const randomFloat = (min: number, max: number): number =>
  random56Bit() * (max - min) + min;

/**
 * Convert a value to a percentage of a total.
 * @param value The part value.
 * @param total The total value.
 * @returns Percentage (0-100).
 */
export const percent = (value: number, total: number): number =>
  (value / total) * 100;

// --------------------
// Array Helpers
// --------------------

/**
 * Pick a random element from an array.
 * @param arr The array to pick from.
 * @returns A random element.
 */
export const pickRandom = <T>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];

/**
 * Shuffle an array (Fisher–Yates algorithm) and return a new array.
 * @param arr The array to shuffle.
 * @returns Shuffled array.
 */
export const shuffle = <T>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/**
 * Remove an element from an array by index. Throws if index is -1.
 * @param arr The array.
 * @param index Index to remove.
 * @returns The removed element.
 * @throws If index is -1.
 */
export const arrayYeet = <T>(arr: T[], index: number): T => {
  if (index === -1) throw new Error("Cannot remove element at index -1");
  return arr.splice(index, 1)[0];
};

/**
 * Clamp an array index safely.
 * @param arr Array to clamp.
 * @param idx Index.
 * @returns Element at clamped index.
 */
export const clampArrayIndex = <T>(arr: T[], idx: number): T =>
  arr[clamp(idx, 0, arr.length - 1)];

/**
 * Pick a weighted random element from an array of {item, weight}.
 * @param items Items with weights.
 * @returns Chosen item.
 */
export const randomChoiceWeighted = <T>(
  items: { item: T; weight: number }[],
): T => {
  const total = items.reduce((acc, i) => acc + i.weight, 0);
  let rnd = random56Bit() * total;
  for (const i of items) {
    if (rnd < i.weight) return i.item;
    rnd -= i.weight;
  }
  return items[items.length - 1].item; // fallback
};

// --------------------
// Async Helpers
// --------------------

/**
 * Delay execution for a given number of milliseconds.
 * @param ms Milliseconds to wait.
 * @returns Promise that resolves after delay.
 */
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retry a promise-returning function a number of times with delay between attempts.
 * @param fn Async function to retry.
 * @param attempts Number of attempts (default 3).
 * @param delayMs Delay between retries in ms (default 500).
 * @returns The resolved value from fn.
 * @throws Last error if all attempts fail.
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs = 500,
): Promise<T> => {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await delay(delayMs);
    }
  }
  throw lastErr;
};

// --------------------
// String Helpers
// --------------------

/**
 * Capitalize the first letter of a string.
 * @param str Input string.
 * @returns Capitalized string.
 */
export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Truncate a string to a max length, adding "..." if truncated.
 * @param str Input string.
 * @param maxLen Maximum length.
 * @returns Truncated string.
 */
export const truncate = (str: string, maxLen: number): string =>
  str.length > maxLen ? str.slice(0, maxLen - 3) + "..." : str;

/**
 * Clamp a number between 0 and 1.
 * @param num The number to clamp.
 * @returns Clamped number between 0 and 1.
 */
export const clamp01 = (num: number): number => clamp(num, 0, 1);

/**
 * Linearly interpolate between two numbers.
 * @param a Start value.
 * @param b End value.
 * @param t Interpolation factor (0–1).
 * @returns Interpolated value.
 */
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/**
 * Pick a random value between two numbers using linear interpolation.
 * @param a Start value.
 * @param b End value.
 * @returns Random number between a and b.
 */
export const randomLerp = (a: number, b: number): number =>
  lerp(a, b, random56Bit());

/**
 * Generate a biased random number between 0 and 1.
 * @param bias Value >0 to skew.
 *             - \> 1 biases toward 0,
 *             - \< 1 biases toward 1,
 *             - 1 = uniform.
 * @returns Biased random number between 0 and 1.
 */
export const biasedRandom = (bias: number = 1): number =>
  safePow(random56Bit(), bias);

export function safePow(base: number, exponent: number): number {
  if (base === 0) return 0;

  return Math.sign(base) * Math.pow(Math.abs(base), exponent);
}

/**
 * Pick a random value from an array, optionally biased with t (0–1).
 * @param arr Array to pick from.
 * @param t Optional interpolation factor (0–1) to bias which element is picked.
 *          - If omitted, picks uniformly.
 * @returns A chosen element from the array.
 */
export const randomArrayValue = <T>(arr: T[], t?: number): T => {
  if (arr.length === 0) throw new Error("Cannot pick from empty array");

  const idx =
    t !== undefined
      ? Math.floor(clamp01(t) * (arr.length - 1))
      : randomInt(0, arr.length - 1);

  return arr[idx];
};

export const numMultipliers = {
  "": 1,
  k: 1e3,
  m: 1e6,
  b: 1e9,
  t: 1e12,
  qa: 1e15,
  qi: 1e18,
  sx: 1e21,
  sp: 1e24,
  oc: 1e27,
  no: 1e30,
  dc: 1e33,
  ud: 1e36,
  dd: 1e39,
  td: 1e42,
  qad: 1e45,
  qid: 1e48,
  sxd: 1e51,
  spd: 1e54,
  ocd: 1e57,
  nod: 1e60,
  vg: 1e63,
  uvg: 1e66,
  dvg: 1e69,
  tvg: 1e72,
  qavg: 1e75,
  qivg: 1e78,
  sxvg: 1e81,
  spvg: 1e84,
  ocvg: 1e87,
  novg: 1e90,
  trg: 1e93,
  utrg: 1e96,
  dtrg: 1e99,
  ttrg: 1e102,
  qatrg: 1e105,
  qitrg: 1e108,
  sxtrg: 1e111,
  sptrg: 1e114,
  octrg: 1e117,
  notrg: 1e120,
  qag: 1e123,
  uqag: 1e126,
  dqag: 1e129,
  tqag: 1e132,
  qaqag: 1e135,
  qiqag: 1e138,
  sxqag: 1e141,
  spqag: 1e144,
  ocqag: 1e147,
  noqag: 1e150,
  qig: 1e153,
  uqig: 1e156,
  dqig: 1e159,
  tqig: 1e162,
  qaqig: 1e165,
  qiqig: 1e168,
  sxqig: 1e171,
  spqig: 1e174,
  ocqig: 1e177,
  noqig: 1e180,
  sxg: 1e183,
  usxg: 1e186,
  dsxg: 1e189,
  tsxg: 1e192,
  qasxg: 1e195,
  qisxg: 1e198,
  sxsxg: 1e201,
  spsxg: 1e204,
  ocsxg: 1e207,
  nosxg: 1e210,
  spg: 1e213,
  uspg: 1e216,
  dspg: 1e219,
  tspg: 1e222,
  qaspg: 1e225,
  qispg: 1e228,
  sxspg: 1e231,
  spspg: 1e234,
  ocspg: 1e237,
  nospg: 1e240,
  ocg: 1e243,
  uocg: 1e246,
  docg: 1e249,
  tocg: 1e252,
  qaocg: 1e255,
  qiocg: 1e258,
  sxocg: 1e261,
  spocg: 1e264,
  ococg: 1e267,
  noocg: 1e270,
  nog: 1e273,
  unog: 1e276,
  dnog: 1e279,
  tnog: 1e282,
  qanog: 1e285,
  qinog: 1e288,
  sxnog: 1e291,
  spnog: 1e294,
  ocnog: 1e297,
  nonog: 1e300,
  ctg: 1e303,
  uctg: 1e306,
  ctc: 1e309,
} as const;

import { FilterKeysByValue } from "@zeyah-bot/types";
import axios, { AxiosRequestConfig } from "axios";
import Decimal from "decimal.js";
import { randomBytes } from "node:crypto";
import Stream from "node:stream";

export function parseBetDecimal(
  arg: string,
  totalBalance: Decimal = null,
): Decimal {
  try {
    if (arg === null || arg === undefined) return null;

    const multipliers = numMultipliers;

    let targetArg = String(arg).trim().toLowerCase();

    if (
      (targetArg === "allin" || targetArg === "all") &&
      totalBalance !== null
    ) {
      return totalBalance;
    }

    if (targetArg.endsWith("%") && totalBalance !== null) {
      const per = new Decimal(targetArg.replace("%", "")).div(100);
      return totalBalance.mul(per).floor();
    }

    const clean = targetArg.replace(/[, _]/g, "");

    const suffixPattern = Object.keys(multipliers)
      .sort((a, b) => b.length - a.length)
      .join("|");

    const regex = new RegExp(
      `^([\\d.]+(?:e[+-]?\\d+)?)(?:(${suffixPattern}))?$`,
      "i",
    );

    const match = clean.match(regex);

    if (!match) return Decimal(0);

    const numberPart = new Decimal(match[1]);
    const abbreviation = match[2]?.toLowerCase();

    if (!abbreviation) {
      return numberPart.floor();
    }

    const multiplier = Reflect.get(multipliers, abbreviation);

    if (multiplier === undefined) return Decimal(0);

    return numberPart.mul(multiplier).floor();
  } catch (error) {
    return Decimal(0);
  }
}

const numSuffixes = [
  "", // 10^0
  "K", // 10^3
  "M", // 10^6
  "B", // 10^9
  "T", // 10^12
  "Qa", // Quadrillion, 10^15
  "Qi", // Quintillion, 10^18
  "Sx", // Sextillion, 10^21
  "Sp", // Septillion, 10^24
  "Oc", // Octillion, 10^27
  "No", // Nonillion, 10^30
  "Dc", // Decillion, 10^33
  "Ud", // Undecillion, 10^36
  "Dd", // Duodecillion, 10^39
  "Td", // Tredecillion, 10^42
  "Qad", // Quattuordecillion, 10^45
  "Qid", // Quindecillion, 10^48
  "Sxd", // Sexdecillion, 10^51
  "Spd", // Septendecillion, 10^54
  "Ocd", // Octodecillion, 10^57
  "Nod", // Novemdecillion, 10^60
  "Vg", // Vigintillion, 10^63
  "Uvg", // Unvigintillion, 10^66
  "Dvg", // Duovigintillion, 10^69
  "Tvg", // Tresvigintillion, 10^72
  "Qavg", // Quattuorvigintillion, 10^75
  "Qivg", // Quinquavigintillion, 10^78
  "Sxvg", // Sexvigintillion, 10^81
  "Spvg", // Septenvigintillion, 10^84
  "Ocvg", // Octovigintillion, 10^87
  "Novg", // Novemvigintillion, 10^90
  "Trg", // Trigintillion, 10^93
  "Utrg", // Untrigintillion, 10^96
  "Dtrg", // Duotrigintillion, 10^99
  "Ttrg", // Trestrigintillion, 10^102
  "Qatrg", // Quattuortrigintillion, 10^105
  "Qitrg", // Quinquatrigintillion, 10^108
  "Sxtrg", // Sextrigintillion, 10^111
  "Sptrg", // Septentrigintillion, 10^114
  "Octrg", // Octotrigintillion, 10^117
  "Notrg", // Novemtrigintillion, 10^120
  "Qag", // Quadragintillion, 10^123
  "Uqag", // Unquadragintillion, 10^126
  "Dqag", // Duoquadragintillion, 10^129
  "Tqag", // Tresquadragintillion, 10^132
  "Qaqag", // Quattuorquadragintillion, 10^135
  "Qiqag", // Quinquaquadragintillion, 10^138
  "Sxqag", // Sexquadragintillion, 10^141
  "Spqag", // Septenquadragintillion, 10^144
  "Ocqag", // Octoquadragintillion, 10^147
  "Noqag", // Novemquadragintillion, 10^150
  "Qig", // Quinquagintillion, 10^153
  "Uqig", // Unquinquagintillion, 10^156
  "Dqig", // Duoquinquagintillion, 10^159
  "Tqig", // Tresquinquagintillion, 10^162
  "Qaqig", // Quattuorquinquagintillion, 10^165
  "Qiqig", // Quinquaquinquagintillion, 10^168
  "Sxqig", // Sexquinquagintillion, 10^171
  "Spqig", // Septenquinquagintillion, 10^174
  "Ocqig", // Octoquinquagintillion, 10^177
  "Noqig", // Novemquinquagintillion, 10^180
  "Sxg", // Sexagintillion, 10^183
  "Usxg", // Unsexagintillion, 10^186
  "Dsxg", // Duosexagintillion, 10^189
  "Tsxg", // Tresexagintillion, 10^192
  "Qasxg", // Quattuorsexagintillion, 10^195
  "Qisxg", // Quinquasexagintillion, 10^198
  "Sxsxg", // Sexsexagintillion, 10^201
  "Spsxg", // Septensexagintillion, 10^204
  "Ocsxg", // Octosexagintillion, 10^207
  "Nosxg", // Novemsexagintillion, 10^210
  "Spg", // Septuagintillion, 10^213
  "Uspg", // Unseptuagintillion, 10^216
  "Dspg", // Duoseptuagintillion, 10^219
  "Tspg", // Treseptuagintillion, 10^222
  "Qaspg", // Quattuorseptuagintillion, 10^225
  "Qispg", // Quinquaseptuagintillion, 10^228
  "Sxspg", // Sexseptuagintillion, 10^231
  "Spspg", // Septenseptuagintillion, 10^234
  "Ocspg", // Octoseptuagintillion, 10^237
  "Nospg", // Novemseptuagintillion, 10^240
  "Ocg", // Octogintillion, 10^243
  "Uocg", // Unoctogintillion, 10^246
  "Docg", // Duooctogintillion, 10^249
  "Tocg", // Tresoctogintillion, 10^252
  "Qaocg", // Quattuoroctogintillion, 10^255
  "Qiocg", // Quinquaoctogintillion, 10^258
  "Sxocg", // Sexoctogintillion, 10^261
  "Spocg", // Septenoctogintillion, 10^264
  "Ococg", // Octooctogintillion, 10^267
  "Noocg", // Novemoctogintillion, 10^270
  "Nog", // Nonagintillion, 10^273
  "Unog", // Unnonagintillion, 10^276
  "Dnog", // Duononagintillion, 10^279
  "Tnog", // Tresnonagintillion, 10^282
  "Qanog", // Quattuornonagintillion, 10^285
  "Qinog", // Quinquanonagintillion, 10^288
  "Sxnog", // Sexnonagintillion, 10^291
  "Spnog", // Septennonagintillion, 10^294
  "Ocnog", // Octononagintillion, 10^297
  "Nonog", // Novemnonagintillion, 10^300
  "Ctg", // Centillion, 10^303
  "Uctg", // Uncentillion, 10^306
  "Ctc", // Centicentillion, 10^309
];

const numFullSuffixes = [
  "",
  "Thousand",
  "Million",
  "Billion",
  "Trillion",
  "Quadrillion",
  "Quintillion",
  "Sextillion",
  "Septillion",
  "Octillion",
  "Nonillion",
  "Decillion",
  "Undecillion",
  "Duodecillion",
  "Tredecillion",
  "Quattuordecillion",
  "Quindecillion",
  "Sexdecillion",
  "Septendecillion",
  "Octodecillion",
  "Novemdecillion",
  "Vigintillion",
  "Unvigintillion", // 10^66
  "Duovigintillion", // 10^69
  "Tresvigintillion", // 10^72
  "Quattuorvigintillion", // 10^75
  "Quinquavigintillion", // 10^78
  "Sexvigintillion", // 10^81
  "Septenvigintillion", // 10^84
  "Octovigintillion", // 10^87
  "Novemvigintillion", // 10^90
  "Trigintillion", // 10^93
  "Untrigintillion", // 10^96
  "Duotrigintillion", // 10^99
  "Trestrigintillion", // 10^102
  "Quattuortrigintillion", // 10^105
  "Quinquatrigintillion", // 10^108
  "Sextrigintillion", // 10^111
  "Septentrigintillion", // 10^114
  "Octotrigintillion", // 10^117
  "Novemtrigintillion", // 10^120
  "Quadragintillion", // 10^123
  "Unquadragintillion", // 10^126
  "Duoquadragintillion", // 10^129
  "Tresquadragintillion", // 10^132
  "Quattuorquadragintillion", // 10^135
  "Quinquaquadragintillion", // 10^138
  "Sexquadragintillion", // 10^141
  "Septenquadragintillion", // 10^144
  "Octoquadragintillion", // 10^147
  "Novemquadragintillion", // 10^150
  "Quinquagintillion", // 10^153
  "Unquinquagintillion", // 10^156
  "Duoquinquagintillion", // 10^159
  "Tresquinquagintillion", // 10^162
  "Quattuorquinquagintillion", // 10^165
  "Quinquaquinquagintillion", // 10^168
  "Sexquinquagintillion", // 10^171
  "Septenquinquagintillion", // 10^174
  "Octoquinquagintillion", // 10^177
  "Novemquinquagintillion", // 10^180
  "Sexagintillion", // 10^183
  "Unsexagintillion", // 10^186
  "Duosexagintillion", // 10^189
  "Tresexagintillion", // 10^192
  "Quattuorsexagintillion", // 10^195
  "Quinquasexagintillion", // 10^198
  "Sexsexagintillion", // 10^201
  "Septensexagintillion", // 10^204
  "Octosexagintillion", // 10^207
  "Novemsexagintillion", // 10^210
  "Septuagintillion", // 10^213
  "Unseptuagintillion", // 10^216
  "Duoseptuagintillion", // 10^219
  "Treseptuagintillion", // 10^222
  "Quattuorseptuagintillion", // 10^225
  "Quinquaseptuagintillion", // 10^228
  "Sexseptuagintillion", // 10^231
  "Septenseptuagintillion", // 10^234
  "Octoseptuagintillion", // 10^237
  "Novemseptuagintillion", // 10^240
  "Octogintillion", // 10^243
  "Unoctogintillion", // 10^246
  "Duooctogintillion", // 10^249
  "Tresoctogintillion", // 10^252
  "Quattuoroctogintillion", // 10^255
  "Quinquaoctogintillion", // 10^258
  "Sexoctogintillion", // 10^261
  "Septenoctogintillion", // 10^264
  "Octooctogintillion", // 10^267
  "Novemoctogintillion", // 10^270
  "Nonagintillion", // 10^273
  "Unnonagintillion", // 10^276
  "Duononagintillion", // 10^279
  "Tresnonagintillion", // 10^282
  "Quattuornonagintillion", // 10^285
  "Quinquanonagintillion", // 10^288
  "Sexnonagintillion", // 10^291
  "Septennonagintillion", // 10^294
  "Octononagintillion", // 10^297
  "Novemnonagintillion", // 10^300
  "Centillion", // 10^303
  "Uncentillion", // 10^306
  "Centicentillion", // 10^309
];

export function abbreviateNumberDecimal(
  value: Decimal,
  places = 3,
  isFull = false,
) {
  const num = value instanceof Decimal ? value : new Decimal(value);

  if (!num.isFinite()) return "Invalid input";

  const thousand = new Decimal(1000);

  let magnitude = 0;
  let abs = num.abs();

  while (abs.gte(thousand) && magnitude < numSuffixes.length - 1) {
    abs = abs.div(thousand);
    magnitude++;
  }

  const suffix = isFull ? numFullSuffixes[magnitude] : numSuffixes[magnitude];

  if (!suffix) return num.toExponential();

  const formattedValue =
    places === 0 ? abs.toFixed(0) : abs.toFixed(places).replace(/\.?0+$/, "");

  return `${formattedValue}${isFull ? " " : ""}${suffix}`;
}

export type AwaitedTuple<T extends readonly unknown[]> = {
  [K in keyof T]: Awaited<T[K]>;
};

export function parallel<T extends readonly unknown[]>(
  ...tasks: T
): Promise<AwaitedTuple<T>> {
  return Promise.all(tasks) as Promise<AwaitedTuple<T>>;
}

export const d56_BIT = new Decimal(2).pow(56);
export const d56_NUM = 2 ** 56;
export const d256 = new Decimal(256);

function random56RawDecimal(): Decimal {
  const buffer = randomBytes(7);

  let value = new Decimal(0);

  for (let i = 0; i < 7; i++) {
    value = value.mul(d256).add(buffer[i]);
  }

  return value;
}

export function random56BitD(): Decimal {
  return random56RawDecimal().div(d56_BIT);
}

export function random56Bit(): number {
  return random56RawDecimal().div(d56_NUM).toNumber();
}

export function addCommas(value: Decimal): string {
  const str = value.toString();

  const [intPart, fracPart] = str.split(".");

  const intWithComma = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return fracPart ? `${intWithComma}.${fracPart}` : intWithComma;
}

export function unreachable(x: never): never {
  throw new Error(`Unreachable state: ${x}`);
}

export const UnknownValue = Symbol("unknown") as unknown;
export const Never = Symbol("never") as never;
export const True = true as true;
export const False = false as false;
export const Null = null as null;
export const Undefined = undefined as undefined;
export const Void = undefined as void;

export function range(end: number): Generator<number>;
export function range(start: number, end: number): Generator<number>;
export function range(
  start: number,
  end: number,
  step: number,
): Generator<number>;

export function* range(a: number, b?: number, step = 1): Generator<number> {
  let start: number;
  let end: number;

  if (b === undefined) {
    start = 0;
    end = a;
  } else {
    start = a;
    end = b;
  }

  if (step === 0) {
    throw new Error("step cannot be 0");
  }

  if (step > 0) {
    for (let i = start; i < end; i += step) {
      yield i;
    }
  } else {
    for (let i = start; i > end; i += step) {
      yield i;
    }
  }
}

export function formatList(items: string[], useOxfordComma = true): string {
  const len = items.length;

  if (len === 0) return "";
  if (len === 1) return items[0];
  if (len === 2) return `${items[0]} and ${items[1]}`;

  const last = items[len - 1];
  const rest = items.slice(0, -1).join(", ");

  return useOxfordComma ? `${rest}, and ${last}` : `${rest} and ${last}`;
}

export function formatManilaDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(new Date(timestamp));
}

export * from "@zeyah-utils/botpack-utils";
export * as BotpackUtils from "@zeyah-utils/botpack-utils";
export * from "@zeyah-utils/goat-bot-utils";
export * as GoatbotUtils from "@zeyah-utils/goat-bot-utils";

export function isEqual<A, B extends A>(a: A, ...b: readonly B[]): a is B {
  return b.includes(a as B);
}

export type AnyObject = Record<string | number | symbol, any>;

export class ReflectiveMap<T extends AnyObject> implements Map<
  keyof T,
  T[keyof T]
> {
  #reference: T;
  constructor();
  constructor(object: T);
  constructor(object: T | null = null) {
    this.#reference = object ?? ({} as T);
  }

  set<K extends keyof T>(key: K, value: T[K]): this {
    Reflect.set(this.#reference, key, value);
    return this;
  }

  get<K extends keyof T>(key: K): T[K] | undefined {
    return Reflect.get(this.#reference, key, this.#reference) as T[K];
  }

  has(key: keyof T): boolean {
    return Reflect.has(this.#reference, key);
  }

  delete(key: keyof T): boolean {
    return Reflect.deleteProperty(this.#reference, key);
  }

  clear(): void {
    for (const own of [...Reflect.ownKeys(this.#reference)]) {
      this.delete(own);
    }
  }

  *keys(): MapIterator<keyof T> {
    yield* Reflect.ownKeys(this.#reference);
  }

  *values(): MapIterator<T[keyof T]> {
    for (const own of Reflect.ownKeys(this.#reference)) {
      yield this.get(own);
    }
  }

  *entries(): MapIterator<[keyof T, T[keyof T]]> {
    for (const own of Reflect.ownKeys(this.#reference)) {
      yield [own, this.get(own)];
    }
  }

  forEach(
    callbackfn: <K extends keyof T>(
      value: T[K],
      key: K,
      map: ReflectiveMap<T>,
    ) => void,
    thisArg?: any,
  ): void {
    for (const own of Reflect.ownKeys(this.#reference)) {
      callbackfn(this.get(own), own, this);
    }
  }

  get size() {
    return Reflect.ownKeys(this.#reference).length;
  }

  [Symbol.iterator](): MapIterator<[keyof T, T[keyof T]]> {
    return this.entries();
  }

  [Symbol.toStringTag]: string = "StructuredMap";
}
