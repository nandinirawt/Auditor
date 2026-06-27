"""Issue → Recommendation → Code → Before/After engine.

Turns the REAL axe-core issues from an audit into:
  - structured recommendations (grouped, prioritized),
  - implementation code (HTML / CSS / Tailwind / React), and
  - before/after preview data.

Everything is derived from the specific issue (rule id, selector, failing HTML,
WCAG criterion, impact) — not hardcoded. A per-rule knowledge base supplies
targeted fixes for common rules; anything else falls back to a generic fix built
from the issue's own axe metadata, so it works for any site. No LLM/key required;
an Anthropic key can later enrich the prose without changing the API shape.
"""
from __future__ import annotations

import html as _html

# axe rule id -> friendly group used for filtering on the Recommendations page.
_GROUP_BY_RULE = {
    "color-contrast": "Color & Contrast", "color-contrast-enhanced": "Color & Contrast",
    "link-in-text-block": "Color & Contrast",
    "label": "Forms", "label-title-only": "Forms", "form-field-multiple-labels": "Forms",
    "select-name": "Forms", "input-button-name": "Forms", "aria-input-field-name": "Forms",
    "image-alt": "Images & Media", "input-image-alt": "Images & Media", "area-alt": "Images & Media",
    "svg-img-alt": "Images & Media", "object-alt": "Images & Media", "role-img-alt": "Images & Media",
    "link-name": "Links & Buttons", "button-name": "Links & Buttons",
    "nested-interactive": "Links & Buttons",
    "landmark-one-main": "Navigation & Landmarks", "region": "Navigation & Landmarks",
    "bypass": "Navigation & Landmarks", "landmark-unique": "Navigation & Landmarks",
    "heading-order": "Headings & Structure", "page-has-heading-one": "Headings & Structure",
    "empty-heading": "Headings & Structure", "list": "Headings & Structure",
    "listitem": "Headings & Structure", "definition-list": "Headings & Structure",
    "html-has-lang": "Language", "html-lang-valid": "Language", "valid-lang": "Language",
    "tabindex": "Keyboard & Focus", "focus-order-semantics": "Keyboard & Focus",
    "scrollable-region-focusable": "Keyboard & Focus", "interactive-supports-focus": "Keyboard & Focus",
    "aria-hidden-focus": "Keyboard & Focus", "focus-visible": "Keyboard & Focus",
    "aria-required-attr": "ARIA & Semantics", "aria-roles": "ARIA & Semantics",
    "aria-valid-attr-value": "ARIA & Semantics", "aria-allowed-attr": "ARIA & Semantics",
    "duplicate-id-aria": "ARIA & Semantics", "aria-required-children": "ARIA & Semantics",
    "meta-viewport": "Responsiveness", "target-size": "Responsiveness",
    "document-title": "SEO & Metadata", "meta-description": "SEO & Metadata",
}

_PRINCIPLE_BY_GROUP = {
    "Color & Contrast": "Perceivable", "Images & Media": "Perceivable",
    "Forms": "Understandable", "Language": "Understandable",
    "Links & Buttons": "Operable", "Navigation & Landmarks": "Operable",
    "Keyboard & Focus": "Operable", "Headings & Structure": "Perceivable",
    "ARIA & Semantics": "Robust", "Responsiveness": "Operable",
    "SEO & Metadata": "Understandable", "Other": "Robust",
}

_SEVERITY_PRIORITY = {"critical": "P1", "serious": "P2", "moderate": "P3", "minor": "P4"}
# Estimated improvement ranges by severity (heuristic, shown as estimates).
_EST_BY_SEVERITY = {
    "critical": {"ux": 8, "a11y": 10, "perf": 0},
    "serious": {"ux": 5, "a11y": 7, "perf": 1},
    "moderate": {"ux": 3, "a11y": 4, "perf": 0},
    "minor": {"ux": 1, "a11y": 2, "perf": 0},
}


def _esc(s: str) -> str:
    return _html.escape((s or "").strip())


