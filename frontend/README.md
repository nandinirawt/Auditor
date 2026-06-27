# UXSense — Frontend

The web client for UXSense: an AI conversational UX & accessibility auditor.
Premium dark UI built with React 18, Vite, Tailwind, React Router, React Query,
Framer Motion, and Recharts.

## Run it

You need **Node.js 18+** installed (https://nodejs.org). Then:

```bash
cd frontend
npm install
npm run dev
```

Open the URL it prints — usually **http://localhost:5173**.

## What's live vs. mock

- **Runs standalone.** The whole product is explorable on sample data with no
  backend running. Try: Home → enter a URL → Analyze → watch the scan → Dashboard.
- **Auth + Projects are real.** Login, Register, and the Projects page talk to the
  UXSense backend. Start the backend (`uvicorn app.main:app --reload` in `../backend`),
  and these connect automatically. The API base URL is set in `.env`
  (`VITE_API_BASE_URL`, default `http://localhost:8000`).
- **Audit data is mock for now.** Overview, Accessibility, WCAG, Competitor,
  History, and the three AI Studio pages render realistic sample data. The hooks in
  `src/hooks/useAudit.js` are shaped to swap to the real audit endpoints once the
  backend engine phase ships — no page changes needed.

## Structure

```
src/
  api/          Axios client + auth/projects calls (real backend)
  components/   ui primitives, layout, landing, dashboard widgets
  context/      AuthContext
  hooks/        useProjects (real), useAudit (mock)
  lib/          mockData, utils
  pages/        landing, loading, auth, dashboard/*
```
