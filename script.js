"use strict";

/*
 * KOIN — an educational, local-only prototype.
 * No money is moved and no bank is connected. Use fictional data only.
 * Authentication below is a DEMONSTRATION, not production account security.
 * Raw passwords are never saved. A salted PBKDF2 verifier is used only to make
 * demo sign-in behave realistically; localStorage can still be read/changed by
 * anyone with access to this browser. Never use a real or reused password.
 * A real app needs a trusted backend, secure sessions and proper access controls.
 */

// Small reusable helpers. All user-supplied text is escaped before HTML rendering.
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHTML = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
const icon = (name, className = "") =>
  `<svg class="icon ${className}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const money = (value, decimals = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const localDate = (offset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const shortDate = (value) =>
  new Date(`${value}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Pure finance functions: these never read or change the DOM or saved data.
const Finance = {
  totals(state) {
    const income = roundMoney(
      state.baseIncome +
        state.transactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0),
    );
    const expenses = roundMoney(
      state.transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    );
    return {
      income,
      expenses,
      balance: roundMoney(state.startingBalance + income - expenses),
    };
  },
  goal(goal) {
    const remaining = roundMoney(Math.max(0, goal.target - goal.saved));
    const progress =
      goal.target > 0 ? clamp((goal.saved / goal.target) * 100, 0, 100) : 0;
    // Integer cents avoid rounding a nearly complete contribution down a period.
    const periods =
      goal.contribution > 0
        ? Math.ceil(
            Math.round(remaining * 100) / Math.round(goal.contribution * 100),
          )
        : null;
    return { remaining, progress, periods };
  },
  monthlyIncome(amount, frequency) {
    return roundMoney(
      amount *
        ({ daily: 365 / 12, weekly: 52 / 12, monthly: 1, irregular: 1 }[
          frequency
        ] || 1),
    );
  },
  budget(income) {
    const needs = roundMoney(income * 0.5);
    const wants = roundMoney(income * 0.3);
    return { needs, wants, savings: roundMoney(income - needs - wants) };
  },
  compound(initial, monthly, years, annualRate) {
    const months = Math.round(years * 12);
    const monthlyRate = annualRate / 100 / 12;
    const factor = Math.pow(1 + monthlyRate, months);
    const total =
      monthlyRate === 0
        ? initial + monthly * months
        : initial * factor + monthly * ((factor - 1) / monthlyRate);
    const contributed = initial + monthly * months;
    return {
      total: roundMoney(total),
      contributed: roundMoney(contributed),
      growth: roundMoney(total - contributed),
    };
  },
  spending(transactions) {
    const categories = transactions
      .filter((t) => t.type === "expense")
      .reduce((result, t) => {
        result[t.category] = roundMoney((result[t.category] || 0) + t.amount);
        return result;
      }, {});
    return Object.entries(categories).sort((a, b) => b[1] - a[1]);
  },
};

const TRACKS = [
  {
    id: "saving",
    title: "Saving",
    icon: "leaf",
    subtitle: "Little by little. A lot further.",
  },
  {
    id: "budgeting",
    title: "Budgeting",
    icon: "wallet",
    subtitle: "A plan, not a punishment.",
  },
  {
    id: "spending",
    title: "Spending",
    icon: "bag",
    subtitle: "Buy what matters to you.",
  },
  {
    id: "earning",
    title: "Earning",
    icon: "briefcase",
    subtitle: "Turn your skills into options.",
  },
  {
    id: "investing",
    title: "Investing",
    icon: "trend",
    subtitle: "Understand the long game.",
  },
  {
    id: "knowledge",
    title: "Money basics",
    icon: "book",
    subtitle: "Get to know your money.",
  },
];

const LESSONS = [
  {
    id: "saving",
    title: "Give your savings a purpose.",
    minutes: 4,
    description:
      "Small goals, safety nets, and a saving habit that works in real life.",
    body: `<p>Saving means setting aside money today for a purpose tomorrow. The purpose might be a laptop, education, or simply having options when something unexpected happens.</p><h3>Start with a clear, small goal.</h3><p>Pick an amount and a reason. “Save $100 for a bicycle repair” gives you a clearer next step than “be better with money.” Divide the amount you still need by what you can realistically save each week.</p><div class="lesson-example">A $100 goal, with $20 already saved and $10 added each week, takes 8 more weeks. If your income changes, adjust your plan. Progress can be uneven.</div><h3>Build a cushion, too.</h3><p>An emergency fund is money for unplanned essentials. A first cushion of even $20 or $50 can help. The right size depends on your responsibilities, costs, and access to support. Keep near-term savings somewhere accessible and appropriate for your age.</p><p>If you can, put a small amount aside when you receive money. Saving 10% is an experiment you can try, not a requirement. Essentials come first.</p>`,
    takeaway:
      "Give money a job, make the next step realistic, and adjust without giving up.",
    question:
      "You need $120, have $40 saved, and can save $10 a week. How long until your goal?",
    options: ["4 weeks", "8 weeks", "12 weeks"],
    answer: 1,
    explanation: "You still need $80. At $10 each week, that takes 8 weeks.",
  },
  {
    id: "budgeting",
    title: "Your money needs a game plan.",
    minutes: 5,
    description:
      "Meet a flexible framework for needs, wants, and future-you money.",
    body: `<p>A budget is a plan for the money you have. It helps you spot tradeoffs before you spend, and makes room for the things you care about.</p><h3>Know what comes in and goes out.</h3><p>List income you can reasonably expect. Then list essentials, optional spending, and money you want to save. Include irregular costs, such as school supplies, instead of treating them as a surprise every time.</p><h3>Try the 50/30/20 starting point.</h3><p>One common framework uses 50% for needs, 30% for wants, and 20% for saving or debt repayment. It is a guide, not a test. Your essential costs may take more than half your income. A small allowance may need a completely different split.</p><div class="lesson-example">With $200 available, the framework suggests $100 for needs, $60 for wants, and $40 for savings. If necessary transport costs $120, adjust the other categories rather than pretending the cost is lower.</div><p>Budget from dependable income, especially if earnings are irregular. Check your plan regularly, compare it with what actually happened, and change it when life changes.</p>`,
    takeaway:
      "A useful budget reflects your real circumstances. The percentages serve you.",
    question:
      "Your essential expenses are higher than 50% of your income. What is the best next step?",
    options: [
      "Ignore some essentials to meet the rule",
      "Stop tracking your money",
      "Adjust the split to fit your actual needs",
    ],
    answer: 2,
    explanation:
      "The framework is flexible. Cover essentials and adapt your wants and savings to what is realistic.",
  },
  {
    id: "spending",
    title: "Spend with a little more intention.",
    minutes: 3,
    description:
      "Tell needs from wants, spot the hidden costs, and pause the impulse.",
    body: `<p>Responsible spending means choosing what is worthwhile for you while staying within your means. Enjoying your money can be part of a healthy plan.</p><h3>Needs, wants, and context.</h3><p>A need supports essential living or responsibilities. A want adds comfort or enjoyment. The same item can be a need for one person and a want for another: a laptop might be essential for school, while upgrading a working one may be optional.</p><h3>Put a pause between impulse and purchase.</h3><p>For an optional purchase, try waiting 24 hours. Ask: Would I still want it without the sale? What would I give up to buy it? Is there a lower-cost option that works just as well?</p><div class="lesson-example">A subscription at $8 a month costs $96 over a year, before any extra fees. Three unused subscriptions at that price add up to $288 a year.</div><p>Look at total cost, not just the price in big letters. Shipping, recurring fees, interest, maintenance, and replacement costs can all change the decision. A discount only saves money if you would have bought the item anyway and can afford it.</p>`,
    takeaway:
      "The smartest purchase is one that fits your needs, priorities, and actual budget.",
    question:
      "An unused subscription costs $8 per month. What does it cost over 12 months?",
    options: ["$80", "$96", "$108"],
    answer: 1,
    explanation: "$8 × 12 months = $96. Small recurring expenses can add up.",
  },
  {
    id: "earning",
    title: "Your skills have possibilities.",
    minutes: 4,
    description:
      "Explore realistic earning ideas, fair pricing, and the costs behind income.",
    body: `<p>Extra income can give you more choices. A good place to start is something you already know how to do, or a skill you are willing to learn.</p><h3>Start with a useful skill.</h3><p>Tutoring a subject you understand, pet care for people you know, or helping with basic design can be ideas to explore. Start small and check whether someone actually needs the service before spending money on equipment.</p><p>If you are under 18, involve a trusted adult. Check local working-age rules, any required permission, and platform age restrictions. Prioritize personal safety and protect your private information.</p><h3>Revenue is not the same as profit.</h3><p>Subtract the direct costs of a task from what you earn. Think about travel, supplies, platform fees, time, and any taxes that may apply. Keep simple records.</p><div class="lesson-example">You earn $30 helping at an event and spend $5 on transport and $3 on materials. You keep $22 before any taxes. If it takes 2 hours, that is $11 per hour before tax.</div><p>Avoid offers that promise guaranteed high returns or ask you to pay upfront just to access work. You do not need to monetize every hobby, either. School, rest, and wellbeing matter.</p>`,
    takeaway:
      "Start safely, offer something useful, and count the costs as well as the earnings.",
    question:
      "You earn $40 from a task and spend $12 on supplies. What is your profit before tax?",
    options: ["$52", "$40", "$28"],
    answer: 2,
    explanation:
      "Revenue minus costs: $40 − $12 = $28 before any applicable taxes.",
  },
  {
    id: "investing",
    title: "Get to know the long game.",
    minutes: 5,
    description:
      "Risk, diversification, and compounding — without the get-rich-quick noise.",
    body: `<p>Investing means putting money into assets in the hope that they grow in value or generate income over time. Investments can lose value. No return is guaranteed.</p><h3>Time horizon comes first.</h3><p>Money needed soon for essential costs or a near-term goal generally needs stability and access. Money invested in assets that fluctuate may need years to recover after a fall. Build basic financial resilience before taking investment risk.</p><h3>Understand what you own.</h3><p>A share is a small ownership stake in a company. A bond is a form of lending to an issuer. A fund can hold many assets. Diversification spreads money across investments, reducing reliance on a single one. It cannot remove every risk.</p><div class="lesson-example">At a hypothetical 5% annual return, $100 becomes $105 after one year. If the next year also returns 5%, it becomes $110.25 because growth earns growth. Actual returns change, and some years can be negative.</div><p>Fees, inflation, and taxes affect what you keep. Avoid borrowing to invest as a beginner. If you are a minor, account rules and adult involvement depend on where you live. These lessons explain concepts; they do not recommend a particular asset or investment.</p>`,
    takeaway:
      "Match risk to your time horizon, understand the costs, and question guaranteed returns.",
    question: "What does diversification do?",
    options: [
      "Guarantees a profit every year",
      "Spreads exposure across investments but does not remove all risk",
      "Makes every investment safe for short-term savings",
    ],
    answer: 1,
    explanation:
      "Diversification reduces dependence on any single investment. Markets and diversified portfolios can still fall.",
  },
  {
    id: "knowledge",
    title: "The money words that matter.",
    minutes: 4,
    description:
      "Decode interest, inflation, credit, and the fine print in everyday money.",
    body: `<p>Financial language can sound more complicated than it is. Knowing a few core ideas makes everyday decisions easier to understand.</p><h3>Interest works in two directions.</h3><p>Interest is a cost of borrowing or a payment for certain savings. With simple interest, the calculation is based on the original amount. With compound interest, it also includes previously added interest.</p><div class="lesson-example">Borrow $100 for a year at 20% simple annual interest, with no fees or repayments during the year, and the interest is $20. The total due is $120. Real credit agreements can use different calculations and add fees.</div><h3>Inflation affects buying power.</h3><p>If prices rise, the same amount of money buys less. A savings balance can grow in dollars while losing buying power if prices rise faster than the interest earned.</p><h3>Read the full cost of credit.</h3><p>Credit lets you use money now and repay it later. Look for the annual percentage rate (APR), fees, due dates, and total amount payable. APR definitions vary by product and location. Small minimum repayments may mean paying for much longer.</p><p>Before agreeing, ask someone trusted to explain anything unclear. Never share a password, verification code, or payment details with someone who contacts you unexpectedly.</p>`,
    takeaway:
      "Ask what it costs in total, when it is due, and what could change.",
    question:
      "If prices rise faster than the interest on your savings, what happens to your buying power?",
    options: ["It decreases", "It always increases", "It cannot change"],
    answer: 0,
    explanation:
      "Your balance may increase, but it buys less when prices rise faster. That is the effect of inflation on real buying power.",
  },
];