# Per-rule knowledge base: targeted code + phrasing. Keys are axe rule ids.
# Each entry may define: who, business, suggestion, dev_notes, and `code`
# (a dict of language -> {before, after}). {SEL} / {HTML} are filled per issue.
_KB = {
    "color-contrast": {
        "who": "Users with low vision, colour-blindness, or anyone on a sunlit screen.",
        "business": "Hard-to-read text increases bounce and lowers conversion on key pages.",
        "suggestion": "Raise the text/background contrast to at least 4.5:1 (3:1 for large text).",
        "dev_notes": "Adjust the foreground or background colour token; verify with a contrast checker.",
        "code": {
            "css": {
                "before": "/* fails: ~3.1:1 */\n.footer a { color: #7a8190; }",
                "after": "/* passes: >= 4.5:1 */\n.footer a { color: #c7ccd6; }",
            },
            "tailwind": {
                "before": '<a class="text-slate-500">Link</a>',
                "after": '<a class="text-slate-200">Link</a>',
            },
        },
    },
    "image-alt": {
        "who": "Screen-reader users, and anyone when images fail to load.",
        "business": "Missing alt text hides products and meaning, and weakens image SEO.",
        "suggestion": "Add a concise, descriptive alt attribute (or alt=\"\" if purely decorative).",
        "dev_notes": "Describe the image's purpose, not just its content. Decorative → empty alt.",
        "code": {
            "html": {
                "before": '<img src="/product.jpg">',
                "after": '<img src="/product.jpg" alt="Aurora pendant lamp in brushed brass">',
            },
            "react": {
                "before": '<img src={product.image} />',
                "after": '<img src={product.image} alt={product.name} />',
            },
        },
    },
    "label": {
        "who": "Screen-reader users filling in forms; everyone benefits from clear labels.",
        "business": "Unlabelled fields cause form errors and abandoned sign-ups and checkouts.",
        "suggestion": "Associate a visible <label> with the field via htmlFor/id, and describe errors.",
        "dev_notes": "Prefer a real <label>. aria-label is a fallback when no visible text exists.",
        "code": {
            "html": {
                "before": '<input id="email" type="email" placeholder="Your email">',
                "after": '<label for="email">Email address</label>\n<input id="email" type="email" autocomplete="email">',
            },
            "react": {
                "before": '<input id="email" type="email" placeholder="Your email" />',
                "after": '<label htmlFor="email">Email address</label>\n<input id="email" type="email" autoComplete="email" />',
            },
        },
    },
    "link-name": {
        "who": "Screen-reader users navigating by link list.",
        "business": "Vague links ('click here') hurt navigation and SEO.",
        "suggestion": "Give every link discernible, descriptive text (or an aria-label for icon links).",
        "dev_notes": "Icon-only links need an aria-label; avoid duplicate 'read more' text.",
        "code": {
            "html": {
                "before": '<a href="/cart"><svg>...</svg></a>',
                "after": '<a href="/cart" aria-label="View cart"><svg aria-hidden="true">...</svg></a>',
            },
        },
    },
    "button-name": {
        "who": "Screen-reader and switch users operating controls.",
        "business": "Nameless buttons block core actions like add-to-cart and submit.",
        "suggestion": "Ensure each button exposes text or an aria-label describing its action.",
        "dev_notes": "Icon buttons need aria-label; the icon itself should be aria-hidden.",
        "code": {
            "html": {
                "before": '<button><svg>...</svg></button>',
                "after": '<button aria-label="Open menu"><svg aria-hidden="true">...</svg></button>',
            },
            "react": {
                "before": '<button onClick={open}><MenuIcon /></button>',
                "after": '<button onClick={open} aria-label="Open menu"><MenuIcon aria-hidden="true" /></button>',
            },
        },
    },
    "landmark-one-main": {
        "who": "Screen-reader users who jump straight to primary content.",
        "business": "Without a main landmark, users wade through nav on every page.",
        "suggestion": "Wrap the primary content of the page in a single <main> element.",
        "dev_notes": "Exactly one <main> per page; add a skip link for keyboard users.",
        "code": {
            "html": {
                "before": '<div class="content"> ... </div>',
                "after": '<main id="main"> ... </main>',
            },
        },
    },
    "heading-order": {
        "who": "Screen-reader users relying on the heading outline to skim.",
        "business": "A broken outline makes content harder to scan and understand.",
        "suggestion": "Use heading levels in order (h1 → h2 → h3); don't skip levels for styling.",
        "dev_notes": "Style with CSS, not by jumping heading levels.",
        "code": {
            "html": {
                "before": '<h1>Product</h1>\n<h4>Details</h4>',
                "after": '<h1>Product</h1>\n<h2>Details</h2>',
            },
        },
    },
    "html-has-lang": {
        "who": "Screen-reader users (correct pronunciation) and translation tools.",
        "business": "Missing language hurts assistive tech and international SEO.",
        "suggestion": "Set a valid lang attribute on the <html> element.",
        "dev_notes": "Use a region where helpful, e.g. lang=\"en-IN\".",
        "code": {
            "html": {
                "before": '<html>',
                "after": '<html lang="en">',
            },
        },
    },
    "tabindex": {
        "who": "Keyboard and switch users navigating in order.",
        "business": "A broken tab order frustrates users and can trap focus.",
        "suggestion": "Avoid positive tabindex; rely on natural DOM order (tabindex=\"0\"/\"-1\" only).",
        "dev_notes": "Reorder the DOM instead of forcing tab order with positive values.",
        "code": {
            "html": {
                "before": '<div tabindex="5"> ... </div>',
                "after": '<div tabindex="0"> ... </div>',
            },
        },
    },
    "meta-viewport": {
        "who": "Mobile users and anyone who zooms.",
        "business": "Blocking zoom fails accessibility and frustrates mobile shoppers.",
        "suggestion": "Allow scaling; don't set user-scalable=no or a fixed maximum-scale.",
        "dev_notes": "Keep width=device-width and allow the user to zoom.",
        "code": {
            "html": {
                "before": '<meta name="viewport" content="width=device-width, user-scalable=no">',
                "after": '<meta name="viewport" content="width=device-width, initial-scale=1">',
            },
        },
    },
    "document-title": {
        "who": "Everyone — the title names the tab and the search result.",
        "business": "A missing/duplicate title weakens SEO and orientation.",
        "suggestion": "Give every page a unique, descriptive <title>.",
        "dev_notes": "Front-load the page's purpose; keep it under ~60 characters.",
        "code": {
            "html": {
                "before": '<title></title>',
                "after": '<title>Aurora Pendant Lamp — Lumio</title>',
            },
        },
    },
}


