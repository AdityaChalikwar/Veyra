/**
 * The statistics behind Veyra's validation tests, worked out in code. Small,
 * standard methods: Welch's t-test for two sets of daily values, a
 * two-proportion z-test for shares, Pearson correlation and a chi-square test
 * for a shift between categories. Each returns a p-value: the chance of a
 * difference at least this large if nothing had really changed.
 */

/** ln Γ(x), Lanczos approximation. */
function lgamma(x: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012,
    9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Continued fraction for the incomplete beta function. */
function betacf(a: number, b: number, x: number): number {
  const MAXIT = 200;
  const EPS = 3e-14;
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularised incomplete beta I_x(a, b). */
function ibeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** Regularised upper incomplete gamma Q(a, x), for chi-square p-values. */
function gammaQ(a: number, x: number): number {
  if (x <= 0) return 1;
  if (x < a + 1) {
    let sum = 1 / a;
    let del = sum;
    let ap = a;
    for (let n = 0; n < 500; n++) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 3e-14) break;
    }
    return 1 - sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
  }
  let b = x + 1 - a;
  let c = 1 / 1e-300;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c;
    if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-14) break;
  }
  return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}

/** Two-sided p-value for a t statistic with df degrees of freedom. */
export function tPValue(t: number, df: number): number {
  if (!Number.isFinite(t) || df <= 0) return 1;
  return ibeta(df / (df + t * t), df / 2, 0.5);
}

/** Two-sided p-value for a z statistic. */
export function zPValue(z: number): number {
  return tPValue(z, 1e6);
}

export function chiSquarePValue(chi2: number, df: number): number {
  return df > 0 ? gammaQ(df / 2, chi2 / 2) : 1;
}

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const variance = (xs: number[]) => {
  if (xs.length < 2) return NaN;
  const m = mean(xs);
  return xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1);
};

/** Welch's t-test: do two sets of values (e.g. daily totals before and after) differ? */
export function welch(a: number[], b: number[]): { t: number; df: number; p: number } | null {
  if (a.length < 3 || b.length < 3) return null;
  const va = variance(a) / a.length;
  const vb = variance(b) / b.length;
  const se = Math.sqrt(va + vb);
  if (!se) return mean(a) === mean(b) ? { t: 0, df: a.length + b.length - 2, p: 1 } : { t: Infinity, df: a.length + b.length - 2, p: 0 };
  const t = (mean(b) - mean(a)) / se;
  const df = (va + vb) ** 2 / (va ** 2 / (a.length - 1) + vb ** 2 / (b.length - 1));
  return { t, df, p: tPValue(t, df) };
}

/** Two-proportion z-test: do two shares (x1 of n1, x2 of n2) differ? */
export function twoProportions(x1: number, n1: number, x2: number, n2: number): { z: number; p: number } | null {
  if (n1 < 10 || n2 < 10) return null;
  const p = (x1 + x2) / (n1 + n2);
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  if (!se) return { z: 0, p: 1 };
  const z = (x2 / n2 - x1 / n1) / se;
  return { z, p: zPValue(z) };
}

export function pearson(a: number[], b: number[]): { r: number; p: number } | null {
  const n = Math.min(a.length, b.length);
  if (n < 5) return null;
  const ma = mean(a.slice(0, n));
  const mb = mean(b.slice(0, n));
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  if (!da || !db) return null;
  const r = num / Math.sqrt(da * db);
  const t = r * Math.sqrt((n - 2) / Math.max(1e-12, 1 - r * r));
  return { r, p: tPValue(t, n - 2) };
}

/** Chi-square test of independence on a 2 × k table of counts (before / after by category). */
export function chiSquare(before: number[], after: number[]): { chi2: number; df: number; p: number } | null {
  const k = before.length;
  const nb = before.reduce((a, b) => a + b, 0);
  const na = after.reduce((a, b) => a + b, 0);
  if (k < 2 || nb < 10 || na < 10) return null;
  const n = nb + na;
  let chi2 = 0;
  for (let i = 0; i < k; i++) {
    const col = before[i] + after[i];
    if (!col) continue;
    const eb = (nb * col) / n;
    const ea = (na * col) / n;
    chi2 += (before[i] - eb) ** 2 / eb + (after[i] - ea) ** 2 / ea;
  }
  const df = k - 1;
  return { chi2, df, p: chiSquarePValue(chi2, df) };
}

/** How a p-value reads to a busy person. */
export function significance(p: number | undefined, what = "difference"): string {
  if (p === undefined || !Number.isFinite(p)) return "not enough data to say whether it is real";
  if (p < 0.001) return `the ${what} is clearly real (p < 0.001)`;
  if (p < 0.01) return `the ${what} is very likely real (p = ${p.toFixed(3)})`;
  if (p < 0.05) return `the ${what} is probably real (p = ${p.toFixed(3)})`;
  return `the ${what} could be chance (p = ${p.toFixed(2)})`;
}
