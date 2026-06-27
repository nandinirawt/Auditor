// Sample audit data. The dashboard reads this until the Phase 3 audit
// endpoints land; the hooks in src/hooks/useAudit.js are shaped to swap
// straight over to the real API with no page changes.

export const CATEGORIES = [
  "Agriculture", "Education", "Electoral", "Energy", "Entertainment", "Finance",
  "Food", "Health", "Identity", "Indian Post", "Information and Technology",
  "Judiciary", "Language", "m-Learning", "Municipal corporation", "News",
  "Others", "Shopping", "Social", "Social Welfare", "Sports", "Transport",
  "Travel", "Weather",
];

export const AUDIT_STAGES = [
  { key: "launch", label: "Launching browser", detail: "Headless Chromium" },
  { key: "open", label: "Opening website", detail: "Resolving & loading" },
  { key: "scroll", label: "Scrolling the page", detail: "Capturing full height" },
  { key: "screens", label: "Taking screenshots", detail: "Desktop · tablet · mobile" },
  { key: "a11y", label: "Running accessibility tests", detail: "axe-core · WCAG 2.2" },
  { key: "perf", label: "Running Lighthouse", detail: "Performance · SEO" },
  { key: "report", label: "Preparing report", detail: "Scoring & mapping" },
];

export const sampleAudit = {
  id: "aud_8f21c4",
  url: "https://www.lumio.store",
  domain: "lumio.store",
  title: "Lumio — Modern Lighting Store",
  category: "Shopping",
  device: "desktop",
  status: "completed",
  finishedAt: "2026-06-27T10:42:00Z",
  durationMs: 38400,
  scores: {
    overall: 72,
    accessibility: 68,
    performance: 81,
    seo: 90,
    bestPractices: 85,
    wcag: 74,
  },
  counts: { critical: 3, serious: 7, moderate: 11, minor: 9 },
  trend: [
    { date: "Apr", overall: 58, accessibility: 51 },
    { date: "May", overall: 64, accessibility: 60 },
    { date: "Jun", overall: 72, accessibility: 68 },
  ],
};

export const performance = {
  metrics: [
    { key: "lcp", label: "Largest Contentful Paint", value: 2600, unit: "ms", good: 2500, target: "< 2.5 s" },
    { key: "fcp", label: "First Contentful Paint", value: 1400, unit: "ms", good: 1800, target: "< 1.8 s" },
    { key: "tbt", label: "Total Blocking Time", value: 210, unit: "ms", good: 200, target: "< 200 ms" },
    { key: "cls", label: "Cumulative Layout Shift", value: 0.06, unit: "", good: 0.1, target: "< 0.1" },
    { key: "si", label: "Speed Index", value: 3100, unit: "ms", good: 3400, target: "< 3.4 s" },
    { key: "tti", label: "Time to Interactive", value: 4200, unit: "ms", good: 3800, target: "< 3.8 s" },
  ],
  categories: [
    { key: "performance", label: "Performance", score: 81 },
    { key: "accessibility", label: "Accessibility", score: 68 },
    { key: "seo", label: "SEO", score: 90 },
    { key: "bestPractices", label: "Best Practices", score: 85 },
  ],
};

