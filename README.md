# Koin

**Your money. Your moves. Your future.**

A financial education prototype built around college life: rent, food, side gigs, shared bills, and the group chat. Built with HTML, CSS, and vanilla JavaScript for an IB MYP Personal Project.

## Deploy on Vercel

1. Sign in to [Vercel](https://vercel.com/new) with GitHub.
2. Select **Add New → Project**, then import **jrnk-nk/Koin-**. If the repository is missing, grant Vercel access to it in the GitHub integration settings.
3. Choose **Other** as the framework preset, keep the root directory as `./`, and leave the build and install commands empty. The output directory is `.` as configured in `vercel.json`.
4. Click **Deploy**.

No packages, backend, database, or environment variables are required. Vercel serves `index.html`, `style.css`, and `script.js` directly over HTTPS. Further commits to `main` can deploy automatically after the repository is connected to Vercel.

The app uses hash routes such as `/#dashboard` and `/#learn`; no server-side route rewrites are needed.

## Run locally

Open this folder in Visual Studio Code, install the **Live Server** extension, right-click `index.html`, and select **Open with Live Server**.

Use `localhost` rather than opening a `file://` URL so the demo authentication can use the browser's Web Crypto API.

## Explore

- A campus poster-inspired interface with condensed typography, paper receipts, lime accents, student photography, and CSS 3D effects.
- An interactive receipt and a playable landing-page money dilemma.
- Six money dilemmas covering nights out, textbooks, pay-later offers, gigs, subscriptions, and investing. Every choice explains its tradeoff; each completed scenario earns 15 XP once.
- A payday planner that protects upcoming bills and a chosen buffer before estimating daily spending room. It updates with the ledger and flags shortfalls.
- A shared-bill splitter that distributes leftover cents accurately.
- Demo registration, login, remember-me sessions, and a three-step personalized onboarding flow.
- A dashboard with editable starting balance, base income, and live financial calculations.
- Income and expense recording, editing, search, filtering, removal, and undo.
- A savings target tracker with capped progress and contribution-based timeline estimates.
- Six financial learning tracks with lessons, quizzes, and persistent progress.
- Flipping 3D challenge cards, category filters, animated shuffling, and XP.
- Budget, spending-analysis, and hypothetical compound-growth tools.
- Keyboard navigation, labelled forms, native accessible dialogs, and reduced-motion support.

## Files

| File                | Purpose                                                                        |
| ------------------- | ------------------------------------------------------------------------------ |
| `index.html`        | Semantic page structure, icons, landing page, and app shell                    |
| `style.css`         | Dark theme, responsive layouts, 3D effects, and animations                     |
| `script.js`         | Application state, finance calculations, demo authentication, and interactions |
| `assets/campus.jpg` | Locally served campus-life photograph                                          |
| `vercel.json`       | Static-site hosting settings for Vercel                                        |

Google Fonts enhance the typography when available. System fonts provide a fallback; the application has no JavaScript dependencies.

Campus photograph: [Unsplash source](https://images.unsplash.com/photo-1523240795612-9a054b0db644). The photograph is included locally so the page does not depend on a remote image request.

## Demo data and authentication

Select **Play before you sign up** to try the fictional money dilemmas, then open **My week** to explore the sample dashboard without an account. Use made-up details and a demo-only password if creating an account.

Data is stored in the visitor's browser using localStorage and sessionStorage. It does not sync across devices, browsers, or domains. Data entered locally does not automatically appear on a Vercel deployment.

Supabase is not connected in this version. There are no backend credentials, cloud accounts, or server-side data synchronization.

Raw passwords are never saved; the prototype stores a salted PBKDF2 verifier. This is still **not production authentication**: browser storage can be inspected or changed, and there is no trusted backend or secure server session. Never use a real or reused password, bank details, or sensitive financial information.

Koin does not move money, connect to financial accounts, recommend investments, or promise returns. Financial examples use USD; actual products, eligibility rules, taxes, and regulations depend on location.

## Verification

The app passed 100 automated finance, interaction, validation, authentication, and persistence checks with no JavaScript runtime errors. These include payday calculations, exact-cent bill splitting, dilemma decisions, and duplicate-XP prevention. JavaScript syntax and source formatting were also checked. Visual browser testing was unavailable in the development environment.