const CHALLENGES = [
  {
    id: "save-ten",
    category: "saving",
    title: "Pay future you first.",
    difficulty: "Easy",
    xp: 25,
    instruction:
      "Set aside 10% of your next allowance or income payment, if your essentials are covered. Choose a specific purpose for that money.",
    tip: "If 10% is too much, choose a smaller realistic amount. The habit matters more than the percentage.",
  },
  {
    id: "make-budget",
    category: "budgeting",
    title: "Give every coin a job.",
    difficulty: "Medium",
    xp: 35,
    instruction:
      "Write a simple budget that separates needs, wants, and savings. Use the money tools to try a 50/30/20 split, then adjust it to fit your life.",
    tip: "Use dependable income. For irregular income, a cautious estimate is a useful starting point.",
  },
  {
    id: "no-spend",
    category: "spending",
    title: "The no-spend day.",
    difficulty: "Easy",
    xp: 25,
    instruction:
      "Choose one day to skip optional purchases. Keep essential spending like transport and food. At the end, write down one thing you noticed.",
    tip: "This is about noticing habits. Never skip essentials or feel guilty about necessary spending.",
  },
  {
    id: "skill-map",
    category: "earning",
    title: "Find your earning edge.",
    difficulty: "Medium",
    xp: 40,
    instruction:
      "List three skills you could use to help someone. Pick one, estimate the time and costs involved, and write a safe first step to explore demand.",
    tip: "No need to start working to finish this challenge. If you are under 18, discuss the idea with a trusted adult.",
  },
  {
    id: "risk-check",
    category: "investing",
    title: "Think like a long-gamer.",
    difficulty: "Medium",
    xp: 35,
    instruction:
      "Read the investing lesson. Explain diversification in your own words and identify why money needed next month might not belong in volatile investments.",
    tip: "Use a hypothetical example only. Completing this challenge never requires investing real money.",
  },
  {
    id: "fine-print",
    category: "knowledge",
    title: "Read between the fees.",
    difficulty: "Easy",
    xp: 30,
    instruction:
      "Choose a fictional subscription or credit offer. Write down its monthly cost, annual total, cancellation terms, and any extra fees you would want to check.",
    tip: "Try an $8 monthly subscription: the base yearly cost is $96. What else might affect the total?",
  },
];

const GOALS = [
  "Saving for a purchase",
  "Building emergency savings",
  "Learning to budget",
  "Learning about investing",
  "Saving for education",
  "Other",
];
const SITUATIONS = [
  "Student receiving an allowance",
  "Student earning additional income",
  "Young adult with regular income",
  "Other",
];
const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Subscriptions",
  "Education",
  "Essentials",
  "Other",
];
const INCOME_CATEGORIES = [
  "Allowance",
  "Part-time work",
  "Freelance",
  "Gift",
  "Other",
];
const CATEGORY_ICONS = {
  Food: "bag",
  Transport: "arrow",
  Shopping: "bag",
  Entertainment: "spark",
  Subscriptions: "refresh",
  Education: "book",
  Essentials: "shield",
  Other: "wallet",
  Allowance: "coins",
  "Part-time work": "briefcase",
  Freelance: "briefcase",
  Gift: "spark",
};

function newState(isGuest = true) {
  return {
    version: 1,
    profile: {
      nickname: "Friend",
      situation: SITUATIONS[0],
      amount: 600,
      frequency: "monthly",
      goals: [GOALS[0]],
      interests: ["saving", "budgeting"],
      onboarded: false,
    },
    startingBalance: isGuest ? 1000 : 0,
    baseIncome: isGuest ? 500 : 0,
    goal: {
      name: "New laptop fund",
      target: 500,
      saved: isGuest ? 350 : 0,
      contribution: 25,
      frequency: "weekly",
    },
    transactions: isGuest
      ? [
          {
            id: "sample-1",
            description: "Groceries & lunches",
            amount: 120,
            category: "Food",
            date: localDate(-6),
            type: "expense",
          },
          {
            id: "sample-2",
            description: "Tutoring session",
            amount: 100,
            category: "Freelance",
            date: localDate(-5),
            type: "income",
          },
          {
            id: "sample-3",
            description: "Monthly travel pass",
            amount: 80,
            category: "Transport",
            date: localDate(-4),
            type: "expense",
          },
          {
            id: "sample-4",
            description: "A few new essentials",
            amount: 65,
            category: "Shopping",
            date: localDate(-3),
            type: "expense",
          },
          {
            id: "sample-5",
            description: "Weekend with friends",
            amount: 45,
            category: "Entertainment",
            date: localDate(-2),
            type: "expense",
          },
          {
            id: "sample-6",
            description: "Monthly subscriptions",
            amount: 45,
            category: "Subscriptions",
            date: localDate(-1),
            type: "expense",
          },
        ]
      : [],
    completedChallenges: [],
    completedLessons: [],
    challengeOrder: CHALLENGES.map((c) => c.id),
    tools: {
      budgetIncome: 600,
      investmentInitial: 100,
      investmentMonthly: 25,
      investmentYears: 5,
      investmentRate: 5,
    },
  };
}

// Storage is wrapped so privacy mode or a full quota cannot crash the website.
class DemoStore {
  constructor() {
    this.memory = new Map();
    this.failed = false;
  }
  read(key, fallback, session = false) {
    const memoryKey = `${session ? "session:" : ""}${key}`;
    try {
      const value = (session ? sessionStorage : localStorage).getItem(
        `koin-v1:${key}`,
      );
      return value === null
        ? this.memory.has(memoryKey)
          ? this.memory.get(memoryKey)
          : fallback
        : JSON.parse(value);
    } catch {
      return this.memory.has(memoryKey) ? this.memory.get(memoryKey) : fallback;
    }
  }
  write(key, value, session = false) {
    this.memory.set(`${session ? "session:" : ""}${key}`, value);
    try {
      (session ? sessionStorage : localStorage).setItem(
        `koin-v1:${key}`,
        JSON.stringify(value),
      );
    } catch {
      this.failed = true;
    }
  }
  remove(key, session = false) {
    this.memory.delete(`${session ? "session:" : ""}${key}`);
    try {
      (session ? sessionStorage : localStorage).removeItem(`koin-v1:${key}`);
    } catch {
      this.failed = true;
    }
  }
  loadState(key) {
    const initial = newState(key === "guest");
    const saved = this.read(`data:${key}`, null);
    if (!saved || saved.version !== 1) return initial;
    // Validate saved values as localStorage can be edited outside the app.
    const validAmount = (value) =>
      Number.isFinite(value) && value >= 0 && value <= 1e9;
    if (
      !validAmount(saved.startingBalance) ||
      !validAmount(saved.baseIncome) ||
      !Array.isArray(saved.transactions)
    )
      return initial;
    const state = {
      ...initial,
      ...saved,
      profile: { ...initial.profile, ...saved.profile },
      goal: { ...initial.goal, ...saved.goal },
      tools: { ...initial.tools, ...saved.tools },
    };
    state.transactions = saved.transactions
      .filter(
        (t) =>
          t &&
          typeof t.description === "string" &&
          validAmount(t.amount) &&
          ["income", "expense"].includes(t.type) &&
          typeof t.date === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
          !Number.isNaN(new Date(`${t.date}T12:00:00`).getTime()) &&
          [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].includes(t.category),
      )
      .map((t) => ({ ...t, id: String(t.id), amount: roundMoney(t.amount) }));
    if (
      !validAmount(state.goal.saved) ||
      !validAmount(state.goal.target) ||
      state.goal.target === 0 ||
      !validAmount(state.goal.contribution)
    )
      state.goal = initial.goal;
    state.goal.frequency =
      state.goal.frequency === "monthly" ? "monthly" : "weekly";
    state.completedChallenges = [
      ...new Set(
        (Array.isArray(saved.completedChallenges)
          ? saved.completedChallenges
          : []
        ).filter((id) => CHALLENGES.some((c) => c.id === id)),
      ),
    ];
    state.completedLessons = [
      ...new Set(
        (Array.isArray(saved.completedLessons)
          ? saved.completedLessons
          : []
        ).filter((id) => LESSONS.some((l) => l.id === id)),
      ),
    ];
    state.challengeOrder = [
      ...new Set([
        ...(Array.isArray(saved.challengeOrder) ? saved.challengeOrder : []),
        ...CHALLENGES.map((c) => c.id),
      ]),
    ].filter((id) => CHALLENGES.some((c) => c.id === id));
    state.profile.goals = Array.isArray(state.profile.goals)
      ? state.profile.goals.filter((g) => GOALS.includes(g))
      : [];
    state.profile.interests = Array.isArray(state.profile.interests)
      ? state.profile.interests.filter((id) => TRACKS.some((t) => t.id === id))
      : [];
    state.profile.nickname = String(state.profile.nickname || "Friend").slice(
      0,
      24,
    );
    if (!validAmount(state.profile.amount)) state.profile.amount = 600;
    if (
      !["daily", "weekly", "monthly", "irregular"].includes(
        state.profile.frequency,
      )
    )
      state.profile.frequency = "monthly";
    Object.keys(initial.tools).forEach((key) => {
      if (!Number.isFinite(state.tools[key]))
        state.tools[key] = initial.tools[key];
    });
    return state;
  }
}

