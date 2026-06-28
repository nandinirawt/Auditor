# UXSense

UXSense is an AI-assisted accessibility and UX auditing tool. You give it any website URL, and it opens that site in a real browser, scans it for accessibility and usability problems, scores it, and shows you how to fix each issue. It can also render a live before-and-after of a fix and read the audit out loud.

Everything is measured from the real page, not mocked up.

## About

Web accessibility is a legal requirement in many countries and the right thing to do, but auditing a website for accessibility and user experience problems is usually slow, manual, and expensive. Most teams only learn that their site is hard to use after a real person struggles with it.

UXSense makes that audit fast and automatic. You paste a website URL, and it opens the real site in a browser, checks it the way a specialist tool would, and gives you a clear score along with the exact problems and how to fix them. Because it runs on the real rendered page, the results reflect what people actually experience.

A few things make it more than a simple checklist:

- It measures the live page in a real browser, so the scores are real and not guessed from the HTML.
- It does not just flag problems. It generates the code fix and renders a real before-and-after of each fix.
- Because it is an accessibility tool, it can also read the audit out loud, using the same kind of assistive voice technology it tests for.

This project was built for a hackathon.

## Features

- Real accessibility scanning with axe-core (WCAG violations, severity, and the exact elements affected)
- WCAG compliance broken down across the four principles, with links to the official W3C documentation
- Performance, SEO and UX scores measured from the live page, no Lighthouse install required
- An overall score that is a transparent weighted blend of every measured signal
- Full-page screenshots across desktop, tablet and mobile
- A multi-page crawler that captures the public pages a site links to
- AI Studio: prioritised recommendations, generated code fixes, and a live before-and-after render of each fix
- Competitor benchmarking against other websites
- Audit history with search and re-run
- "Listen to this audit": a spoken audio summary using the smallest.ai text-to-speech API

## Tech stack

**Backend**

- Python: core language for the backend and the analysis pipeline
- FastAPI: the REST API framework, with automatic validation and interactive docs
- Uvicorn: the server that runs the app
- Playwright with headless Chromium: drives a real browser to load pages, take screenshots, crawl, and render the live before-and-after
- axe-core: the accessibility scanning engine that produces the WCAG violations
- SQLAlchemy with aiosqlite and SQLite: the database, file-based so there is no server to install
- Pydantic: validates the data going in and out of the API
- python-jose and bcrypt: authentication, using JSON Web Tokens and hashed passwords
- SlowAPI: rate limiting on the API
- httpx: the HTTP client used to call the smallest.ai voice API

**Frontend**

- React: the user interface
- Vite: the build tool and development server
- React Router: page navigation
- Tailwind CSS: styling and the dark theme
- TanStack React Query: fetching and caching data from the backend
- axios: the HTTP client for API calls
- Recharts: charts for trends and the competitor comparison
- Framer Motion: animations
- lucide-react: icons
- prism-react-renderer: syntax highlighting for the generated code

**External services**

- smallest.ai (Lightning text-to-speech): powers the "Listen to this audit" audio summary

## Requirements

- Python 3.11 or newer
- Node.js 18 or newer

## Setup

The project has two parts: a backend and a frontend. Run each in its own terminal.

### 1. Backend

```
cd backend
python3 -m venv .venv
source .venv/bin/activate        # on Windows: .venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium      # downloads the browser used for scanning
```

Create a file called `.env` inside the `backend` folder with this content:

```
SECRET_KEY=any-long-random-string
DATABASE_URL=sqlite+aiosqlite:///./uxsense.db

# Optional: enables the "Listen to this audit" voice feature
SMALLEST_API_KEY=your-smallest-ai-key
SMALLEST_TTS_URL=https://waves-api.smallest.ai/api/v1/lightning/get_speech
SMALLEST_VOICE_ID=magnus
```

Start the backend:

```
uvicorn app.main:app --reload --reload-dir app
```

The API runs at http://localhost:8000 and the interactive docs are at http://localhost:8000/docs.

Note: the `--reload-dir app` part matters. It stops the server from restarting itself when it saves screenshot files while you work.

### 2. Frontend

In a second terminal:

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## How to use

1. Click "New audit" and paste a website URL.
2. Wait for the scan to finish. It loads the real site in a browser, so it takes a few seconds.
3. Explore the dashboard pages: Overview, Accessibility, WCAG, Recommendations, Generated Code, Before vs After, Competitor, and Audit History.

A good page to test with is the W3C accessibility demo, which has real, known problems:

```
https://www.w3.org/WAI/demos/bad/before/home.html
```

## How it works

When you submit a URL, the backend launches a headless Chromium browser with Playwright, loads the page, and takes full-page screenshots. It injects axe-core to scan the live page for accessibility issues, and reads the browser's own timing and page data to measure performance and SEO. These signals are combined into the scores you see. Each fix can be re-applied to the live page and the page re-scanned, which produces a genuine before-and-after. Audit results are saved as JSON files and shown in the dashboard.

## Voice feature (smallest.ai)

The "Listen to this audit" button builds a short summary from the audit data and sends it to the smallest.ai Lightning text-to-speech API, which returns audio that plays in the browser. This needs `SMALLEST_API_KEY` set in your `.env` file. Without a key, the rest of the app still works and the button shows a short message instead of failing.

## Notes and limitations

- Performance is measured from a single real page load on your network, not a throttled lab environment like Lighthouse, so the number is real but rougher.
- The crawler reaches public pages only. Pages behind a login, or that need items in a cart, cannot be reached by an automated crawler.
- Accessibility scanning focuses on the homepage.
- Large websites sometimes block automated browsers. This is normal and affects all automated tools.

## Project structure

```
uxsense/
  backend/
    app/
      api/v1/           API routes
      services/audit/   screenshots, accessibility, metrics, crawler, preview, voice
      core/             config and database
  frontend/
    src/
      pages/            dashboard pages
      components/        UI components
      api/              API client
      context/           shared state
```