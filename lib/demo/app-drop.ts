/**
 * The full demo: "Our app's daily active users dropped about 30% in September"
 * at Northwind Home (the Demo ERP's fictional retailer). The data is built so
 * the answer is genuinely in it: Android app 5.2.0, released from 7 Sep with a
 * new sign-in, fails at login for many users. A tracking change is the rival
 * explanation; the release notes and the ERP's app orders (which really fall)
 * rule it out. Veyra still does all the work — nothing here is scripted.
 *
 * Deterministic: the same files every time.
 */

export const APP_DROP = {
  key: "app-drop",
  title: "App users dropped in September",
  problem: "Our app's daily active users dropped about 30% in September.",
  objective: "Find out why app usage fell, whether we lost real customers, and what to do about it.",
  knownContext:
    "We released app updates in early September. Marketing spend and pricing didn't change. Website traffic looks normal.",
  questions: [
    { question: "When did you first notice the drop, and has it recovered?", answer: "Around 8–10 September. It hasn't recovered." },
    { question: "Did anything change in the app or your tracking around then?", answer: "Android 5.2.0 went out from 7 September. Not sure about tracking." },
    { question: "Is the drop on every platform?", answer: "We think mostly Android, but haven't checked properly." },
  ],
  triggers: ["metric-changed"],
  outcomes: ["understand-change"],
} as const;

