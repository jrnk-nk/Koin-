# Koin

**Your money. Your moves. Your future.**

A financial education prototype for teenagers and young adults, built with HTML, CSS, and vanilla JavaScript for an IB MYP Personal Project.

## Deploy on Vercel

1. Sign in to [Vercel](https://vercel.com/new) with GitHub.
2. Select **Add New → Project**, then import **jrnk-nk/koin**. If the private repository is missing, grant Vercel access to it in the GitHub integration settings.
3. Choose **Other** as the framework preset, keep the root directory as `./`, and leave the build and install commands empty. The output directory is `.` as configured in `vercel.json`.
4. Click **Deploy**.

No packages, backend, database, or environment variables are required. Vercel serves `index.html`, `style.css`, and `script.js` directly over HTTPS. Further commits to `main` can deploy automatically after the repository is connected to Vercel.

The app uses hash routes such as `/#dashboard` and `/#learn`; no server-side route rewrites are needed.

## Run locally

Open this folder in Visual Studio Code, install the **Live Server** extension, right-click `index.html`, and select **Open with Live Server**.

Use `localhost` rather than opening a `file://` URL so the demo authentication can use the browser's Web Crypto API.

## Explore

- A responsive landing page with a CSS-built 3D wallet scene and interactive budget preview.
- Demo registration, login, remember-me sessions, and a three-step personalized onboarding flow.
- A dashboard with editable starting balance, base income, and live financial calculations.
- Income and expense recording, editing, search, filtering, removal, and undo.
- A savings target tracker with capped progress and contribution-based timeline estimates.
- Six financial learning tracks with lessons, quizzes, and persistent progress.
- Flipping 3D challenge cards, category filters, animated shuffling, and XP.
- Budget, spending-analysis, and hypothetical compound-growth tools.
- Keyboard navigation, labelled forms, native accessible dialogs, and reduced-motion support.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Semantic page structure, icons, landing page, and app shell |
| `style.css` | Dark theme, responsive layouts, 3D effects, and animations |
| `script.js` | Application state, finance calculations, demo authentication, and interactions |
| `vercel.json` | Static-site hosting settings for Vercel |

Google Fonts enhance the typography when available. System fonts provide a fallback; the application has no JavaScript dependencies.

## Demo data and authentication

Select **Explore Koin** to try the fictional sample dashboard without an account. Use made-up details and a demo-only password if creating an account.

Data is stored in the visitor's browser using localStorage and sessionStorage. It does not sync across devices, browsers, or domains. Data entered locally does not automatically appear on a Vercel deployment.

Raw passwords are never saved; the prototype stores a salted PBKDF2 verifier. This is still **not production authentication**: browser storage can be inspected or changed, and there is no trusted backend or secure server session. Never use a real or reused password, bank details, or sensitive financial information.

Koin does not move money, connect to financial accounts, recommend investments, or promise returns. Financial examples use USD; actual products, eligibility rules, taxes, and regulations depend on location.

## Verification

The app passed 82 automated finance, interaction, validation, authentication, and persistence checks, plus JavaScript syntax and HTML structure checks. Visual browser testing was unavailable in the development environment.