export const findings = [
  {
    id: "f1", severity: "critical", source: "axe", category: "Color & contrast",
    title: "Text has insufficient contrast against its background",
    description: "Body copy in the footer uses #7A8190 on #0F1115 — a ratio of 3.1:1, below the 4.5:1 minimum for normal text.",
    selector: "footer .footer__links a", wcag: "1.4.3", level: "AA", page: "/",
    help: "https://dequeuniversity.com/rules/axe/4.7/color-contrast",
  },
  {
    id: "f2", severity: "critical", source: "axe", category: "Forms",
    title: "Form input is missing an associated label",
    description: "The newsletter email field has no <label> and no accessible name, so screen readers announce it only as 'edit text'.",
    selector: "input#newsletter-email", wcag: "3.3.2", level: "A", page: "/",
    help: "https://dequeuniversity.com/rules/axe/4.7/label",
  },
  {
    id: "f3", severity: "critical", source: "axe", category: "Images",
    title: "Informative images are missing alternative text",
    description: "Six product thumbnails on the collection grid have empty alt attributes, hiding product names from assistive tech.",
    selector: ".collection-grid img", wcag: "1.1.1", level: "A", page: "/collection",
    help: "https://dequeuniversity.com/rules/axe/4.7/image-alt",
  },
  {
    id: "f4", severity: "serious", source: "axe", category: "Keyboard",
    title: "Interactive element is not reachable by keyboard",
    description: "The cart drawer toggle is a <div> with an onClick handler and no tabindex, so keyboard users can't open it.",
    selector: ".header__cart-toggle", wcag: "2.1.1", level: "A", page: "/",
    help: "https://dequeuniversity.com/rules/axe/4.7/focusable-content",
  },
  {
    id: "f5", severity: "serious", source: "axe", category: "Focus",
    title: "Focus indicator is removed on interactive controls",
    description: "A global `outline: none` strips the visible focus ring from links and buttons with no replacement.",
    selector: "a, button", wcag: "2.4.7", level: "AA", page: "/",
    help: "https://dequeuniversity.com/rules/axe/4.7/focus-visible",
  },
  {
    id: "f6", severity: "serious", source: "axe", category: "Structure",
    title: "Heading levels are skipped",
    description: "The product page jumps from <h1> to <h4>, breaking the document outline screen readers rely on.",
    selector: "main h4", wcag: "1.3.1", level: "A", page: "/product/aurora-lamp",
    help: "https://dequeuniversity.com/rules/axe/4.7/heading-order",
  },
  {
    id: "f7", severity: "serious", source: "lighthouse", category: "Performance",
    title: "Largest Contentful Paint element loads late",
    description: "The hero image is 480 KB and not preloaded, pushing LCP to 2.6 s on a simulated mobile connection.",
    selector: ".hero__image", wcag: null, level: null, page: "/",
    help: "https://web.dev/lcp/",
  },
  {
    id: "f8", severity: "moderate", source: "axe", category: "Landmarks",
    title: "Page lacks a main landmark",
    description: "No <main> element or role='main', so users of assistive tech can't skip directly to primary content.",
    selector: "body", wcag: "1.3.1", level: "A", page: "/",
    help: "https://dequeuniversity.com/rules/axe/4.7/landmark-one-main",
  },
  {
    id: "f9", severity: "moderate", source: "axe", category: "Color & contrast",
    title: "Placeholder text contrast is too low",
    description: "Search placeholder #8A92A0 on white is 2.9:1; users with low vision may not perceive the prompt.",
    selector: ".search input::placeholder", wcag: "1.4.3", level: "AA", page: "/",
    help: "https://dequeuniversity.com/rules/axe/4.7/color-contrast",
  },
  {
    id: "f10", severity: "moderate", source: "lighthouse", category: "SEO",
    title: "Links do not have descriptive text",
    description: "Several 'Read more' links share identical text, giving no context out of place to screen-reader users.",
    selector: "a.read-more", wcag: "2.4.4", level: "A", page: "/blog",
    help: "https://web.dev/link-text/",
  },
  {
    id: "f11", severity: "minor", source: "axe", category: "Language",
    title: "Document language could be more specific",
    description: "The <html> lang is 'en'; specifying a region ('en-IN') improves pronunciation in some screen readers.",
    selector: "html", wcag: "3.1.1", level: "A", page: "/",
    help: "https://dequeuniversity.com/rules/axe/4.7/html-has-lang",
  },
  {
    id: "f12", severity: "minor", source: "lighthouse", category: "Best practices",
    title: "Images are served at higher resolution than needed",
    description: "Product images are 2x the displayed size on desktop, costing ~140 KB of avoidable transfer.",
    selector: ".product img", wcag: null, level: null, page: "/collection",
    help: "https://web.dev/uses-responsive-images/",
  },
];

