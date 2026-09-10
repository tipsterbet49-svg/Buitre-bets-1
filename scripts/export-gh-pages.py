#!/usr/bin/env python3
"""Bake a static GitHub Pages snapshot of the current BSD board."""
from __future__ import annotations

import json
import re
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone
from html import escape
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path("/workspace")
TOKEN = "0f5fef6dd4e24408e6a468ea76656d13300ad804"
BASE = "https://sports.bzzoiro.com/api/v2"
MIN_ODDS = 1.5
ALLOWED = {
    1: ("Premier League", "eng"),
    2: ("Liga Portugal", "por"),
    3: ("La Liga", "esp"),
    4: ("Serie A", "ita"),
    5: ("Bundesliga", "ger"),
    6: ("Ligue 1", "fra"),
    7: ("Champions", "ucl"),
    8: ("Europa League", "europa"),
    9: ("Brasileirão", "bra"),
    32: ("Libertadores", "lib"),
    33: ("Sudamericana", "suda"),
    85: ("Liga Profesional", "arg"),
}
LIVE = {
    "notstarted",
    "1st_half",
    "2nd_half",
    "halftime",
    "ht",
    "inprogress",
    "extra_time",
    "penalties",
}


def bsd(path: str):
    req = Request(BASE + path, headers={"Authorization": f"Token {TOKEN}"})
    with urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def art_today() -> str:
    now = datetime.now(timezone.utc) + timedelta(hours=-3)
    return now.strftime("%Y-%m-%d")


def add_days(ymd: str, n: int) -> str:
    y, m, d = map(int, ymd.split("-"))
    dt = datetime(y, m, d) + timedelta(days=n)
    return dt.strftime("%Y-%m-%d")


def short_team(name: str) -> str:
    return re.sub(r"FC |CF |SSC |SK |1\. FC ", "", name).strip()


def pct(n: float) -> float:
    return round(n * 1000) / 10


def ev_of(p: float, odds: float) -> float:
    return p * odds - 1


def conf_of(model: float, ev: float) -> int:
    base = model * 100
    bump = 6 if ev > 0.04 else 3 if ev > 0 else 0
    return max(52, min(92, round(base + bump)))


def parse_crest_ids() -> dict[str, int]:
    text = (ROOT / "src/lib/crests.ts").read_text()
    ids: dict[str, int] = {}
    inside = False
    for line in text.splitlines():
        if line.strip().startswith("const IDS"):
            inside = True
            continue
        if inside and line.strip().startswith("};"):
            break
        m = re.match(r'\s*(?:([a-z0-9]+)|"([^"]+)")\s*:\s*(\d+)', line)
        if m:
            ids[m.group(1) or m.group(2)] = int(m.group(3))
    return ids


def norm_team(name: str) -> str:
    s = unicodedata.normalize("NFD", name)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.replace("ø", "o").replace("Ø", "o").replace("æ", "ae").replace("Æ", "ae")
    s = s.replace("å", "a").replace("Å", "a")
    s = s.lower()
    s = s.replace("'", "").replace("’", "").replace("&", " and ")
    s = re.sub(r"[^a-z0-9]+", " ", s)
    s = re.sub(r"\b(fc|cf|ssc|sk|ac|as|sc|cd|ud|rc|rcd|afc|cfc|bk|fk|if|the|club|1)\b", " ", s)
    return re.sub(r"\s+", " ", s).strip()


CREST_IDS = parse_crest_ids()


def crest_url(name: str) -> str | None:
    k = norm_team(name)
    tid = CREST_IDS.get(k)
    if tid:
        return f"https://media.api-sports.io/football/teams/{tid}.png"
    return None