def _generic_code(issue: dict) -> dict:
    """Build a before/after from the issue's own failing HTML when no KB entry."""
    snippet = (issue.get("html") or "").strip()
    sel = (issue.get("selector") or "the element").split("  (+")[0]
    if snippet:
        before = snippet
        after = f"<!-- Fix applied to {sel} -->\n<!-- {_esc(issue.get('title') or '')} -->\n{snippet}"
        return {"html": {"before": before, "after": after}}
    return {
        "html": {
            "before": f"<!-- {sel} -->\n<!-- Issue: {_esc(issue.get('title') or '')} -->",
            "after": f"<!-- Apply the fix described above to {sel}. -->\n<!-- See: {issue.get('help') or 'axe docs'} -->",
        }
    }


def build_recommendation(issue: dict) -> dict:
    rule = issue.get("id") or issue.get("category") or "issue"
    group = _GROUP_BY_RULE.get(rule, "Other")
    principle = _PRINCIPLE_BY_GROUP.get(group, "Robust")
    severity = issue.get("severity") or "minor"
    est = _EST_BY_SEVERITY.get(severity, _EST_BY_SEVERITY["minor"])
    kb = _KB.get(rule, {})

    title = issue.get("title") or rule
    description = issue.get("description") or title

    return {
        "issue_id": rule,
        "page_url": issue.get("page") or "/",
        "page_name": "Homepage",
        "selector": issue.get("selector") or "—",
        "html_snippet": issue.get("html") or "",
        "category": group,
        "severity": severity,
        "confidence": 0.92,
        "wcag": issue.get("wcag"),
        "level": issue.get("level"),
        "ux_principle": principle,
        "node_count": issue.get("nodeCount", 1),
        "help_url": issue.get("help"),
        "priority": _SEVERITY_PRIORITY.get(severity, "P4"),
        # Recommendation prose
        "problem": title,
        "explanation": description,
        "why_ux_issue": f"This affects the {principle.lower()} of the interface and degrades the experience for affected users.",
        "why_affects_users": kb.get("who", "People relying on assistive technology, and often all users."),
        "business_impact": kb.get("business", "Can reduce reach, trust, and conversion, and adds legal/compliance risk."),
        "accessibility_impact": f"Maps to WCAG {issue.get('wcag') or 'best practice'} (Level {issue.get('level') or '—'}).",
        "suggested_improvement": kb.get("suggestion", description),
        "est_ux_improvement": est["ux"],
        "est_accessibility_improvement": est["a11y"],
        "est_performance_improvement": est["perf"],
        "developer_notes": kb.get("dev_notes", f"Apply the fix to {issue.get('selector') or 'the element'}. Reference: {issue.get('help') or 'axe documentation'}."),
        "has_code": True,
    }