export const wcag = {
  level: "AA",
  principles: [
    { key: "perceivable", label: "Perceivable", passed: 14, total: 20, note: "Contrast and alt text are the main gaps." },
    { key: "operable", label: "Operable", passed: 9, total: 13, note: "Keyboard reach and focus visibility need work." },
    { key: "understandable", label: "Understandable", passed: 11, total: 13, note: "Mostly solid; a few unlabeled inputs." },
    { key: "robust", label: "Robust", passed: 6, total: 7, note: "Markup parses cleanly; minor ARIA fixes." },
  ],
  criteria: [
    { id: "1.1.1", name: "Non-text Content", level: "A", principle: "Perceivable", status: "fail", issues: 1 },
    { id: "1.3.1", name: "Info and Relationships", level: "A", principle: "Perceivable", status: "fail", issues: 2 },
    { id: "1.4.3", name: "Contrast (Minimum)", level: "AA", principle: "Perceivable", status: "fail", issues: 2 },
    { id: "1.4.11", name: "Non-text Contrast", level: "AA", principle: "Perceivable", status: "pass", issues: 0 },
    { id: "2.1.1", name: "Keyboard", level: "A", principle: "Operable", status: "fail", issues: 1 },
    { id: "2.4.4", name: "Link Purpose (In Context)", level: "A", principle: "Operable", status: "fail", issues: 1 },
    { id: "2.4.7", name: "Focus Visible", level: "AA", principle: "Operable", status: "fail", issues: 1 },
    { id: "3.1.1", name: "Language of Page", level: "A", principle: "Understandable", status: "pass", issues: 0 },
    { id: "3.3.2", name: "Labels or Instructions", level: "A", principle: "Understandable", status: "fail", issues: 1 },
    { id: "4.1.2", name: "Name, Role, Value", level: "A", principle: "Robust", status: "pass", issues: 0 },
  ],
};

export const journey = [
  { step: 1, label: "Homepage", path: "/", loadMs: 1800, issues: 6, note: "Hero, featured collections, newsletter." },
  { step: 2, label: "Collection", path: "/collection", loadMs: 2100, issues: 4, note: "Product grid with filters." },
  { step: 3, label: "Product", path: "/product/aurora-lamp", loadMs: 1600, issues: 5, note: "Gallery, variants, add to cart." },
  { step: 4, label: "Cart", path: "/cart", loadMs: 1200, issues: 2, note: "Line items and summary." },
  { step: 5, label: "Checkout", path: "/checkout", loadMs: 2400, issues: 3, note: "Address and payment forms." },
];

export const recommendations = [
  {
    id: "r1", priority: "high", effort: "Low", area: "Accessibility",
    title: "Restore a visible focus style across all interactive controls",
    body: "Replace the global `outline: none` with a high-contrast focus ring. This single change resolves the focus-visible failure site-wide and immediately helps keyboard and switch users navigate Lumio.",
    impact: "+6 accessibility score",
  },
  {
    id: "r2", priority: "high", effort: "Medium", area: "Accessibility",
    title: "Label every form field and add error guidance",
    body: "Associate <label> elements with the newsletter, search, and checkout inputs, and pair validation messages with aria-describedby so assistive tech announces what went wrong and how to fix it.",
    impact: "Resolves 2 critical issues",
  },
  {
    id: "r3", priority: "medium", effort: "Low", area: "Performance",
    title: "Preload and compress the hero image",
    body: "Serve the hero as a responsive AVIF/WebP and add a preload hint. Cutting it from 480 KB to ~120 KB should pull LCP under the 2.5 s threshold on mobile.",
    impact: "−0.4 s LCP",
  },
  {
    id: "r4", priority: "medium", effort: "Medium", area: "Structure",
    title: "Add landmarks and fix heading order",
    body: "Wrap primary content in <main>, add a skip link, and correct the h1→h4 jump on product pages so the document outline is linear and skimmable.",
    impact: "+3 accessibility score",
  },
  {
    id: "r5", priority: "low", effort: "Low", area: "SEO",
    title: "Make repeated link text descriptive",
    body: "Give each 'Read more' link unique, context-rich text (e.g. 'Read more about the Aurora Lamp') to improve both SEO and screen-reader clarity.",
    impact: "Minor SEO uplift",
  },
];

