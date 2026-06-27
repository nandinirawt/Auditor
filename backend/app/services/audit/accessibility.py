"""Real accessibility analysis with axe-core.

Inject the vendored axe-core build into the live page (the one we screenshot),
run it on the homepage, then turn the raw results into findings, an
accessibility score, a WCAG mapping and snapshot counts. axe.min.js ships in
./vendor, so no extra install is needed.
"""
from __future__ import annotations

import re
from pathlib import Path

_AXE_PATH = Path(__file__).resolve().parent / "vendor" / "axe.min.js"

_IMPACT_WEIGHT = {"critical": 10, "serious": 7, "moderate": 3, "minor": 1}
_PRINCIPLE = {"1": "Perceivable", "2": "Operable", "3": "Understandable", "4": "Robust"}

_CONTRAST_RULES = {"color-contrast", "color-contrast-enhanced", "link-in-text-block"}
_ALT_RULES = {"image-alt", "input-image-alt", "area-alt", "svg-img-alt", "object-alt", "role-img-alt"}
_KEYBOARD_RULES = {
    "focusable-content", "focus-order-semantics", "tabindex", "scrollable-region-focusable",
    "interactive-supports-focus", "nested-interactive", "focus-visible",
}

_SC_NAMES = {
    "1.1.1": "Non-text Content", "1.3.1": "Info and Relationships", "1.3.2": "Meaningful Sequence",
    "1.4.1": "Use of Color", "1.4.3": "Contrast (Minimum)", "1.4.4": "Resize Text",
    "1.4.6": "Contrast (Enhanced)", "1.4.11": "Non-text Contrast", "1.4.12": "Text Spacing",
    "2.1.1": "Keyboard", "2.1.2": "No Keyboard Trap", "2.4.1": "Bypass Blocks",
    "2.4.2": "Page Titled", "2.4.4": "Link Purpose (In Context)", "2.4.6": "Headings and Labels",
    "2.4.7": "Focus Visible", "2.5.3": "Label in Name", "3.1.1": "Language of Page",
    "3.2.2": "On Input", "3.3.1": "Error Identification", "3.3.2": "Labels or Instructions",
    "4.1.1": "Parsing", "4.1.2": "Name, Role, Value", "4.1.3": "Status Messages",
}

_AXE_RUN_JS = """
async () => {
  const r = await window.axe.run(document, { resultTypes: ['violations', 'passes', 'incomplete'] });
  const trimV = (v) => ({
    id: v.id, impact: v.impact, description: v.description, help: v.help,
    helpUrl: v.helpUrl, tags: v.tags,
    nodes: (v.nodes || []).slice(0, 5).map(n => ({
      target: n.target, html: (n.html || '').slice(0, 220)
    })),
    nodeCount: (v.nodes || []).length,
  });
  return {
    violations: r.violations.map(trimV),
    passes: r.passes.map(p => ({ id: p.id, tags: p.tags })),
    incomplete: r.incomplete.map(i => ({ id: i.id })),
  };
};
"""


def _load_axe() -> str:
    return _AXE_PATH.read_text(encoding="utf-8")


async def run_axe(page) -> dict:
    axe_js = _load_axe()
    try:
        await page.add_script_tag(content=axe_js)
    except Exception:
        await page.evaluate("() => { " + axe_js + "\n; return true; }")
    return await page.evaluate(_AXE_RUN_JS)


def _criteria_from_tags(tags):
    out = []
    for t in tags or []:
        m = re.fullmatch(r"wcag(\d)(\d)(\d{1,2})", t)
        if m:
            out.append(f"{m.group(1)}.{m.group(2)}.{int(m.group(3))}")
    return out


def _level_from_tags(tags):
    tagset = set(tags or [])
    if any(t.endswith("aaa") for t in tagset):
        return "AAA"
    if any(t.endswith("aa") for t in tagset):
        return "AA"
    return "A"