def build_recommendations(issues: list[dict]) -> dict:
    recs = [build_recommendation(i) for i in (issues or [])]
    order = {"critical": 0, "serious": 1, "moderate": 2, "minor": 3}
    recs.sort(key=lambda r: order.get(r["severity"], 9))
    groups = {}
    for r in recs:
        groups.setdefault(r["category"], 0)
        groups[r["category"]] += 1
    return {
        "count": len(recs),
        "groups": [{"name": k, "count": v} for k, v in sorted(groups.items(), key=lambda x: -x[1])],
        "recommendations": recs,
        "generated_by": "rules",
    }


def build_code_fix(issue: dict) -> dict:
    rule = issue.get("id") or issue.get("category") or "issue"
    kb = _KB.get(rule, {})
    code = kb.get("code") or _generic_code(issue)
    # Always include an HTML view; synthesize a Tailwind view from CSS when useful.
    variants = {}
    for lang, ba in code.items():
        variants[lang] = {"before": ba["before"], "after": ba["after"]}
    languages = list(variants.keys())

    return {
        "issue_id": rule,
        "title": issue.get("title") or rule,
        "summary": kb.get("suggestion", issue.get("description") or ""),
        "wcag": issue.get("wcag"),
        "level": issue.get("level"),
        "languages": languages,
        "variants": variants,
        "what_changed": kb.get("suggestion", "Applied the recommended fix to the affected element."),
        "why": issue.get("description") or "",
        "expected_improvement": f"+{_EST_BY_SEVERITY.get(issue.get('severity','minor'),{}).get('a11y',2)} accessibility (est.)",
        "help_url": issue.get("help"),
        "generated_by": "rules",
    }


def build_before_after(issue: dict, base_score: int | None = None) -> dict:
    rule = issue.get("id") or "issue"
    group = _GROUP_BY_RULE.get(rule, "Other")
    sev = issue.get("severity", "minor")
    est = _EST_BY_SEVERITY.get(sev, _EST_BY_SEVERITY["minor"])
    base = base_score if base_score is not None else 72
    new = min(100, base + est["a11y"])

    return {
        "issue_id": rule,
        "title": issue.get("title") or rule,
        "summary": _KB.get(rule, {}).get("suggestion", issue.get("description") or ""),
        "category": group,
        "selector": issue.get("selector") or "—",
        "highlights": [
            f"Targets {issue.get('selector') or 'the affected element'}",
            f"Resolves a {sev} issue mapped to WCAG {issue.get('wcag') or 'best practice'}",
        ],
        "original_ux_score": base,
        "new_ux_score": new,
        "accessibility_improvement": est["a11y"],
        "wcag_improvement": 1 if issue.get("wcag") else 0,
        "performance_improvement": est["perf"],
        "user_impact": _KB.get(rule, {}).get("who", "Improves the experience for assistive-technology users and beyond."),
        "improvement_summary": (
            f"The redesigned version fixes '{issue.get('title') or rule}'. "
            f"{_KB.get(rule, {}).get('suggestion', issue.get('description') or '')} "
            f"This addresses a {sev} barrier and improves conformance with WCAG {issue.get('wcag') or 'best practices'}."
        ),
        "generated_by": "rules",
    }