/** Files the demo starts with, and the one Veyra has to ask for. */
export type DemoFile = { key: "activity" | "tickets" | "release-notes" | "crashes"; name: string; heldBack?: boolean };
export const DEMO_FILES: DemoFile[] = [
  { key: "activity", name: "app-activity-daily.csv" },
  { key: "tickets", name: "support-tickets.csv" },
  { key: "release-notes", name: "app-release-notes.csv" },
  { key: "crashes", name: "crash-reports-by-version.csv", heldBack: true },
];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const START = "2026-07-01";
const END = "2026-09-30";
const RELEASE = "2026-09-07";
const DAY = 86_400_000;
const days = () => {
  const out: string[] = [];
  for (let t = Date.parse(`${START}T00:00:00Z`); t <= Date.parse(`${END}T00:00:00Z`); t += DAY) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
};
const daysSince = (d: string, from: string) => Math.round((Date.parse(`${d}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY);
/** Share of Android users on 5.2.0: a staged rollout over four days. */
const rollout = (d: string) => (d < RELEASE ? 0 : [0.25, 0.55, 0.8, 0.95][daysSince(d, RELEASE)] ?? 1);
const csv = (rows: (string | number)[][]) => rows.map((r) => r.map((v) => (typeof v === "string" && /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(",")).join("\n") + "\n";
const weekly = (d: string) => (new Date(`${d}T00:00:00Z`).getUTCDay() % 6 === 0 ? 1.08 : 1);

/** Daily activity by platform and app version. Android users on 5.2.0 mostly can't get past sign-in. */
export function activityCsv(): string {
  const r = rng(11);
  const rows: (string | number)[][] = [["date", "platform", "app_version", "dau", "new_users", "sessions", "avg_session_minutes"]];
  for (const d of days()) {
    const n = (base: number, spread = 0.035) => base * weekly(d) * (1 + (r() - 0.5) * 2 * spread);
    const ios = n(5250);
    rows.push([d, "ios", d < "2026-08-12" ? "5.1.2" : "5.1.3", Math.round(ios), Math.round(ios * 0.072), Math.round(ios * 2.3), (6.4 + r() * 0.8).toFixed(1)]);
    const android = n(6500);
    const share = rollout(d);
    const old = android * (1 - share);
    // On 5.2.0 only about a third of users get through sign-in on a given day.
    const broken = android * share * 0.33;
    if (old >= 1) rows.push([d, "android", "5.1.0", Math.round(old), Math.round(old * 0.076), Math.round(old * 2.3), (6.9 + r() * 0.6).toFixed(1)]);
    if (broken >= 1) rows.push([d, "android", "5.2.0", Math.round(broken), Math.round(broken * 0.05), Math.round(broken * 2.25), (5.4 + r() * 0.6).toFixed(1)]);
    const web = n(1850);
    rows.push([d, "web", "web", Math.round(web), Math.round(web * 0.07), Math.round(web * 2.0), (6.5 + r() * 0.9).toFixed(1)]);
  }
  return csv(rows);
}

/** Crash and sign-in health by app version — the evidence held back until Veyra asks for it. */
export function crashesCsv(): string {
  const r = rng(23);
  const rows: (string | number)[][] = [["date", "platform", "app_version", "sessions", "crash_free_sessions_pct", "login_attempts", "login_failures"]];
  for (const d of days()) {
    const share = rollout(d);
    const add = (platform: string, version: string, sessions: number, crashFree: number, failRate: number) => {
      if (sessions < 1) return;
      const attempts = Math.round(sessions * 0.42);
      rows.push([d, platform, version, Math.round(sessions), crashFree.toFixed(2), attempts, Math.round(attempts * failRate)]);
    };
    add("ios", d < "2026-08-12" ? "5.1.2" : "5.1.3", 12_000 * (1 + (r() - 0.5) * 0.06), 99.3 + r() * 0.4, 0.018 + r() * 0.006);
    add("android", "5.1.0", 15_000 * (1 - share) * (1 + (r() - 0.5) * 0.06), 99.1 + r() * 0.5, 0.021 + r() * 0.006);
    // 5.2.0: users retry, so sessions stay high while sign-in mostly fails and the app often crashes on the login screen.
    add("android", "5.2.0", 15_000 * share * 0.95 * (1 + (r() - 0.5) * 0.06), 71 + r() * 4, 0.62 + r() * 0.08);
  }
  return csv(rows);
}

const TOPICS: Record<string, { subjects: string[]; messages: string[] }> = {
  login: {
    subjects: ["Can't sign in", "Login keeps failing", "Stuck on sign-in screen", "App logs me out", "Sign in not working after update"],
    messages: [
      "Since the update I can't log in. It spins and then says something went wrong.",
      "The app crashes as soon as I tap Sign in. Uninstalled and reinstalled, same thing.",
      "I enter my password and it goes back to the login screen every time.",
      "New Northwind ID sign-in doesn't accept my account. Website works fine.",
      "Updated the app this week and now I can't get past the login page at all.",
      "Sign in with Google just closes the app. I've given up and used the website.",
      "It says my session expired then crashes. Happens every time on my phone.",
      "Can't get into my account on the app since Sunday. My partner's iPhone is fine.",
    ],
  },
  delivery: {
    subjects: ["Where is my order?", "Late delivery", "Tracking not updating", "Delivery slot changed"],
    messages: [
      "My order was due yesterday and tracking hasn't moved.",
      "Courier missed the delivery window, can you rebook?",
      "Tracking still says preparing after five days.",
      "Can I change my delivery address for order in progress?",
    ],
  },
  returns: {
    subjects: ["Return request", "Item arrived damaged", "Refund not received", "Wrong item"],
    messages: [
      "The mug arrived chipped, how do I return it?",
      "Still waiting for my refund from two weeks ago.",
      "I received the wrong colour throw, please advise.",
      "Box was crushed and the lamp base is cracked.",
    ],
  },
  product: {
    subjects: ["Product question", "Size of duvet", "Is this dishwasher safe?", "Stock question"],
    messages: [
      "Is the stoneware set dishwasher safe?",
      "What size is the large linen duvet cover exactly?",
      "When will the oak side table be back in stock?",
      "Does the rug come in a bigger size?",
    ],
  },
};

/** Support tickets with their text. Login complaints jump on Android after 7 Sep; everything else is steady. */
export function ticketsCsv(): string {
  const r = rng(37);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
  const rows: (string | number)[][] = [["ticket_id", "created_date", "platform", "app_version", "topic", "subject", "message"]];
  let id = 30411;
  for (const d of days()) {
    const share = rollout(d);
    const counts: [string, number][] = [
      ["delivery", 3 + r() * 3],
      ["returns", 2 + r() * 2],
      ["product", 1.5 + r() * 2],
      ["login", 0.5 + r() * 1 + share * (18 + r() * 8)],
    ];
    for (const [topic, n] of counts) {
      for (let i = 0; i < Math.round(n); i++) {
        const onAndroid52 = topic === "login" && r() < share * 0.92;
        const platform = onAndroid52 ? "android" : pick(["web", "ios", "android", "email"]);
        const version = onAndroid52 ? "5.2.0" : platform === "android" ? "5.1.0" : platform === "ios" ? (d < "2026-08-12" ? "5.1.2" : "5.1.3") : "";
        rows.push([`T-${id++}`, d, platform, version, topic, pick(TOPICS[topic].subjects), pick(TOPICS[topic].messages)]);
      }
    }
  }
  return csv(rows);
}

/** Release notes: what each version changed. 5.2.0 changed sign-in; no release changed analytics. */
export function releaseNotesCsv(): string {
  return csv([
    ["version", "platform", "release_date", "rollout", "notes"],
    ["5.0.4", "android", "2026-05-12", "100% over 3 days", "Bug fixes for checkout on older devices. Analytics SDK unchanged."],
    ["5.1.0", "android", "2026-06-16", "100% over 4 days", "Faster product pages. Wishlist sync with the website. Analytics SDK unchanged."],
    ["5.1.2", "ios", "2026-06-18", "100%", "Faster product pages. Wishlist sync with the website. Analytics SDK unchanged."],
    ["5.1.3", "ios", "2026-08-12", "100%", "Fixes a crash when opening order history. Analytics SDK unchanged."],
    [
      "5.2.0",
      "android",
      "2026-09-07",
      "25% → 55% → 80% → 100% (7–10 Sep)",
      "New sign-in with Northwind ID: replaces the old login screen and moves sessions to new tokens. Users are asked to sign in again after updating. Analytics SDK and event tracking unchanged.",
    ],
    ["5.2.0", "ios", "", "on hold (planned)", "Same sign-in change as Android. Held back pending Android feedback."],
  ]);
}

export function demoFileContent(key: DemoFile["key"]): string {
  switch (key) {
    case "activity":
      return activityCsv();
    case "tickets":
      return ticketsCsv();
    case "release-notes":
      return releaseNotesCsv();
    case "crashes":
      return crashesCsv();
  }
}