// Realistic demo password verification, without storing the entered password.
async function passwordVerifier(password, saltHex) {
  if (!globalThis.crypto?.subtle)
    throw new Error(
      "Open Koin with Live Server on localhost to use demo accounts, or explore without an account.",
    );
  const salt = saltHex
    ? Uint8Array.from(saltHex.match(/.{2}/g), (byte) => parseInt(byte, 16))
    : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256,
  );
  const toHex = (bytes) =>
    [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return { salt: toHex(salt), verifier: toHex(new Uint8Array(bits)) };
}

class KoinApp {
  constructor() {
    this.store = new DemoStore();
    const session =
      this.store.read("session", null, true) ||
      this.store.read("session", null);
    this.accounts = this.store.read("accounts", []);
    this.accounts = Array.isArray(this.accounts)
      ? this.accounts.filter(
          (a) =>
            a &&
            typeof a.email === "string" &&
            typeof a.nickname === "string" &&
            /^[0-9a-f]{32}$/.test(a.salt) &&
            /^[0-9a-f]{64}$/.test(a.verifier),
        )
      : [];
    this.user = this.accounts.some((a) => a.email === session?.email)
      ? session
      : null;
    this.dataKey = this.user?.email || "guest";
    this.state = this.store.loadState(this.dataKey);
    this.page = "home";
    this.lessonFilter = "all";
    this.challengeFilter = "all";
    this.activityFilter = "all";
    this.activitySearch = "";
    this.onboardingStep = 0;
    this.onboardingDraft = null;
    this.modal = $("#modal");
    this.bindEvents();
    this.renderHome();
    this.route();
    if (this.store.failed)
      this.toast(
        "Browser storage is unavailable. Your changes will last for this visit only.",
      );
  }