def map_results(raw, page_path="/"):
    violations = raw.get("violations", []) or []
    passes = raw.get("passes", []) or []
    incomplete = raw.get("incomplete", []) or []

    counts = {"critical": 0, "serious": 0, "moderate": 0, "minor": 0}
    findings = []
    contrast_n = alt_n = keyboard_n = 0

    for v in violations:
        impact = v.get("impact") or "minor"
        if impact not in counts:
            impact = "minor"
        counts[impact] += 1

        crits = _criteria_from_tags(v.get("tags", []))
        primary_sc = crits[0] if crits else None
        level = _level_from_tags(v.get("tags", []))
        nodes = v.get("nodes", [])
        first_target = ", ".join(nodes[0]["target"]) if nodes and nodes[0].get("target") else "—"
        node_count = v.get("nodeCount", len(nodes))

        findings.append({
            "id": v.get("id"),
            "severity": impact,
            "source": "axe",
            "category": v.get("id"),
            "title": v.get("help") or v.get("description") or v.get("id"),
            "description": v.get("description") or v.get("help") or "",
            "selector": first_target + (f"  (+{node_count - 1} more)" if node_count > 1 else ""),
            "wcag": primary_sc,
            "level": level if primary_sc else None,
            "page": page_path,
            "help": v.get("helpUrl"),
            "nodeCount": node_count,
        })

        rid = v.get("id")
        if rid in _CONTRAST_RULES:
            contrast_n += node_count
        if rid in _ALT_RULES:
            alt_n += node_count
        if rid in _KEYBOARD_RULES:
            keyboard_n += node_count

    order = {"critical": 0, "serious": 1, "moderate": 2, "minor": 3}
    findings.sort(key=lambda f: order.get(f["severity"], 9))

    penalty = sum(_IMPACT_WEIGHT.get(v.get("impact") or "minor", 1) for v in violations)
    score = max(0, 100 - penalty)

    failed_map = {}
    for v in violations:
        level = _level_from_tags(v.get("tags", []))
        for sc in _criteria_from_tags(v.get("tags", [])):
            entry = failed_map.setdefault(sc, {"id": sc, "level": level, "issues": 0})
            entry["issues"] += v.get("nodeCount", 1)

    passed_set = {}
    for p in passes:
        level = _level_from_tags(p.get("tags", []))
        for sc in _criteria_from_tags(p.get("tags", [])):
            if sc not in failed_map:
                passed_set.setdefault(sc, level)

    def principle_of(sc):
        return _PRINCIPLE.get(sc.split(".")[0], "Other")

    principles = {}
    for key, label in _PRINCIPLE.items():
        principles[label] = {"key": label.lower(), "label": label, "passed": 0, "total": 0}
    for sc in passed_set:
        principles[principle_of(sc)]["passed"] += 1
        principles[principle_of(sc)]["total"] += 1
    for sc in failed_map:
        principles[principle_of(sc)]["total"] += 1

    for label, data in principles.items():
        failed_here = data["total"] - data["passed"]
        data["note"] = (
            f"{failed_here} failing, {data['passed']} passing" if data["total"] else "No applicable checks"
        )

    criteria = []
    for sc, info in sorted(failed_map.items()):
        criteria.append({
            "id": sc, "name": _SC_NAMES.get(sc, f"Success criterion {sc}"),
            "level": info["level"], "principle": principle_of(sc),
            "status": "fail", "issues": info["issues"],
        })
    for sc, level in sorted(passed_set.items()):
        criteria.append({
            "id": sc, "name": _SC_NAMES.get(sc, f"Success criterion {sc}"),
            "level": level, "principle": principle_of(sc),
            "status": "pass", "issues": 0,
        })
    criteria.sort(key=lambda c: tuple(int(x) for x in c["id"].split(".")))

    total_passed = len(passed_set)
    total_failed = len(failed_map)
    compliance = round(100 * total_passed / (total_passed + total_failed)) if (total_passed + total_failed) else 100

    most_violated = None
    worst = -1
    for label, data in principles.items():
        failed_here = data["total"] - data["passed"]
        if failed_here > worst:
            worst = failed_here
            most_violated = label if failed_here > 0 else None

    wcag = {
        "level": "AA",
        "compliance": compliance,
        "principles": list(principles.values()),
        "criteria": criteria,
        "passed": total_passed,
        "failed": total_failed,
        "warnings": len(incomplete),
        "criticalViolations": counts["critical"],
        "mostViolated": most_violated or "None",
    }

    snapshot = {
        "score": score,
        "critical": counts["critical"],
        "contrast": contrast_n,
        "altText": alt_n,
        "keyboard": keyboard_n,
        "topRecommendation": findings[0]["title"] if findings else "No accessibility violations found.",
    }

    return {
        "score": score,
        "counts": counts,
        "findings": findings,
        "wcag": wcag,
        "snapshot": snapshot,
        "stats": {
            "violations": len(violations),
            "passes": len(passes),
            "incomplete": len(incomplete),
            "rulesRun": len(violations) + len(passes) + len(incomplete),
        },
    }