export const codeFixes = [
  {
    id: "c1", title: "Visible focus ring", language: "css", wcag: "2.4.7",
    summary: "Remove the blanket outline reset and define a clear, themeable focus indicator.",
    before: `/* global reset hides focus for everyone */
*:focus {
  outline: none;
}`,
    after: `/* keep focus visible, only for keyboard users */
:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
  border-radius: 4px;
}`,
  },
  {
    id: "c2", title: "Labelled email input", language: "jsx", wcag: "3.3.2",
    summary: "Give the newsletter field a real label and an accessible description.",
    before: `<input
  id="newsletter-email"
  type="email"
  placeholder="Your email"
/>`,
    after: `<label htmlFor="newsletter-email">Email address</label>
<input
  id="newsletter-email"
  type="email"
  autoComplete="email"
  aria-describedby="newsletter-hint"
/>
<p id="newsletter-hint">We send one update a month.</p>`,
  },
  {
    id: "c3", title: "Keyboard-operable cart toggle", language: "jsx", wcag: "2.1.1",
    summary: "Swap the click-only div for a real button so it is focusable and operable.",
    before: `<div className="header__cart-toggle" onClick={openCart}>
  <CartIcon />
</div>`,
    after: `<button
  type="button"
  className="header__cart-toggle"
  onClick={openCart}
  aria-label="Open cart"
>
  <CartIcon aria-hidden="true" />
</button>`,
  },
];

export const competitors = {
  subject: { name: "Lumio", domain: "lumio.store", scores: { overall: 72, accessibility: 68, performance: 81, seo: 90 } },
  rivals: [
    { name: "Glowsmith", domain: "glowsmith.com", scores: { overall: 88, accessibility: 91, performance: 84, seo: 92 } },
    { name: "Lumen & Co", domain: "lumenco.io", scores: { overall: 79, accessibility: 74, performance: 88, seo: 81 } },
    { name: "Brightwell", domain: "brightwell.shop", scores: { overall: 65, accessibility: 60, performance: 70, seo: 76 } },
  ],
};

export const history = [
  { id: "aud_8f21c4", url: "https://www.lumio.store", domain: "lumio.store", category: "Shopping", status: "completed", overall: 72, accessibility: 68, performance: 81, date: "2026-06-27T10:42:00Z", issues: 30 },
  { id: "aud_7a09b1", url: "https://www.lumio.store", domain: "lumio.store", category: "Shopping", status: "completed", overall: 64, accessibility: 60, performance: 78, date: "2026-05-29T16:05:00Z", issues: 41 },
  { id: "aud_61f3d8", url: "https://docs.lumio.store", domain: "docs.lumio.store", category: "Information and Technology", status: "completed", overall: 86, accessibility: 89, performance: 83, date: "2026-05-18T09:20:00Z", issues: 12 },
  { id: "aud_5c22e7", url: "https://help.northwind.app", domain: "northwind.app", category: "Others", status: "failed", overall: null, accessibility: null, performance: null, date: "2026-05-11T13:48:00Z", issues: null },
  { id: "aud_4b81a0", url: "https://www.lumio.store", domain: "lumio.store", category: "Shopping", status: "completed", overall: 58, accessibility: 51, performance: 72, date: "2026-04-30T11:15:00Z", issues: 53 },
];