def build_pick(pred: dict, odds: dict | None, extra: dict | None) -> dict | None:
    if not odds:
        return None
    e = pred["event"]
    if e["status"] not in LIVE:
        return None
    league = ALLOWED.get(e["league_id"])
    if not league:
        return None
    m = pred["markets"]
    pH = m["match_result"]["prob_home"] / 100
    pD = m["match_result"]["prob_draw"] / 100
    pA = m["match_result"]["prob_away"] / 100
    btts = m["btts"]["prob_yes"] / 100
    ou = m["over_under"]
    xgH = m["expected_goals"]["home"]
    xgA = m["expected_goals"]["away"]
    xg = xgH + xgA
    home = short_team(e["home_team"])
    away = short_team(e["away_team"])
    raw = [
        (f"Gana {home}", "1x2", pH, odds.get("home_win"), 0),
        ("Empate", "1x2", pD, odds.get("draw"), 0),
        (f"Gana {away}", "1x2", pA, odds.get("away_win"), 0),
        ("Ambos marcan", "btts", btts, odds.get("btts_yes"), 0),
        ("BTTS No", "btts", 1 - btts, odds.get("btts_no"), 0),
        ("Más de 1.5", "ou", ou["prob_over_15"] / 100, odds.get("over_15_goals"), 0.01),
        ("Menos de 1.5", "ou", 1 - ou["prob_over_15"] / 100, odds.get("under_15_goals"), 0),
        ("Más de 2.5", "ou", ou["prob_over_25"] / 100, odds.get("over_25_goals"), 0.05),
        ("Menos de 2.5", "ou", 1 - ou["prob_over_25"] / 100, odds.get("under_25_goals"), 0),
        ("Más de 3.5", "ou", ou["prob_over_35"] / 100, odds.get("over_35_goals"), 0.08 if xg < 3.1 else 0),
        ("Menos de 3.5", "ou", 1 - ou["prob_over_35"] / 100, odds.get("under_35_goals"), 0),
    ]
    cands = []
    for market, market_key, p, od, pen in raw:
        if od is None or od < MIN_ODDS or p < 0.38:
            continue
        ev = ev_of(p, od)
        cands.append(
            {
                "market": market,
                "marketKey": market_key,
                "p": p,
                "odds": od,
                "ev": ev,
                "score": ev - pen + (p - 0.45) * 0.15,
            }
        )
    if not cands:
        return None
    cands.sort(key=lambda c: c["score"], reverse=True)
    best = cands[0]
    rejected_bits = []
    if odds.get("home_win") is not None and odds["home_win"] < MIN_ODDS:
        rejected_bits.append(f"{home} @ {odds['home_win']:.2f}")
    if odds.get("away_win") is not None and odds["away_win"] < MIN_ODDS:
        rejected_bits.append(f"{away} @ {odds['away_win']:.2f}")
    if odds.get("over_25_goals") is not None and odds["over_25_goals"] < MIN_ODDS:
        rejected_bits.append(f"Over 2.5 @ {odds['over_25_goals']:.2f}")
    if best["market"] != "Más de 2.5" and (odds.get("over_25_goals") or 99) >= MIN_ODDS:
        rejected_bits.append("Over 2.5 no se publica por default")
    implied = 1 / best["odds"]
    gap = best["p"] - implied
    if gap > 0.03:
        value = "El modelo está por encima de la implícita: hay valor."
    elif gap > 0:
        value = "Edge chico, pero del lado correcto del precio."
    else:
        value = "El libro está un poco más agresivo que el modelo; se publica porque es el mercado ≥ 1.50 más limpio."
    scoreline = m["score"]["most_likely"]
    if best["market"].startswith("Gana"):
        analysis = (
            f"{best['market']} @ {best['odds']:.2f}. 1X2 del modelo {pct(pH)}-{pct(pD)}-{pct(pA)}. "
            f"Marcador tipo {scoreline}. {value}"
        )
    elif best["market"].startswith("Ambos") or best["market"] == "BTTS No":
        analysis = f"{best['market']} @ {best['odds']:.2f} con {pct(best['p'])}% del modelo (xG {xg:.2f}, {scoreline}). {value}"
    else:
        analysis = (
            f"{best['market']} @ {best['odds']:.2f}. Media de goles {xg:.2f} y {scoreline} como línea base. {value}"
        )
    bullets = [
        f"Modelo BSD {pred['model']['version']}: {home} {pct(pH)}% · Empate {pct(pD)}% · {away} {pct(pA)}%",
        f"xG {xgH:.2f} – {xgA:.2f} (media {xg:.2f}) · marcador más probable {scoreline}",
        f"BTTS {pct(btts)}% · Over 2.5 {pct(ou['prob_over_25']/100)}% · Over 3.5 {pct(ou['prob_over_35']/100)}%",
    ]
    h2h = (extra or {}).get("h2h")
    if h2h and (h2h.get("total_matches") or 0) >= 3:
        bullets.append(
            f"H2H {h2h['total_matches']} pj · media {float(h2h.get('avg_total_goals') or 0):.2f} goles · "
            f"{h2h.get('home_wins')}-{h2h.get('draws')}-{h2h.get('away_wins')}"
        )
    rejected = (
        f"Se descarta {' · '.join(rejected_bits[:3])} (regla cuota mínima 1.50)."
        if rejected_bits
        else "Sin favorito corto: el mercado publicado ya cumple 1.50."
    )
    return {
        "id": f"bsd-{e['id']}",
        "league": league[0],
        "leagueKey": league[1],
        "kickoff": e["event_date"],
        "status": e["status"],
        "home": home,
        "away": away,
        "market": best["market"],
        "marketKey": best["marketKey"],
        "odds": round(best["odds"] * 100) / 100,
        "impliedPct": pct(implied),
        "modelPct": pct(best["p"]),
        "evPct": round(best["ev"] * 1000) / 10,
        "conf": conf_of(pred["model"]["confidence"], best["ev"]),
        "pH": pH,
        "pD": pD,
        "pA": pA,
        "bullets": bullets,
        "analysis": analysis,
        "rejected": rejected,
        "homeCrest": crest_url(e["home_team"]) or crest_url(home),
        "awayCrest": crest_url(e["away_team"]) or crest_url(away),
        "homeScore": (extra or {}).get("homeScore"),
        "awayScore": (extra or {}).get("awayScore"),
        "minute": (extra or {}).get("minute"),
    }