  bindEvents() {
    window.addEventListener("hashchange", () => this.route());
    document.addEventListener("click", (event) => this.handleClick(event));
    document.addEventListener("submit", (event) => this.handleSubmit(event));
    document.addEventListener("input", (event) => this.handleInput(event));
    document.addEventListener("change", (event) => this.handleChange(event));
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || this.modal.open) return;
      if ($("#app-sidebar").classList.contains("open")) {
        $("#app-sidebar").classList.remove("open");
        $("#app-menu").setAttribute("aria-expanded", "false");
        $("#app-menu").focus();
      }
      if (!$("#mobile-nav").hidden) {
        $("#mobile-nav").hidden = true;
        $('[data-action="menu"]').setAttribute("aria-expanded", "false");
        $('[data-action="menu"]').focus();
      }
    });
    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modal) {
        const rect = this.modal.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          this.closeModal();
      }
    });
    this.modal.addEventListener("close", () => {
      document.body.classList.remove("modal-open");
      this.lastFocus?.focus({ preventScroll: true });
    });
    // Delegated cursor tilt works for dynamically rendered cards as well.
    document.addEventListener("pointermove", (event) => {
      if (reducedMotion() || event.pointerType === "touch") return;
      const card = event.target.closest("[data-tilt]");
      if (!card) return;
      const bounds = card.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      card.style.setProperty("--tilt-x", `${-y * 5}deg`);
      card.style.setProperty("--tilt-y", `${x * 5}deg`);
    });
    document.addEventListener("pointerout", (event) => {
      const card = event.target.closest("[data-tilt]");
      if (card && !card.contains(event.relatedTarget)) {
        card.style.setProperty("--tilt-x", "0deg");
        card.style.setProperty("--tilt-y", "0deg");
      }
    });
    const scene = $(".hero-scene");
    scene.addEventListener("pointermove", (event) => {
      if (reducedMotion() || event.pointerType === "touch") return;
      const bounds = scene.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      $(".hero-wallet").style.transform =
        `translateZ(30px) rotateX(${12 - y * 6}deg) rotateY(${-14 + x * 9}deg) rotate(-8deg)`;
    });
    scene.addEventListener("pointerleave", () => {
      $(".hero-wallet").style.transform = "";
    });
  }

  save() {
    this.store.write(`data:${this.dataKey}`, this.state);
    if (this.store.failed && !this.storageNoticeShown) {
      this.storageNoticeShown = true;
      this.toast(
        "Storage is unavailable. Changes will last for this visit only.",
      );
    }
  }

  renderHome() {
    $("#copyright-year").textContent = new Date().getFullYear();
    $("#home-categories").innerHTML = TRACKS.map(
      (track) =>
        `<a class="category-tile" href="#learn/${track.id}">${icon(track.icon)}${icon("up-right", "tile-arrow")}<h3>${track.title}</h3><p>${track.subtitle}</p></a>`,
    ).join("");
    if (this.user) {
      $(".login-link").innerHTML = `My space ${icon("up-right")}`;
      $(".login-link").dataset.auth = "dashboard";
    } else {
      $(".login-link").innerHTML = `Log in ${icon("up-right")}`;
      $(".login-link").dataset.auth = "login";
    }
  }

  route() {
    const [requested, category] = (location.hash.slice(1) || "home").split("/");
    const section = ["why-koin", "how-it-works", "mission"].includes(requested);
    const page = ["dashboard", "learn", "challenges", "tools"].includes(
      requested,
    )
      ? requested
      : "home";
    const changed = this.page !== page;
    this.page = page;
    $("#home-view").hidden = page !== "home";
    $("#app-view").hidden = page === "home";
    $("#mobile-nav").hidden = true;
    $('[data-action="menu"]').setAttribute("aria-expanded", "false");
    $("#app-sidebar").classList.remove("open");
    $("#app-menu").setAttribute("aria-expanded", "false");
    if (this.modal.open) this.closeModal();
    if (page !== "home") {
      if (page === "learn" && category && TRACKS.some((t) => t.id === category))
        this.lessonFilter = category;
      this.renderPage();
    } else {
      document.title = "Koin — Your money. Your moves. Your future.";
      if (section)
        requestAnimationFrame(() =>
          document
            .getElementById(requested)
            ?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" }),
        );
    }
    if (!section && changed) window.scrollTo({ top: 0, behavior: "instant" });
  }

  renderPage() {
    const labels = {
      dashboard: "Overview",
      learn: "Learning lab",
      challenges: "Challenges",
      tools: "Money tools",
    };
    $("#breadcrumb").textContent = labels[this.page];
    document.title = `${labels[this.page]} — Koin`;
    $$(".sidebar nav a").forEach((link) => {
      const active = link.dataset.route === this.page;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    this.renderSidebar();
    const renderers = {
      dashboard: () => this.dashboardHTML(),
      learn: () => this.learnHTML(),
      challenges: () => this.challengesHTML(),
      tools: () => this.toolsHTML(),
    };
    $("#app-content").innerHTML = renderers[this.page]();
    if (this.page === "dashboard") this.renderTransactions();
    if (this.page === "tools") {
      this.updateBudget();
      this.updateCompound();
    }
  }

  get xp() {
    return (
      this.state.completedChallenges.reduce(
        (sum, id) => sum + (CHALLENGES.find((c) => c.id === id)?.xp || 0),
        0,
      ) +
      this.state.completedLessons.length * 20
    );
  }

  renderSidebar() {
    const xp = this.xp;
    const level = Math.floor(xp / 100) + 1;
    const titles = [
      "Money curious",
      "Habit builder",
      "Smart mover",
      "Future focused",
    ];
    $("#sidebar-level").innerHTML =
      `<div>${icon("spark")}<strong>Level ${level} · ${titles[Math.min(level - 1, 3)]}</strong></div><p>Small steps. Real progress.</p><div class="progress-track" role="progressbar" aria-label="Experience toward next level" aria-valuenow="${xp % 100}" aria-valuemin="0" aria-valuemax="100"><span style="width:${xp % 100}%"></span></div><small>${xp} XP earned · ${100 - (xp % 100)} to next level</small>`;
    const nickname = this.state.profile.nickname;
    $("#profile-name").textContent =
      this.user || this.state.profile.onboarded
        ? nickname
        : "Your next chapter";
    $("#profile-initial").textContent = nickname.charAt(0).toUpperCase();
    $("#profile-mode").textContent = this.user
      ? "Local demo account"
      : "Demo explorer";
    $("#session-action").textContent = this.user ? "Log out" : "Leave demo";
    $(".sidebar-new").textContent =
      CHALLENGES.length - this.state.completedChallenges.length;
  }

  dashboardHTML() {
    const totals = Finance.totals(this.state);
    const goal = Finance.goal(this.state.goal);
    const nickname = this.state.profile.onboarded
      ? escapeHTML(this.state.profile.nickname)
      : "future you";
    const nextChallenge = this.orderedChallenges().find(
      (c) => !this.state.completedChallenges.includes(c.id),
    );
    const cards = [
      [
        "Available balance",
        totals.balance,
        "wallet",
        `Starting balance: ${money(this.state.startingBalance, 2)}`,
      ],
      ["Total income", totals.income, "trend", "Base income + recorded income"],
      [
        "Total expenses",
        totals.expenses,
        "bag",
        `${this.state.transactions.filter((t) => t.type === "expense").length} recorded expenses`,
      ],
      [
        "Saved so far",
        this.state.goal.saved,
        "target",
        `${Math.round(goal.progress)}% of your ${money(this.state.goal.target)} goal`,
      ],
    ];
    return `<div class="page-intro"><div><span class="page-kicker">YOUR MONEY. YOUR POSSIBILITIES.</span><h1>Looking ahead, <span>${nickname}.</span></h1><p>${this.user ? "Your personal practice space. Make your next move." : "Meet your money playground. All amounts below are fictional demo data."}</p></div><button class="button" data-action="transaction">${icon("plus")} Add transaction</button></div>
      ${totals.balance < 0 ? '<div class="warning-note">Your recorded expenses are higher than your available money. Review your spending and adjust your plan before adding new commitments.</div>' : ""}
      <div class="summary-grid">${cards.map(([label, amount, symbol, caption]) => `<article class="summary-card" data-tilt><div class="summary-card-top"><span>${label}</span>${icon(symbol)}</div><strong class="${label === "Available balance" && amount < 0 ? "negative" : ""}">${money(amount, 2)}</strong><small>${caption}</small></article>`).join("")}</div>
      <div class="dashboard-grid"><section class="panel balance-panel"><div class="panel-title"><div><h2>Your money, in motion.</h2><p>Every little move makes a difference.</p></div><button class="text-button" data-action="balance">Edit amounts ${icon("edit")}</button></div><div class="balance-large ${totals.balance < 0 ? "negative" : ""}">${money(totals.balance, 2)}</div><p class="balance-caption">Available balance <span class="muted">· All recorded activity</span></p><p class="balance-formula">${money(this.state.startingBalance, 2)} starting + ${money(totals.income, 2)} income − ${money(totals.expenses, 2)} expenses</p>${this.balanceChart()}</section>
      <section class="panel goal-panel"><div class="panel-title"><h2>A little closer to your goal.</h2><button class="icon-button" data-action="goal" aria-label="Edit savings goal">${icon("edit")}</button></div><div class="goal-icon-row"><span class="square-icon">${icon("target")}</span><span class="xp-tag">${goal.progress >= 100 ? "GOAL REACHED" : "FUTURE YOU FUND"}</span></div><h3 class="goal-name">${escapeHTML(this.state.goal.name)}</h3><div class="goal-total"><strong>${money(this.state.goal.saved, 2)}</strong><span>/ ${money(this.state.goal.target, 2)}</span></div><div class="goal-progress-label"><span>${money(goal.remaining, 2)} to go</span><span>${Math.round(goal.progress)}%</span></div><div class="progress-track" role="progressbar" aria-label="Savings goal progress" aria-valuenow="${Math.round(goal.progress)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${goal.progress}%"></span></div><p class="goal-estimate">${icon(goal.progress >= 100 ? "check" : "clock")}<span>${this.goalEstimate()}</span></p><p class="goal-note">Savings are tracked separately; they are not automatically deducted from your available balance.</p><button class="button button-soft" data-action="goal">Update my goal ${icon("arrow")}</button></section></div>
      ${nextChallenge ? `<section class="next-move"><span class="square-icon">${icon("bolt")}</span><div><small>YOUR NEXT MOVE · +${nextChallenge.xp} XP</small><h3>${nextChallenge.title}</h3><p>${this.state.profile.onboarded ? "Chosen to help you build on your goals. One small step at a time." : "A small challenge today. A smarter habit tomorrow."}</p></div><button class="button button-outline" data-challenge-open="${nextChallenge.id}">Take the challenge ${icon("arrow")}</button></section>` : `<section class="next-move"><span class="square-icon">${icon("check")}</span><div><small>LOOK AT YOU GO</small><h3>Every challenge complete.</h3><p>Keep practising these habits in everyday life. Revisit any challenge whenever you like.</p></div><a class="button button-outline" href="#challenges">See your progress ${icon("arrow")}</a></section>`}
      <section class="panel activity-panel"><div class="panel-title"><div><h2>The little things add up.</h2><p>Your hypothetical income and expenses.</p></div><div class="activity-controls"><input id="activity-search" type="search" placeholder="Search activity…" aria-label="Search transactions" value="${escapeHTML(this.activitySearch)}"><select id="activity-filter" aria-label="Filter transaction type"><option value="all" ${this.activityFilter === "all" ? "selected" : ""}>All activity</option><option value="income" ${this.activityFilter === "income" ? "selected" : ""}>Income</option><option value="expense" ${this.activityFilter === "expense" ? "selected" : ""}>Expenses</option></select></div></div><div id="transaction-list"></div></section>`;
  }

  balanceChart() {
    const opening = this.state.startingBalance + this.state.baseIncome;
    const sorted = [...this.state.transactions].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const values = [opening];
    sorted.forEach((t) =>
      values.push(
        roundMoney(
          values.at(-1) + (t.type === "income" ? t.amount : -t.amount),
        ),
      ),
    );
    if (values.length === 1) values.push(opening);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const points = values.map((value, i) => [
      (i / (values.length - 1)) * 560,
      125 - ((value - min) / (max - min || 1)) * 105,
    ]);
    const path = points
      .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ");
    const [lastX, lastY] = points.at(-1);
    return `<div class="balance-graph"><svg viewBox="0 0 560 140" preserveAspectRatio="none" role="img" aria-label="Balance after each recorded transaction, ending at ${money(values.at(-1), 2)}"><defs><linearGradient id="balance-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#b7ff5a" stop-opacity=".13"/><stop offset="1" stop-color="#b7ff5a" stop-opacity="0"/></linearGradient></defs><path class="chart-guide" d="M0 20h560M0 55h560M0 90h560M0 125h560"/><path class="chart-area" d="${path} L560 140 L0 140Z"/><path class="chart-line" d="${path}"/><circle class="chart-point" cx="${lastX}" cy="${lastY}" r="4"/></svg></div><div class="graph-dates"><span>Opening balance + base income</span><span>${sorted.length ? shortDate(sorted.at(-1).date) : "No activity yet"}</span></div>`;
  }

  goalEstimate(goal = this.state.goal) {
    const result = Finance.goal(goal);
    if (result.remaining === 0)
      return "You made it. Take a moment to celebrate.";
    if (!goal.contribution)
      return "Add a planned contribution to see your estimate.";
    const unit = goal.frequency === "monthly" ? "month" : "week";
    return `About ${result.periods} ${unit}${result.periods === 1 ? "" : "s"} at ${money(goal.contribution, 2)} per ${unit}.`;
  }

  renderTransactions() {
    const list = $("#transaction-list");
    if (!list) return;
    const query = this.activitySearch.toLowerCase();
    const transactions = this.state.transactions
      .filter(
        (t) =>
          (this.activityFilter === "all" || t.type === this.activityFilter) &&
          `${t.description} ${t.category}`.toLowerCase().includes(query),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
    if (!transactions.length) {
      list.innerHTML = `<div class="empty-state">${icon("wallet")}<h3>${this.state.transactions.length ? "No matching moves." : "Your story starts with one move."}</h3><p>${this.state.transactions.length ? "Try a different search or activity filter." : "Record a fictional income or expense to see your balance change."}</p>${this.state.transactions.length ? '<button class="button button-soft" data-action="clear-filters">Clear filters</button>' : '<button class="button button-soft" data-action="transaction">Add your first transaction</button>'}</div>`;
      return;
    }
    list.innerHTML = `<div class="table-scroll"><table class="activity-table"><thead><tr><th scope="col">TRANSACTION</th><th scope="col">CATEGORY</th><th scope="col" class="date-heading">DATE</th><th scope="col">AMOUNT</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead><tbody>${transactions.map((t) => `<tr><td><div class="transaction-name"><span class="square-icon">${icon(CATEGORY_ICONS[t.category] || "wallet")}</span><span><strong>${escapeHTML(t.description)}</strong><small>${t.type === "income" ? "Money in" : "Money out"}</small></span></div></td><td><span class="category-badge">${escapeHTML(t.category)}</span></td><td class="transaction-date">${shortDate(t.date)}</td><td class="${t.type === "income" ? "transaction-income" : ""}">${t.type === "income" ? "+" : "−"}${money(t.amount, 2)}</td><td><button class="icon-button" data-edit-transaction="${escapeHTML(t.id)}" aria-label="Edit ${escapeHTML(t.description)}">${icon("edit")}</button><button class="icon-button" data-delete-transaction="${escapeHTML(t.id)}" aria-label="Remove ${escapeHTML(t.description)}">${icon("trash")}</button></td></tr>`).join("")}</tbody></table></div>`;
  }

  learnHTML() {
    const completed = this.state.completedLessons.length;
    const lessons =
      this.lessonFilter === "all"
        ? LESSONS
        : LESSONS.filter((l) => l.id === this.lessonFilter);
    return `<div class="page-intro"><div><span class="page-kicker">THE LEARNING LAB</span><h1>Know a little. <span>Do a lot.</span></h1><p>Short lessons. Real-life skills. A little more confidence with every chapter.</p></div><span class="period-tag">${completed} / ${LESSONS.length} completed</span></div><section class="learning-banner"><div><span class="page-kicker">FOR THE LIFE YOU WANT TO LIVE</span><h2>Your money manual starts here.</h2><p>Learn the idea. Try the quiz. Earn 20 XP with each lesson.</p><div class="progress-track" role="progressbar" aria-label="Lessons completed" aria-valuenow="${completed}" aria-valuemin="0" aria-valuemax="${LESSONS.length}"><span style="width:${(completed / LESSONS.length) * 100}%"></span></div></div><span class="banner-icon">${icon("book")}</span></section><div class="tabs" role="group" aria-label="Learning categories">${this.filterTabs("lesson", this.lessonFilter)}</div><div class="lessons-grid">${lessons
      .map((lesson) => {
        const track = TRACKS.find((t) => t.id === lesson.id);
        const done = this.state.completedLessons.includes(lesson.id);
        return `<article class="lesson-card ${done ? "lesson-complete" : ""}"><div class="lesson-card-top"><span class="square-icon">${icon(done ? "check" : track.icon)}</span><span class="lesson-duration">${icon("clock")}${lesson.minutes} MIN</span></div><span class="page-kicker">${track.title.toUpperCase()} · BEGINNER</span><h2>${lesson.title}</h2><p>${lesson.description}</p><button class="text-button inline-link" data-lesson="${lesson.id}">${done ? "Revisit lesson · Completed" : "Let’s learn something"} ${icon(done ? "check" : "arrow")}</button></article>`;
      })
      .join(
        "",
      )}</div><p class="challenge-help">${icon("info")}Learning should fit your life. There’s no timer and no pressure.</p>`;
  }

  filterTabs(type, selected) {
    return [{ id: "all", title: "All topics" }, ...TRACKS]
      .map(
        (t) =>
          `<button class="tab ${selected === t.id ? "active" : ""}" data-${type}-filter="${t.id}" aria-pressed="${selected === t.id}">${t.title}</button>`,
      )
      .join("");
  }

  orderedChallenges() {
    return this.state.challengeOrder
      .map((id) => CHALLENGES.find((c) => c.id === id))
      .filter(Boolean);
  }

  challengesHTML() {
    const completed = this.state.completedChallenges.length;
    const challenges = this.orderedChallenges().filter(
      (c) =>
        this.challengeFilter === "all" || c.category === this.challengeFilter,
    );
    return `<div class="page-intro"><div><span class="page-kicker">SMALL MOVES. REAL MOMENTUM.</span><h1>Good habits. <span>In the cards.</span></h1><p>Flip a card, try something new, and give future you a little head start.</p></div><span class="period-tag">${completed} / ${CHALLENGES.length} complete</span></div><section class="learning-banner"><div><span class="page-kicker">YOUR PROGRESS, ONE MOVE AT A TIME</span><h2>${completed === CHALLENGES.length ? "Look at all that momentum." : completed ? "You’re building something good." : "Your first small win is waiting."}</h2><p>${completed} challenges complete · ${this.state.completedChallenges.reduce((sum, id) => sum + CHALLENGES.find((c) => c.id === id).xp, 0)} challenge XP earned</p><div class="progress-track" role="progressbar" aria-label="Challenges completed" aria-valuenow="${completed}" aria-valuemin="0" aria-valuemax="${CHALLENGES.length}"><span style="width:${(completed / CHALLENGES.length) * 100}%"></span></div></div><span class="banner-icon">${icon("bolt")}</span></section><div class="challenge-toolbar"><div class="tabs" role="group" aria-label="Challenge categories">${this.filterTabs("challenge", this.challengeFilter)}</div><button class="button button-outline" data-action="shuffle">${icon("shuffle")} Shuffle the deck</button></div><div class="challenges-grid">${challenges.map((c) => this.challengeCardHTML(c)).join("")}</div><p class="challenge-help">${icon("info")}Tap or press Enter to flip. Completion is self-reported. XP measures practice, not financial success.</p>`;
  }

  challengeCardHTML(challenge) {
    const track = TRACKS.find((t) => t.id === challenge.category);
    const done = this.state.completedChallenges.includes(challenge.id);
    return `<article class="challenge-card ${done ? "complete" : ""}" data-card="${challenge.id}" data-tilt><div class="challenge-card-inner"><button class="challenge-face challenge-front" data-flip="${challenge.id}" aria-label="${done ? "Completed: " : ""}${challenge.title} Flip for instructions" aria-expanded="false"><span class="challenge-category">${track.title.toUpperCase()} ${icon("up-right")}</span><span class="challenge-symbol">${icon(done ? "check" : track.icon)}</span><span class="challenge-card-title">${challenge.title}</span><span class="difficulty"><i></i>${challenge.difficulty} · Real-life challenge</span><span class="challenge-card-footer"><span>${done ? "COMPLETED ✓" : "YOUR NEXT MOVE · TAP TO FLIP"}</span><span class="xp-tag">${done ? "✓ " : "+"}${challenge.xp} XP</span></span></button><div class="challenge-face challenge-back" aria-hidden="true" inert><div class="challenge-back-top"><span class="page-kicker">MAKE YOUR MOVE</span><button class="icon-button" data-flip="${challenge.id}" aria-label="Flip ${challenge.title} back">${icon("refresh")}</button></div><h2>${challenge.title}</h2><p>${challenge.instruction}</p><p class="challenge-tip">${challenge.tip}</p><button class="button ${done ? "button-outline" : ""}" data-complete="${challenge.id}">${icon(done ? "refresh" : "check")}${done ? "Mark as not completed" : "I did it · +" + challenge.xp + " XP"}</button></div></div></article>`;
  }

  toolsHTML() {
    const settings = this.state.tools;
    const categories = Finance.spending(this.state.transactions);
    const expenses = Finance.totals(this.state).expenses;
    return `<div class="page-intro"><div><span class="page-kicker">A LITTLE CLARITY GOES A LONG WAY</span><h1>Less guesswork. <span>More game plan.</span></h1><p>Try the numbers. Explore a possibility. Find what works for you.</p></div></div><div class="tools-grid"><section class="panel tool-panel"><div class="panel-title"><div><span class="page-kicker">01 / GIVE YOUR MONEY A JOB</span><h2>Your budget, a first draft.</h2></div><span class="square-icon">${icon("wallet")}</span></div><p class="tool-description">Try the 50/30/20 framework. These are flexible starting points, so adjust your real budget around your actual essential costs.</p><div class="form-field"><label for="budget-income">Monthly income ($)</label><input id="budget-income" type="number" min="0" max="1000000000" step="0.01" value="${settings.budgetIncome}" inputmode="decimal"></div><div class="budget-split" id="budget-result" aria-live="polite"></div><p class="tool-note">Needs: essential costs. Wants: things you enjoy. Savings: future goals or debt repayment. A small or irregular income may need a different split.</p><button class="text-button inline-link lime" data-action="use-income" style="margin-top:20px">Use my recorded income ${icon("arrow")}</button></section>
      <section class="panel tool-panel"><div class="panel-title"><div><span class="page-kicker">02 / EXPLORE THE LONG GAME</span><h2>Small amounts. Over time.</h2></div><span class="square-icon">${icon("trend")}</span></div><p class="tool-description">See how regular contributions and a hypothetical return could compound. Try a negative return to explore losses, too.</p><div class="form-row"><div class="form-field"><label for="invest-initial">Starting amount ($)</label><input id="invest-initial" type="number" min="0" max="1000000000" step="0.01" value="${settings.investmentInitial}" inputmode="decimal"></div><div class="form-field"><label for="invest-monthly">Monthly addition ($)</label><input id="invest-monthly" type="number" min="0" max="1000000" step="0.01" value="${settings.investmentMonthly}" inputmode="decimal"></div></div><div class="form-row"><div class="form-field"><label for="invest-years">Years (1–50)</label><input id="invest-years" type="number" min="1" max="50" step="1" value="${settings.investmentYears}" inputmode="numeric"></div><div class="form-field"><label for="invest-rate">Assumed annual return (%)</label><input id="invest-rate" type="number" min="-20" max="20" step="0.1" value="${settings.investmentRate}" inputmode="decimal"></div></div><div id="compound-result" aria-live="polite"></div><p class="tool-note">Illustration only, not a forecast. Assumes a constant annual rate divided monthly and contributions at month-end. Excludes fees, inflation, and taxes. Real returns vary and investments can lose value.</p></section>
      <section class="panel tool-panel"><div class="panel-title"><div><span class="page-kicker">03 / NOTICE THE PATTERNS</span><h2>Where your money goes.</h2></div><span class="square-icon">${icon("bag")}</span></div><p class="tool-description">A breakdown of all recorded expenses. Notice which categories match your priorities and where you might want to make a change.</p>${categories.length ? `<div class="spending-grid">${categories.map(([category, total]) => `<div class="spending-row"><div><span>${escapeHTML(category)}</span><span>${money(total, 2)} · ${Math.round((total / expenses) * 100)}%</span></div><div class="progress-track"><span style="width:${(total / expenses) * 100}%"></span></div></div>`).join("")}</div><p class="tool-note" style="margin-top:18px">Total recorded expenses: ${money(expenses, 2)}</p>` : `<div class="empty-state">${icon("bag")}<p>Record a fictional expense to see your spending patterns.</p><button class="button button-soft" data-action="transaction">Add an expense</button></div>`}</section>
      <section class="panel tool-panel"><div class="panel-title"><div><span class="page-kicker">04 / TURN A GOAL INTO A PLAN</span><h2>Make your “one day” a little closer.</h2></div><span class="square-icon">${icon("target")}</span></div><p class="tool-description">${escapeHTML(this.state.goal.name)} · Your current savings plan.</p><div class="goal-total"><strong>${money(Finance.goal(this.state.goal).remaining, 2)}</strong><span>left to save</span></div><p class="goal-estimate">${icon("clock")}<span>${this.goalEstimate()}</span></p><p class="tool-note" style="margin-top:18px">This estimate assumes consistent contributions, with no interest or withdrawals. Adjust your goal as your circumstances change.</p><button class="button button-soft" data-action="goal" style="margin-top:25px">Explore my savings plan ${icon("arrow")}</button></section>
      <aside class="tools-banner">${icon("shield")}<div><h3>A space to learn, safely.</h3><p>Koin uses hypothetical money and browser-only storage. These tools explain concepts and help you practise. They do not offer personalised financial advice, connect to bank accounts, or recommend investments. If you are unsure about a real decision, talk with a trusted adult or qualified professional.</p></div></aside></div>`;
  }

  updateBudget() {
    const input = $("#budget-income");
    if (!input || !input.validity.valid || input.value === "") {
      if ($("#budget-result"))
        $("#budget-result").innerHTML =
          '<p class="form-error">Enter an income between $0 and $1 billion.</p>';
      return;
    }
    const value = Number(input.value);
    const split = Finance.budget(value);
    $("#budget-result").innerHTML = [
      ["Needs", split.needs, "50% · THE ESSENTIALS"],
      ["Wants", split.wants, "30% · THE GOOD STUFF"],
      ["Savings", split.savings, "20% · FUTURE YOU"],
    ]
      .map(
        ([label, amount, caption]) =>
          `<div class="split-card"><span>${label}</span><strong>${money(amount, 2)}</strong><small>${caption}</small></div>`,
      )
      .join("");
    this.state.tools.budgetIncome = value;
    this.save();
  }

  updateCompound() {
    const fields = [
      "invest-initial",
      "invest-monthly",
      "invest-years",
      "invest-rate",
    ].map((id) => document.getElementById(id));
    if (!fields[0]) return;
    if (fields.some((field) => field.value === "" || !field.validity.valid)) {
      $("#compound-result").innerHTML =
        '<p class="form-error">Use non-negative amounts, 1–50 whole years, and a return from −20% to 20%.</p>';
      return;
    }
    const [initial, monthly, years, rate] = fields.map((f) => Number(f.value));
    const result = Finance.compound(initial, monthly, years, rate);
    $("#compound-result").innerHTML =
      `<div class="compound-result"><span>Hypothetical value after ${years} ${years === 1 ? "year" : "years"}</span><strong>${money(result.total, 2)}</strong><div><span>You contribute ${money(result.contributed, 2)}</span><span class="${result.growth < 0 ? "negative" : "mint"}">${result.growth < 0 ? "Loss" : "Growth"} ${money(Math.abs(result.growth), 2)}</span></div></div>`;
    Object.assign(this.state.tools, {
      investmentInitial: initial,
      investmentMonthly: monthly,
      investmentYears: years,
      investmentRate: rate,
    });
    this.save();
  }

  // Dialog controller uses the browser's native focus trap and Escape handling.
  openModal(content, wide = false) {
    if (!this.modal.open) this.lastFocus = document.activeElement;
    $("#modal-content").innerHTML =
      `<button class="icon-button modal-close" data-action="close" aria-label="Close dialog">${icon("close")}</button>${content}`;
    this.modal.classList.toggle("wide", wide);
    if (!this.modal.open) this.modal.showModal();
    document.body.classList.add("modal-open");
    this.modal.scrollTop = 0;
    requestAnimationFrame(() => {
      const focusTarget =
        $("[autofocus]", this.modal) ||
        $("input, select, .quiz-option", this.modal) ||
        $(".modal-close", this.modal);
      focusTarget?.focus({ preventScroll: true });
    });
  }

  closeModal() {
    this.modal.close();
  }

  modalHeading(kicker, title, subtitle = "") {
    return `<div class="modal-heading"><span class="page-kicker">${kicker}</span><h2 id="modal-title">${title}</h2>${subtitle ? `<p>${subtitle}</p>` : ""}</div>`;
  }

  openAuth(mode = "register") {
    if (this.user || mode === "dashboard") {
      location.hash = "dashboard";
      return;
    }
    this.authMode = mode;
    const register = mode === "register";
    this.openModal(
      `<a class="brand modal-brand" href="#home"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>koin<span class="brand-period">.</span></a>${this.modalHeading("YOUR NEXT CHAPTER", register ? "Your first smart move." : "Good to have you back.", register ? "Create a local demo account and make this space yours." : "Pick up where you left off on this browser.")}<form id="auth-form">${register ? '<div class="form-field"><label for="auth-name">What should we call you? <span class="muted">(nickname, optional)</span></label><input id="auth-name" name="nickname" autocomplete="nickname" placeholder="Future money pro" maxlength="24"></div>' : ""}<div class="form-field"><label for="auth-email">Demo email</label><input id="auth-email" name="email" type="email" autocomplete="off" placeholder="you@example.com" maxlength="120" required ${!register ? "autofocus" : ""}></div><div class="form-field"><label for="auth-password">Demo-only password</label><div class="password-wrap"><input id="auth-password" name="password" type="password" autocomplete="off" placeholder="Make one up · 6+ characters" minlength="6" maxlength="128" required><button type="button" class="icon-button" data-action="password" aria-label="Show password" aria-pressed="false">${icon("eye")}</button></div><small>Never use a real or reused password here.</small></div><label class="checkbox-line"><input type="checkbox" name="remember">Remember this demo session on this browser</label><p class="form-error" id="auth-error" role="alert"></p><button class="button full-width auth-submit" type="submit">${register ? "Create my demo account" : "Log in to my space"} ${icon("arrow")}</button></form><p class="auth-switch">${register ? "Already made your first move?" : "New to Koin?"} <button data-auth="${register ? "login" : "register"}">${register ? "Log in" : "Create an account"}</button></p><div class="auth-demo"><a href="#dashboard">Just exploring? Try the demo →</a></div><p class="prototype-note">${icon("shield")}<span>Educational prototype only. Use made-up details. Account records stay in this browser and are not secure financial accounts. Nothing is sent to a server.</span></p>`,
    );
  }

  async submitAuth(form) {
    const data = new FormData(form);
    const email = data.get("email").trim().toLowerCase();
    const password = data.get("password");
    const submit = $('button[type="submit"]', form);
    submit.disabled = true;
    $("#auth-error").textContent = "";
    try {
      let account = this.accounts.find((a) => a.email === email);
      if (this.authMode === "register") {
        if (account)
          throw new Error(
            "A demo account with that email already exists on this browser. Try logging in.",
          );
        const credentials = await passwordVerifier(password);
        if (!form.isConnected || !this.modal.open) return;
        account = {
          email,
          nickname: String(data.get("nickname") || "Friend").trim() || "Friend",
          ...credentials,
        };
        this.accounts.push(account);
        this.store.write("accounts", this.accounts);
      } else {
        if (!account)
          throw new Error(
            "No demo account matches those details on this browser. Create one to get started.",
          );
        const check = await passwordVerifier(password, account.salt);
        if (!form.isConnected || !this.modal.open) return;
        if (check.verifier !== account.verifier)
          throw new Error(
            "Those details do not match. Check your demo email and password.",
          );
      }
      // The only session data is the fictional account identifier, never the password.
      this.user = { email };
      this.store.remove("session");
      this.store.remove("session", true);
      this.store.write("session", this.user, !data.get("remember"));
      this.dataKey = email;
      this.state = this.store.loadState(email);
      this.state.profile.nickname = account.nickname;
      this.save();
      this.renderHome();
      form.reset();
      if (!this.state.profile.onboarded) this.openOnboarding();
      else {
        this.closeModal();
        location.hash = "dashboard";
        this.toast("Welcome back. Your next chapter is waiting.");
      }
    } catch (error) {
      if ($("#auth-error")) $("#auth-error").textContent = error.message;
      submit.disabled = false;
    }
  }

  openOnboarding() {
    this.onboardingStep = 0;
    this.onboardingDraft = JSON.parse(JSON.stringify(this.state.profile));
    this.renderOnboarding();
  }

  renderOnboarding() {
    const draft = this.onboardingDraft;
    const step = this.onboardingStep;
    const headings = [
      [
        "Let’s start with your world.",
        "Choose the situation that feels closest to you.",
      ],
      [
        "Find your starting point.",
        "Use a fictional amount. You can change it any time.",
      ],
      [
        "What does future you want?",
        "Pick one or more goals, then the topics you’re curious about.",
      ],
    ];
    let fields;
    if (step === 0)
      fields = `<div class="form-field"><label for="onboard-nickname">Your nickname</label><input id="onboard-nickname" name="nickname" value="${escapeHTML(draft.nickname)}" maxlength="24" required></div><fieldset class="plain-fieldset"><legend class="field-label">What is your financial situation?</legend><div class="choice-grid">${SITUATIONS.map((s, i) => `<label class="choice"><input type="radio" name="situation" value="${escapeHTML(s)}" ${s === draft.situation ? "checked" : ""} required>${icon(["book", "briefcase", "wallet", "spark"][i])}<span>${s}</span></label>`).join("")}</div></fieldset>`;
    if (step === 1)
      fields = `<div class="form-field"><label for="onboard-amount">How much money do you receive? ($)</label><input id="onboard-amount" name="amount" type="number" min="0" max="10000000" step="0.01" value="${draft.amount}" inputmode="decimal" required><small>An estimate is fine. Enter 0 if you don’t currently receive income.</small></div><div class="form-field"><label for="onboard-frequency">How frequently do you receive it?</label><select id="onboard-frequency" name="frequency">${[
        ["daily", "Daily"],
        ["weekly", "Weekly"],
        ["monthly", "Monthly"],
        ["irregular", "Irregularly"],
      ]
        .map(
          ([value, label]) =>
            `<option value="${value}" ${draft.frequency === value ? "selected" : ""}>${label}</option>`,
        )
        .join(
          "",
        )}</select></div><p class="prototype-note">${icon("info")}<span>Daily and weekly amounts are converted to a monthly estimate. For irregular income, enter a cautious typical monthly amount. This is a practice snapshot, not a recurring deposit.</span></p>`;
    if (step === 2)
      fields = `<fieldset class="plain-fieldset"><legend class="field-label">Your financial goals <span class="muted">(choose at least one)</span></legend><div class="choice-grid onboard-goals">${GOALS.map((goal) => `<label class="choice"><input type="checkbox" name="goals" value="${escapeHTML(goal)}" ${draft.goals.includes(goal) ? "checked" : ""}><span>${goal}</span></label>`).join("")}</div></fieldset><fieldset class="plain-fieldset"><legend class="field-label">What are you curious about? <span class="muted">(optional)</span></legend><div class="onboarding-topics">${TRACKS.map((track) => `<label class="topic-choice"><input type="checkbox" name="interests" value="${track.id}" ${draft.interests.includes(track.id) ? "checked" : ""}>${track.title}</label>`).join("")}</div></fieldset>`;
    this.openModal(
      `<div class="onboarding-dots" aria-label="Step ${step + 1} of 3">${[0, 1, 2].map((i) => `<span class="${i <= step ? "active" : ""}"></span>`).join("")}</div><div class="onboarding-step">${this.modalHeading(`A SPACE THAT FEELS LIKE YOU · ${step + 1} / 3`, ...headings[step])}<form id="onboarding-form">${fields}<p class="form-error" id="onboard-error" role="alert"></p><div class="onboard-actions">${step > 0 ? '<button type="button" class="button button-outline" data-action="onboard-back">Back</button>' : ""}<button class="button" type="submit">${step === 2 ? "Make my first move" : "Keep going"} ${icon("arrow")}</button></div></form></div>`,
    );
  }

  captureOnboarding(form) {
    const data = new FormData(form);
    if (this.onboardingStep === 0)
      Object.assign(this.onboardingDraft, {
        nickname: String(data.get("nickname")).trim() || "Friend",
        situation: data.get("situation"),
      });
    if (this.onboardingStep === 1)
      Object.assign(this.onboardingDraft, {
        amount: Number(data.get("amount")),
        frequency: data.get("frequency"),
      });
    if (this.onboardingStep === 2)
      Object.assign(this.onboardingDraft, {
        goals: data.getAll("goals"),
        interests: data.getAll("interests"),
      });
  }

  submitOnboarding(form) {
    this.captureOnboarding(form);
    if (this.onboardingStep < 2) {
      this.onboardingStep++;
      this.renderOnboarding();
      return;
    }
    const draft = this.onboardingDraft;
    if (!draft.goals.length) {
      $("#onboard-error").textContent =
        "Pick at least one goal. You can always change it later.";
      return;
    }
    const firstTime = !this.state.profile.onboarded;
    if (
      firstTime ||
      draft.amount !== this.state.profile.amount ||
      draft.frequency !== this.state.profile.frequency
    )
      this.state.baseIncome = Finance.monthlyIncome(
        draft.amount,
        draft.frequency,
      );
    this.state.profile = { ...draft, onboarded: true };
    const goalTracks = draft.goals.map(
      (g) =>
        ({
          [GOALS[0]]: "saving",
          [GOALS[1]]: "saving",
          [GOALS[2]]: "budgeting",
          [GOALS[3]]: "investing",
          [GOALS[4]]: "saving",
          [GOALS[5]]: "knowledge",
        })[g],
    );
    const preferred = [...draft.interests, ...goalTracks];
    this.state.challengeOrder = [...CHALLENGES]
      .sort(
        (a, b) =>
          Number(preferred.includes(b.category)) -
          Number(preferred.includes(a.category)),
      )
      .map((c) => c.id);
    if (firstTime && this.user) {
      this.state.goal.name = draft.goals.includes(GOALS[1])
        ? "My first safety net"
        : draft.goals.includes(GOALS[4])
          ? "My education fund"
          : "My next big thing";
      this.state.goal.target = draft.goals.includes(GOALS[1]) ? 100 : 500;
      this.state.goal.contribution = roundMoney(
        Finance.monthlyIncome(draft.amount, draft.frequency) * 0.1,
      );
      this.state.goal.frequency = "monthly";
    }
    if (this.user) {
      const account = this.accounts.find((a) => a.email === this.user.email);
      account.nickname = draft.nickname;
      this.store.write("accounts", this.accounts);
    }
    this.save();
    this.closeModal();
    if (location.hash === "#dashboard") this.renderPage();
    else location.hash = "dashboard";
    this.toast(`All yours, ${draft.nickname}. Let’s build something good.`);
  }

  openBalance() {
    this.openModal(
      `${this.modalHeading("FIND YOUR STARTING POINT", "Make the numbers yours.", "These are one-time amounts for your practice snapshot.")}<form id="balance-form"><div class="form-field"><label for="starting-balance">Starting balance ($)</label><input id="starting-balance" name="starting" type="number" min="0" max="1000000000" step="0.01" value="${this.state.startingBalance}" required autofocus inputmode="decimal"></div><div class="form-field"><label for="base-income">Base income for this snapshot ($)</label><input id="base-income" name="income" type="number" min="0" max="1000000000" step="0.01" value="${this.state.baseIncome}" required inputmode="decimal"><small>Income transactions are added to this amount. Don’t count the same payment twice.</small></div><p class="form-error" id="balance-error" role="alert"></p><button class="button full-width" type="submit">Update my overview ${icon("check")}</button></form><p class="prototype-note">${icon("info")}<span>Available balance = starting balance + base income + recorded income − recorded expenses. Updating amounts does not create a transaction.</span></p>`,
    );
  }

  openTransaction(id = null) {
    const transaction = this.state.transactions.find((t) => t.id === id);
    const current = transaction || {
      description: "",
      amount: "",
      category: "Food",
      date: localDate(),
      type: "expense",
    };
    this.editingTransaction = transaction?.id || null;
    this.openModal(
      `${this.modalHeading("EVERY MOVE TELLS A STORY", transaction ? "Fine-tune this move." : "Make a little money move.", "Record a hypothetical transaction. Your overview updates automatically.")}<form id="transaction-form"><div class="segment-control" role="group" aria-label="Transaction type"><label><input type="radio" name="type" value="expense" ${current.type === "expense" ? "checked" : ""}>Money out</label><label><input type="radio" name="type" value="income" ${current.type === "income" ? "checked" : ""}>Money in</label></div><div class="form-field"><label for="transaction-description">What was it for?</label><input id="transaction-description" name="description" maxlength="70" placeholder="Lunch, tutoring, a little treat…" value="${escapeHTML(current.description)}" required autofocus></div><div class="form-row"><div class="form-field"><label for="transaction-amount">Amount ($)</label><input id="transaction-amount" name="amount" type="number" min="0.01" max="1000000000" step="0.01" placeholder="0.00" value="${current.amount}" required inputmode="decimal"></div><div class="form-field"><label for="transaction-date">Date</label><input id="transaction-date" name="date" type="date" value="${current.date}" max="${localDate()}" min="1900-01-01" required></div></div><div class="form-field"><label for="transaction-category">Category</label><select id="transaction-category" name="category">${this.categoryOptions(current.type, current.category)}</select></div><p class="form-error" id="transaction-error" role="alert"></p><button class="button full-width" type="submit">${transaction ? "Save this move" : "Add to my story"} ${icon("check")}</button></form>`,
    );
  }

  categoryOptions(type, selected = "") {
    return (type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)
      .map(
        (category) =>
          `<option value="${category}" ${category === selected ? "selected" : ""}>${category}</option>`,
      )
      .join("");
  }

  openGoal() {
    const goal = this.state.goal;
    this.openModal(
      `${this.modalHeading("MAKE ROOM FOR WHAT’S NEXT", "A goal with a game plan.", "Choose a target and a contribution that feels realistic.")}<form id="goal-form"><div class="form-field"><label for="goal-name">What are you saving for?</label><input id="goal-name" name="name" value="${escapeHTML(goal.name)}" maxlength="50" required autofocus></div><div class="form-row"><div class="form-field"><label for="goal-target">Savings target ($)</label><input id="goal-target" name="target" type="number" min="0.01" max="1000000000" step="0.01" value="${goal.target}" required inputmode="decimal"></div><div class="form-field"><label for="goal-saved">Already saved ($)</label><input id="goal-saved" name="saved" type="number" min="0" max="1000000000" step="0.01" value="${goal.saved}" required inputmode="decimal"></div></div><div class="form-row"><div class="form-field"><label for="goal-contribution">Planned contribution ($)</label><input id="goal-contribution" name="contribution" type="number" min="0" max="1000000000" step="0.01" value="${goal.contribution}" required inputmode="decimal"></div><div class="form-field"><label for="goal-frequency">How often?</label><select id="goal-frequency" name="frequency"><option value="weekly" ${goal.frequency === "weekly" ? "selected" : ""}>Every week</option><option value="monthly" ${goal.frequency === "monthly" ? "selected" : ""}>Every month</option></select></div></div><div class="goal-preview" id="goal-preview" aria-live="polite"></div><p class="form-error" id="goal-error" role="alert"></p><button class="button full-width" type="submit">Save my game plan ${icon("check")}</button></form><p class="prototype-note">${icon("info")}<span>Your saved amount is a separate tracker. Updating it does not create an expense or change your available balance. No interest or withdrawals are assumed.</span></p>`,
    );
    this.updateGoalPreview();
  }

  readGoalForm() {
    const form = $("#goal-form");
    const data = new FormData(form);
    return {
      name: String(data.get("name")).trim(),
      target: Number(data.get("target")),
      saved: Number(data.get("saved")),
      contribution: Number(data.get("contribution")),
      frequency: data.get("frequency"),
    };
  }

  updateGoalPreview() {
    const form = $("#goal-form");
    if (!form) return;
    const goal = this.readGoalForm();
    const fields = $$('input[type="number"]', form);
    if (fields.some((field) => field.value === "" || !field.validity.valid)) {
      $("#goal-preview").innerHTML =
        "<p>Enter a positive target and non-negative saved and contribution amounts.</p>";
      return;
    }
    const result = Finance.goal(goal);
    $("#goal-preview").innerHTML =
      `<div><span>${money(result.remaining, 2)} still to save</span><strong>${Math.round(result.progress)}%</strong></div><div class="progress-track"><span style="width:${result.progress}%"></span></div><p>${this.goalEstimate(goal)}</p>`;
  }

  openLesson(id) {
    const lesson = LESSONS.find((l) => l.id === id);
    if (!lesson) return;
    const track = TRACKS.find((t) => t.id === id);
    this.activeLesson = id;
    const done = this.state.completedLessons.includes(id);
    this.openModal(
      `${this.modalHeading(`${track.title.toUpperCase()} · ${lesson.minutes} MIN READ`, lesson.title, lesson.description)}<article class="lesson-body">${lesson.body}<div class="lesson-takeaway">${icon("spark")}<span>${lesson.takeaway}</span></div></article><section class="quiz" aria-labelledby="quiz-question"><span class="page-kicker">A QUICK CONFIDENCE CHECK · +20 XP</span><h3 id="quiz-question">${lesson.question}</h3><div class="quiz-options">${lesson.options.map((option, i) => `<button class="quiz-option" data-quiz="${i}" data-lesson-id="${id}"><span>${String.fromCharCode(65 + i)}</span>${option}</button>`).join("")}</div><div class="quiz-feedback" id="quiz-feedback" role="status">${done ? "You’ve completed this lesson. Try it again whenever you like." : ""}</div></section><p class="prototype-note">${icon("book")}<span>Want to go further? Explore <a href="https://www.consumerfinance.gov/consumer-tools/educator-tools/youth-financial-education/" target="_blank" rel="noopener noreferrer" class="lime">CFPB youth financial education ↗</a>. Examples use USD for consistency; local products and rules differ.</span></p>`,
      true,
    );
  }

  answerQuiz(id, answer, button) {
    const lesson = LESSONS.find((l) => l.id === id);
    if (!lesson) return;
    $$(".quiz-option", this.modal).forEach((option) =>
      option.classList.remove("correct", "incorrect"),
    );
    const correct = answer === lesson.answer;
    button.classList.add(correct ? "correct" : "incorrect");
    $("#quiz-feedback").classList.toggle("incorrect", !correct);
    $("#quiz-feedback").textContent = correct
      ? `You’ve got it. ${lesson.explanation}`
      : "Not quite. Take another look at the lesson and try again.";
    if (correct && !this.state.completedLessons.includes(id)) {
      this.state.completedLessons.push(id);
      this.save();
      if (this.page !== "home") this.renderPage();
      this.toast("A little wiser. Lesson complete · +20 XP");
      this.celebrate();
    }
  }

  flipChallenge(id, forceOpen = false) {
    const card = $(`[data-card="${id}"]`);
    if (!card) return;
    const flipped = forceOpen || !card.classList.contains("flipped");
    card.classList.toggle("flipped", flipped);
    const front = $(".challenge-front", card);
    const back = $(".challenge-back", card);
    front.setAttribute("aria-expanded", String(flipped));
    front.setAttribute("aria-hidden", String(flipped));
    back.setAttribute("aria-hidden", String(!flipped));
    front.inert = flipped;
    back.inert = !flipped;
    (flipped ? $(".icon-button", back) : front).focus({ preventScroll: true });
  }

  completeChallenge(id) {
    const challenge = CHALLENGES.find((c) => c.id === id);
    if (!challenge) return;
    const done = this.state.completedChallenges.includes(id);
    if (done)
      this.state.completedChallenges = this.state.completedChallenges.filter(
        (value) => value !== id,
      );
    else this.state.completedChallenges.push(id);
    this.save();
    this.renderPage();
    $(`[data-flip="${id}"]`)?.focus({ preventScroll: true });
    this.toast(
      done
        ? "Completion undone. Ready whenever you are."
        : `A small move. A real win. +${challenge.xp} XP`,
    );
    if (!done) this.celebrate();
  }

  shuffleChallenges() {
    if (this.isShuffling) return;
    this.isShuffling = true;
    const owner = this.dataKey;
    const cards = $$(".challenge-card");
    cards.forEach((card, i) => {
      card.style.setProperty("--shuffle-delay", `${i * 30}ms`);
      card.classList.add("shuffling");
    });
    const order = [...this.state.challengeOrder];
    // Fisher–Yates: every item can land at every position with equal probability.
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    if (order.join() === this.state.challengeOrder.join())
      order.push(order.shift());
    setTimeout(
      () => {
        if (this.dataKey !== owner) {
          this.isShuffling = false;
          return;
        }
        this.state.challengeOrder = order;
        this.save();
        if (this.page === "challenges") {
          this.renderPage();
          $$(".challenge-card").forEach((card, i) => {
            card.style.setProperty("--shuffle-delay", `${i * 30}ms`);
            card.classList.add("dealing");
          });
          $('[data-action="shuffle"]')?.focus({ preventScroll: true });
        }
        this.isShuffling = false;
        this.toast("Fresh deck. Same possibilities.");
      },
      reducedMotion() ? 10 : 390,
    );
  }

  openAbout() {
    this.openModal(
      `${this.modalHeading("DESIGNED TO MAKE MONEY MAKE SENSE", "A little about Koin.", "Your money. Your moves. Your future.")}<div class="modal-body-copy"><p>Koin is an interactive financial education prototype for teenagers and young adults, created as an IB MYP Personal Project. Its aim is to turn unfamiliar money concepts into practical, approachable skills.</p><h3>Learn by doing.</h3><p>Explore six learning tracks, test your understanding, try real-life challenges, and experiment with a fictional budget. Your XP reflects participation, not wealth or investment performance.</p><h3>Your data, on this browser.</h3><p>Fictional account profiles, transaction examples, goals, and progress are saved locally. Raw passwords are never stored. This demo authentication is not secure enough for real accounts. Clearing browser storage removes your local data; it does not sync between devices.</p><h3>No real money required.</h3><p>Koin is educational. It does not connect to banks, handle payments, offer personalised financial advice, or promise returns. Do not enter sensitive financial information or real passwords.</p><p>Currency examples use USD. Financial products, taxes, account access, and rules for minors vary by location.</p><span class="about-badge">${icon("spark")}Built with HTML, CSS, and vanilla JavaScript.</span></div>`,
      true,
    );
  }

  toast(message, action = null) {
    clearTimeout(this.toastTimer);
    const toast = $("#toast");
    toast.innerHTML = `${icon("check")}<span>${escapeHTML(message)}</span>${action ? `<button class="text-button" data-action="${action.action}">${action.label}</button>` : ""}`;
    toast.classList.add("visible");
    this.toastTimer = setTimeout(() => toast.classList.remove("visible"), 4200);
  }

  celebrate() {
    if (reducedMotion()) return;
    const confetti = $("#confetti");
    confetti.innerHTML = Array.from(
      { length: 27 },
      () =>
        `<i class="confetti-piece" style="left:${Math.random() * 100}%;--delay:${Math.random() * 0.3}s;--rotation:${Math.random() * 620 - 310}deg"></i>`,
    ).join("");
    clearTimeout(this.confettiTimer);
    this.confettiTimer = setTimeout(() => {
      confetti.innerHTML = "";
    }, 2500);
  }

  handleClick(event) {
    const target = event.target.closest("button, a");
    if (!target) {
      if (
        $("#app-sidebar").classList.contains("open") &&
        !event.target.closest("#app-sidebar")
      ) {
        $("#app-sidebar").classList.remove("open");
        $("#app-menu").setAttribute("aria-expanded", "false");
      }
      return;
    }
    if (target.classList.contains("skip-link")) {
      event.preventDefault();
      const content = this.page === "home" ? $("#main") : $("#app-content");
      content.setAttribute("tabindex", "-1");
      content.focus({ preventScroll: true });
      content.scrollIntoView({ block: "start" });
      return;
    }
    if (
      target.tagName === "A" &&
      target.getAttribute("href")?.startsWith("#") &&
      this.modal.open
    )
      this.closeModal();
    if (target.dataset.auth) {
      this.openAuth(target.dataset.auth);
      return;
    }
    if (target.id === "home-challenge") {
      const flipped = target.classList.toggle("flipped");
      target.setAttribute("aria-pressed", String(flipped));
      $(".mini-challenge-front", target).setAttribute(
        "aria-hidden",
        String(flipped),
      );
      $(".mini-challenge-back", target).setAttribute(
        "aria-hidden",
        String(!flipped),
      );
      return;
    }
    if (target.dataset.lesson) {
      this.openLesson(target.dataset.lesson);
      return;
    }
    if (target.dataset.lessonFilter) {
      this.lessonFilter = target.dataset.lessonFilter;
      this.renderPage();
      $(`[data-lesson-filter="${this.lessonFilter}"]`)?.focus({
        preventScroll: true,
      });
      return;
    }
    if (target.dataset.challengeFilter) {
      this.challengeFilter = target.dataset.challengeFilter;
      this.renderPage();
      $(`[data-challenge-filter="${this.challengeFilter}"]`)?.focus({
        preventScroll: true,
      });
      return;
    }
    if (target.dataset.quiz !== undefined) {
      this.answerQuiz(
        target.dataset.lessonId,
        Number(target.dataset.quiz),
        target,
      );
      return;
    }
    if (target.dataset.flip) {
      this.flipChallenge(target.dataset.flip);
      return;
    }
    if (target.dataset.complete) {
      this.completeChallenge(target.dataset.complete);
      return;
    }
    if (target.dataset.challengeOpen) {
      const id = target.dataset.challengeOpen;
      this.challengeFilter = "all";
      location.hash = "challenges";
      // A hash change renders on the next task; open the requested card afterward.
      setTimeout(() => {
        this.flipChallenge(id, true);
        $(`[data-card="${id}"]`)?.scrollIntoView({
          behavior: reducedMotion() ? "auto" : "smooth",
          block: "center",
        });
      }, 50);
      return;
    }
    if (target.dataset.editTransaction) {
      this.openTransaction(target.dataset.editTransaction);
      return;
    }
    if (target.dataset.deleteTransaction) {
      const id = target.dataset.deleteTransaction;
      const transaction = this.state.transactions.find((t) => t.id === id);
      if (!transaction) return;
      this.state.transactions = this.state.transactions.filter(
        (t) => t.id !== id,
      );
      this.lastDeleted = { transaction, dataKey: this.dataKey };
      this.save();
      this.renderPage();
      this.toast(`“${transaction.description}” removed. Balance updated.`, {
        action: "undo-delete",
        label: "Undo",
      });
      return;
    }
    const action = target.dataset.action;
    if (!action) return;
    const actions = {
      close: () => this.closeModal(),
      about: () => this.openAbout(),
      menu: () => {
        const menu = $("#mobile-nav");
        menu.hidden = !menu.hidden;
        target.setAttribute("aria-expanded", String(!menu.hidden));
      },
      "app-menu": () => {
        const open = $("#app-sidebar").classList.toggle("open");
        target.setAttribute("aria-expanded", String(open));
      },
      password: () => {
        const input = $("#auth-password");
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        target.setAttribute(
          "aria-label",
          show ? "Hide password" : "Show password",
        );
        target.setAttribute("aria-pressed", String(show));
      },
      transaction: () => this.openTransaction(),
      balance: () => this.openBalance(),
      goal: () => this.openGoal(),
      shuffle: () => this.shuffleChallenges(),
      profile: () => this.openOnboarding(),
      "onboard-back": () => {
        this.captureOnboarding($("#onboarding-form"));
        this.onboardingStep--;
        this.renderOnboarding();
      },
      "clear-filters": () => {
        this.activitySearch = "";
        this.activityFilter = "all";
        this.renderPage();
      },
      "undo-delete": () => {
        if (!this.lastDeleted || this.lastDeleted.dataKey !== this.dataKey)
          return;
        this.state.transactions.push(this.lastDeleted.transaction);
        this.lastDeleted = null;
        this.save();
        if (this.page !== "home") this.renderPage();
        this.toast("Transaction restored. Your balance is up to date.");
      },
      "use-income": () => {
        $("#budget-income").value = Finance.totals(this.state).income;
        this.updateBudget();
        this.toast("Your recorded income is ready to explore.");
      },
      logout: () => {
        this.store.remove("session");
        this.store.remove("session", true);
        this.user = null;
        this.dataKey = "guest";
        this.state = this.store.loadState("guest");
        this.lessonFilter = "all";
        this.challengeFilter = "all";
        this.activityFilter = "all";
        this.activitySearch = "";
        this.renderHome();
        location.hash = "home";
        this.toast("See you on your next move. Your demo progress is saved.");
      },
    };
    actions[action]?.();
  }

  handleSubmit(event) {
    const form = event.target;
    if (
      ![
        "auth-form",
        "onboarding-form",
        "balance-form",
        "transaction-form",
        "goal-form",
      ].includes(form.id)
    )
      return;
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (form.id === "auth-form") {
      this.submitAuth(form);
      return;
    }
    if (form.id === "onboarding-form") {
      this.submitOnboarding(form);
      return;
    }
    const data = new FormData(form);
    if (form.id === "balance-form") {
      this.state.startingBalance = roundMoney(Number(data.get("starting")));
      this.state.baseIncome = roundMoney(Number(data.get("income")));
      this.toast("New starting point. Same possibilities.");
    }
    if (form.id === "transaction-form") {
      const description = String(data.get("description")).trim();
      if (!description) {
        $("#transaction-error").textContent =
          "Give this transaction a short description.";
        return;
      }
      const transaction = {
        id: this.editingTransaction || uid(),
        description,
        amount: roundMoney(Number(data.get("amount"))),
        category: data.get("category"),
        date: data.get("date"),
        type: data.get("type"),
      };
      if (this.editingTransaction)
        this.state.transactions = this.state.transactions.map((t) =>
          t.id === this.editingTransaction ? transaction : t,
        );
      else this.state.transactions.push(transaction);
      this.toast(
        this.editingTransaction
          ? "Move updated. Your numbers are up to date."
          : "A new move, recorded. Your balance is up to date.",
      );
    }
    if (form.id === "goal-form") {
      const goal = this.readGoalForm();
      if (!goal.name) {
        $("#goal-error").textContent =
          "Give your goal a name that means something to you.";
        return;
      }
      const reached =
        goal.saved >= goal.target &&
        this.state.goal.saved < this.state.goal.target;
      this.state.goal = goal;
      this.toast(
        reached
          ? "Goal reached. Look how far you’ve come."
          : "Your game plan is saved. One little step at a time.",
      );
      if (reached) this.celebrate();
    }
    this.save();
    this.closeModal();
    if (this.page !== "home") this.renderPage();
  }

  handleInput(event) {
    const input = event.target;
    if (input.id === "home-income") {
      const value = Number(input.value);
      const split = Finance.budget(value);
      $("#home-budget-total").textContent = money(value);
      $("#home-income-value").textContent = money(value);
      $("#home-needs").textContent = money(split.needs);
      $("#home-wants").textContent = money(split.wants);
      $("#home-savings").textContent = money(split.savings);
    }
    if (input.id === "activity-search") {
      this.activitySearch = input.value;
      this.renderTransactions();
    }
    if (input.id === "budget-income") this.updateBudget();
    if (input.id.startsWith("invest-")) this.updateCompound();
    if (input.closest("#goal-form")) this.updateGoalPreview();
  }

  handleChange(event) {
    const input = event.target;
    if (input.id === "activity-filter") {
      this.activityFilter = input.value;
      this.renderTransactions();
    }
    if (input.closest("#transaction-form") && input.name === "type")
      $("#transaction-category").innerHTML = this.categoryOptions(input.value);
    if (input.id === "goal-frequency") this.updateGoalPreview();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.koinApp = new KoinApp();
});