def load_picks() -> list[dict]:
    frm = art_today()
    to = add_days(frm, 3)
    preds: list[dict] = []
    offset = 0
    for _ in range(4):
        page = bsd(f"/predictions/?date_from={frm}&date_to={to}&limit=100&offset={offset}")
        preds.extend(page.get("results") or [])
        if not page.get("next"):
            break
        offset += 100
    extras: dict[int, dict] = {}
    try:
        evs = bsd(f"/events/?date_from={frm}&date_to={to}&limit=200")
        for ev in evs.get("results") or []:
            extras[ev["id"]] = {
                "h2h": ev.get("head_to_head"),
                "homeScore": ev.get("home_score"),
                "awayScore": ev.get("away_score"),
                "minute": ev.get("current_minute"),
            }
    except Exception:
        pass
    filtered = [p for p in preds if p["event"]["league_id"] in ALLOWED]

    def odds_for(event_id: int):
        try:
            row = bsd(f"/events/{event_id}/odds/")
            return row.get("odds")
        except Exception:
            return None

    odds_map: dict[int, dict | None] = {}
    with ThreadPoolExecutor(max_workers=8) as pool:
        futs = {pool.submit(odds_for, p["event"]["id"]): p["event"]["id"] for p in filtered}
        for fut in as_completed(futs):
            odds_map[futs[fut]] = fut.result()

    picks = []
    for pred in filtered:
        built = build_pick(pred, odds_map.get(pred["event"]["id"]), extras.get(pred["event"]["id"]))
        if built:
            picks.append(built)
    picks.sort(key=lambda p: (p["kickoff"], -p["evPct"]))
    return picks


def write_site(picks: list[dict]) -> None:
    payload = json.dumps(picks, ensure_ascii=False)
    generated = json.dumps(datetime.now(timezone.utc).isoformat())
    html = (ROOT / "scripts/gh-pages-template.html").read_text()
    html = html.replace("__PICKS__", payload).replace("__GENERATED__", generated)
    (ROOT / "index.html").write_text(html)
    (ROOT / "docs" / "index.html").write_text(html)
    (ROOT / "app.js").write_text("/* served via index.html */\n")
    (ROOT / "docs" / "app.js").write_text("/* served via index.html */\n")
    four = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta http-equiv="refresh" content="0;url=/Buitre-bets-1/"/>
<title>Predicciones Pro</title>
<script>location.replace('/Buitre-bets-1/');</script>
</head>
<body style="font-family:Inter,system-ui;background:#0f0f0f;color:#e8e8e8;padding:2rem">
<p>Redirigiendo a <a href="/Buitre-bets-1/" style="color:#00c853">Predicciones Pro</a>…</p>
</body>
</html>
"""
    (ROOT / "404.html").write_text(four)
    (ROOT / "docs" / "404.html").write_text(four)
    (ROOT / "README.md").write_text(
        """# Predicciones Pro

Sitio público (GitHub Pages):

https://tipsterbet49-svg.github.io/Buitre-bets-1/

Esa es la URL de la página. El código fuente está en este mismo repo.

Si ves 404:
1. Settings → Pages
2. Source: Deploy from a branch
3. Branch: main, folder: / (root)
4. Save y esperá un minuto
"""
    )
    print(f"wrote {len(picks)} picks")


def main() -> None:
    picks = load_picks()
    write_site(picks)
    for p in picks[:8]:
        print(f"{p['league']:16} {p['home']} vs {p['away']}: {p['market']} @{p['odds']} EV{p['evPct']:+}")


if __name__ == "__main__":
    main()

