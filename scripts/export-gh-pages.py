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


HTML = r"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Predicciones Pro</title>
<meta name="theme-color" content="#0f0f0f"/>
<link rel="icon" href="logo-canal.jpeg"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://media.api-sports.io"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
<style>
:root{--bg:#0f0f0f;--nav:#060d06;--card:#161616;--fg:#e8e8e8;--muted:#9e9e9e;--primary:#00c853;--primary-fg:#04140a;--accent:#ffd600;--border:#2a2a2a;--danger:#ef5350;--tg:#2aabee}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
button{font-family:inherit;cursor:pointer;color:inherit}
a{color:inherit;text-decoration:none}
.wrap{max-width:72rem;margin:0 auto;padding:0 1rem}
.nav{position:sticky;top:0;z-index:20;background:var(--nav);box-shadow:0 8px 32px rgba(0,0,0,.6)}
.nav::after{content:"";display:block;height:2px;background:linear-gradient(90deg,transparent,var(--primary) 40%,var(--primary) 60%,transparent);opacity:.65}
.nav-in{max-width:72rem;margin:0 auto;height:64px;padding:0 1rem;display:flex;align-items:center;justify-content:space-between;gap:12px}
.brand{display:flex;align-items:center;gap:10px;font-weight:900}
.brand img{width:40px;height:40px;border-radius:12px;object-fit:cover;border:1px solid rgba(0,200,83,.35)}
.brand b{color:var(--primary)}
.tg{background:var(--primary);color:var(--primary-fg);border:0;border-radius:999px;padding:8px 16px;font-size:12px;font-weight:800}
.hero{display:flex;flex-direction:column;align-items:center;gap:2rem;padding:2rem 0 1.5rem}
@media(min-width:768px){.hero{flex-direction:row;justify-content:space-between}}
.live{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:12px}
.dot{width:8px;height:8px;border-radius:99px;background:var(--primary);box-shadow:0 0 0 0 rgba(0,200,83,.55);animation:pulse 1.6s ease-out infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(0,200,83,.55)}70%{box-shadow:0 0 0 7px transparent}}
h1{font-size:clamp(2rem,5vw,3rem);font-weight:900;letter-spacing:-.03em}
.sub{margin-top:8px;color:var(--muted);font-weight:500}
.stats{margin-top:1.5rem;max-width:28rem;display:flex;overflow:hidden;border-radius:12px;background:var(--card);box-shadow:0 0 0 1px rgba(255,255,255,.08)}
.stat{flex:1;text-align:center;padding:14px 8px;border-right:1px solid var(--border)}
.stat:last-child{border-right:0}
.stat strong{display:block;font-size:1.25rem;font-weight:800}
.stat small{display:block;margin-top:4px;font-size:11px;color:var(--muted)}
.cta{display:inline-flex;margin-top:1.5rem;min-height:44px;align-items:center;background:var(--primary);color:var(--primary-fg);border-radius:999px;padding:0 20px;font-size:14px;font-weight:800}
.mascot{width:208px;height:208px;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(0,200,83,.28),0 0 0 2px rgba(0,200,83,.2);flex-shrink:0}
@media(min-width:768px){.mascot{width:240px;height:240px;order:2}.hero-copy{order:1;flex:1}}
.mascot img{width:100%;height:100%;object-fit:cover;object-position:top}
.sec{padding:0 0 2.5rem}
.sec h2{font-size:1.5rem;font-weight:700}
.hint{margin-top:4px;font-size:14px;color:var(--muted)}
.filters{display:flex;flex-wrap:wrap;gap:8px;margin-top:1.2rem}
.chip{min-height:44px;border:0;border-radius:999px;padding:0 16px;font-size:14px;font-weight:700;color:var(--muted);background:transparent;box-shadow:0 0 0 1px rgba(255,255,255,.08)}
.chip.on{background:var(--primary);color:var(--primary-fg);box-shadow:none}
.grid{margin-top:1.5rem;display:grid;gap:16px}
@media(min-width:768px){.grid{grid-template-columns:1fr 1fr}}
@media(min-width:1200px){.grid{grid-template-columns:1fr 1fr 1fr}}
.card{background:var(--card);border-radius:12px;padding:16px;box-shadow:0 0 0 1px rgba(255,255,255,.08);text-align:left;width:100%}
.card.max{box-shadow:0 0 0 1px rgba(255,214,0,.4)}
.card:hover{box-shadow:0 0 0 1px rgba(0,200,83,.45)}
.meta{display:flex;justify-content:space-between;gap:8px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted)}
.live-tag{color:var(--danger);flex-shrink:0}
.match{margin-top:12px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px}
.team{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}
.esc{width:48px;height:48px;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,.45))}
.esc-fb{width:48px;height:48px;border-radius:999px;background:#141414;display:flex;align-items:center;justify-content:center;font-weight:900;color:var(--muted);font-size:12px;box-shadow:0 0 0 1px rgba(255,255,255,.08)}
.tname{max-width:100%;font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vs{font-size:11px;font-weight:800;letter-spacing:.08em;color:var(--muted);padding:4px 8px;border-radius:6px;background:var(--bg)}
.score{font-size:20px;font-weight:900;letter-spacing:.04em}
.rec{margin-top:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-radius:12px;padding:10px 12px;background:rgba(255,214,0,.1);box-shadow:0 0 0 1px rgba(255,214,0,.35)}
.rec .mkt{font-weight:800;color:var(--accent);text-align:left}
.cuota{text-align:right}
.cuota small{display:block;font-size:11px;color:var(--muted)}
.cuota b{font-size:20px;font-variant-numeric:tabular-nums}
.foot{margin-top:10px;display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;color:var(--muted)}
.ev{font-weight:700}
.ev.pos{color:var(--primary)}
.maxb{display:inline-block;margin-right:6px;background:var(--accent);color:#04140a;font-size:11px;font-weight:800;padding:2px 6px;border-radius:4px}
.more{display:none;margin-top:12px;padding-top:12px;border-top:1px solid var(--border)}
.card.open .more{display:block}
.nums{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;font-size:12px}
.nums div{background:var(--bg);border-radius:8px;padding:8px}
.nums span{display:block;color:var(--muted)}
.nums b{color:var(--primary)}
.bar{margin-top:10px}
.bar-l{display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:4px}
.bar-g{display:flex;height:6px;overflow:hidden;border-radius:99px;background:var(--bg)}
.bar-g i:first-child{background:var(--primary)}
.bar-g i:nth-child(2){background:var(--muted)}
.bar-g i:last-child{background:rgba(232,232,232,.4)}
.why{margin-top:10px;font-size:14px;line-height:1.55;color:var(--muted)}
.why b{color:var(--fg)}
.bul{margin-top:8px;font-size:12px;color:var(--muted)}
.bul li{margin:4px 0 0 1rem}
.rej{margin-top:10px;padding:10px;border-radius:12px;background:rgba(239,83,80,.08);font-size:12px;color:var(--muted)}
.share{display:block;margin-top:10px;text-align:center;border-radius:12px;padding:10px;background:rgba(42,171,238,.1);color:var(--tg);font-size:12px;font-weight:700}
.empty{padding:4rem 0;text-align:center;color:var(--muted)}
.foot-site{margin-top:3rem;border-top:1px solid var(--border);background:var(--nav);padding:2.5rem 1rem;font-size:14px;color:var(--muted)}
.foot-grid{max-width:72rem;margin:0 auto;display:grid;gap:1.5rem}
@media(min-width:640px){.foot-grid{grid-template-columns:1fr 1fr 1fr}}
.feat{max-width:32rem;margin-bottom:2.5rem}
.feat .card{width:100%}
.stamp{margin-top:1.5rem;font-size:12px;color:var(--muted)}
</style>
</head>
<body>
<header class="nav"><div class="nav-in">
  <a class="brand" href="./"><img src="logo-canal.jpeg" alt=""/><span>Predicciones<b> Pro</b></span></a>
  <a class="tg" href="https://t.me/" target="_blank" rel="noopener">Telegram</a>
</div></header>

<section class="wrap hero">
  <div class="hero-copy">
    <p class="live"><span class="dot"></span> En línea · modelo BSD</p>
    <h1>Predicciones<span style="color:var(--primary)"> Pro</span></h1>
    <p class="sub">Pronósticos de fútbol. Un pick por partido.</p>
    <div class="stats">
      <div class="stat"><strong id="st-hoy">-</strong><small>Picks hoy</small></div>
      <div class="stat"><strong id="st-live">-</strong><small>En vivo</small></div>
      <div class="stat"><strong id="st-total">-</strong><small>Total</small></div>
    </div>
    <a class="cta" href="#picks">Ver picks del día</a>
  </div>
  <div class="mascot"><img src="logo-canal.jpeg" alt="Mascota Predicciones Pro"/></div>
</section>

<div class="wrap">
  <section class="sec feat" id="destacado">
    <h2>Destacado</h2>
    <p class="hint">El de más confianza entre los que todavía no se juegan.</p>
    <div id="feat" style="margin-top:1.2rem"></div>
  </section>

  <section class="sec" id="picks">
    <h2>Picks</h2>
    <p class="hint">Tocá un partido para ver el análisis.</p>
    <div class="filters" id="days">
      <button class="chip on" data-day="hoy" type="button">Hoy</button>
      <button class="chip" data-day="manana" type="button">Mañana</button>
      <button class="chip" data-day="finde" type="button">Finde</button>
      <button class="chip" data-day="all" type="button">Todos</button>
      <button class="chip" data-live="1" type="button">En vivo</button>
      <button class="chip" data-ev="1" type="button">Solo EV+</button>
    </div>
    <div class="grid" id="grid"></div>
    <p class="stamp" id="stamp"></p>
  </section>
</div>

<footer class="foot-site"><div class="foot-grid">
  <div><p style="color:var(--fg);font-weight:900">Predicciones<span style="color:var(--primary)"> Pro</span></p><p style="margin-top:10px">Picks con modelo BSD. Cuota mínima 1.50. Sin montos.</p></div>
  <div><p>Snapshot estático para GitHub Pages. El tablero en vivo corre en el preview.</p></div>
  <div><p>+18 · Educativo · No es consejo financiero. Jugá responsable.</p></div>
</div></footer>
<script>
const PICKS = __PICKS__;
const GENERATED = __GENERATED__;
const TZ = "America/Argentina/Buenos_Aires";
function ymd(iso){return new Date(iso).toLocaleDateString("en-CA",{timeZone:TZ});}
function today(){return new Date().toLocaleDateString("en-CA",{timeZone:TZ});}
function tomorrow(){
  const [y,m,d]=today().split("-").map(Number);
  const dt=new Date(y,m-1,d+1);
  return dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");
}
function weekend(iso){
  const w=new Date(iso).toLocaleDateString("en-US",{timeZone:TZ,weekday:"short"});
  return w==="Sat"||w==="Sun";
}
function bucket(iso){
  const d=ymd(iso);
  if(d===today()) return "hoy";
  if(d===tomorrow()) return "manana";
  return "prox";
}
function clock(iso){
  return new Date(iso).toLocaleString("es-AR",{timeZone:TZ,day:"2-digit",month:"short",hour:"numeric",minute:"2-digit"});
}
function live(p){return p.status && p.status!=="notstarted" && p.status!=="finished";}
function confL(c){return c>=78?"Máxima":c>=72?"Alta":"Media";}
function esc(t){
  t=String(t==null?"":t);
  return t.replace(/&/g,"&"+"amp;").replace(/</g,"&"+"lt;").replace(/>/g,"&"+"gt;").replace(/"/g,"&"+"quot;");
}
function initials(n){return n.split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase();}
function crest(name,src,cls){
  if(src) return '<img class="esc" src="'+esc(src)+'" alt="" onerror="this.outerHTML=this.nextElementSibling.outerHTML"/><span class="esc-fb" style="display:none">'+esc(initials(name))+'</span>';
  return '<span class="esc-fb">'+esc(initials(name))+'</span>';
}
function mid(p){
  if(live(p) && p.homeScore!=null && p.awayScore!=null){
    return '<div class="score">'+p.homeScore+"-"+p.awayScore+"</div>";
  }
  return '<div class="vs">VS</div>';
}
function card(p){
  const when = bucket(p.kickoff)==="hoy"?"Hoy":bucket(p.kickoff)==="manana"?"Mañana":"";
  const time = (when?when+" · ":"")+clock(p.kickoff);
  const liveTag = live(p)?'<span class="live-tag">En vivo'+(p.minute?" "+p.minute+"'":"")+"</span>":"";
  const ev = p.evPct!==0?'<span class="ev '+(p.evPct>0?"pos":"")+'">EV '+(p.evPct>0?"+":"")+p.evPct+"%</span>":"";
  const max = p.conf>=78?'<span class="maxb">Máx</span>':"";
  const share = "https://t.me/share/url?url="+encodeURIComponent(location.href)+"&text="+encodeURIComponent("Predicciones Pro · "+p.league+"\\n"+p.home+" vs "+p.away+"\\n"+p.market+" @ "+p.odds.toFixed(2));
  const bullets = (p.bullets||[]).map(b=>"<li>"+esc(b)+"</li>").join("");
  return '<article class="card '+(p.conf>=78?"max":"")+'" data-id="'+esc(p.id)+'">'
    +'<button type="button" class="tog" style="all:unset;display:block;width:100%;cursor:pointer">'
    +'<div class="meta"><span>'+esc(p.league)+" · "+esc(time)+"</span>"+liveTag+"</div>"
    +'<div class="match">'
    +'<div class="team">'+crest(p.home,p.homeCrest)+'<span class="tname">'+esc(p.home)+"</span></div>"
    +'<div style="text-align:center">'+mid(p)+"</div>"
    +'<div class="team">'+crest(p.away,p.awayCrest)+'<span class="tname">'+esc(p.away)+"</span></div>"
    +"</div>"
    +'<div class="rec"><span class="mkt">'+esc(p.market)+'</span><span class="cuota"><small>cuota</small><b>'+p.odds.toFixed(2)+"</b></span></div>"
    +'<div class="foot"><span>'+max+esc(confL(p.conf))+" "+ev+'</span><span>Ver análisis ▾</span></div>'
    +"</button>"
    +'<div class="more">'
    +'<div class="nums"><div><span>Modelo</span><b>'+p.modelPct+'%</b></div><div><span>Implícita</span><b style="color:var(--fg)">'+p.impliedPct+'%</b></div><div><span>Confianza</span><b style="color:var(--fg)">'+p.conf+"</b></div></div>"
    +'<div class="bar"><div class="bar-l"><span>Local '+Math.round(p.pH*100)+'%</span><span>Empate '+Math.round(p.pD*100)+'%</span><span>Visitante '+Math.round(p.pA*100)+'%</span></div>'
    +'<div class="bar-g"><i style="width:'+(p.pH*100)+'%"></i><i style="width:'+(p.pD*100)+'%"></i><i style="width:'+(p.pA*100)+'%"></i></div></div>'
    +'<ul class="bul">'+bullets+"</ul>"
    +'<p class="why"><b>Por qué este pick. </b>'+esc(p.analysis)+"</p>"
    +'<p class="rej">'+esc(p.rejected)+"</p>"
    +'<a class="share" href="'+share+'" target="_blank" rel="noreferrer">Compartir en Telegram</a>'
    +"</div></article>";
}

let dayF="hoy", liveOnly=false, evOnly=false;
function list(){
  return PICKS.filter(p=>{
    const b=bucket(p.kickoff);
    if(dayF==="hoy" && b!=="hoy") return false;
    if(dayF==="manana" && b!=="manana") return false;
    if(dayF==="finde" && !weekend(p.kickoff)) return false;
    if(liveOnly && !live(p)) return false;
    if(evOnly && p.evPct<=0) return false;
    return true;
  });
}
function featured(){
  const up=PICKS.filter(p=>p.status==="notstarted");
  const pool=up.length?up:PICKS.slice();
  if(!pool.length) return null;
  return pool.slice().sort((a,b)=>b.conf-a.conf)[0];
}
function render(){
  document.getElementById("st-hoy").textContent = PICKS.filter(p=>bucket(p.kickoff)==="hoy").length;
  document.getElementById("st-live").textContent = PICKS.filter(live).length;
  document.getElementById("st-total").textContent = PICKS.length;
  const f=featured();
  document.getElementById("feat").innerHTML = f?card(f):"";
  const L=list();
  document.getElementById("grid").innerHTML = L.length?L.map(card).join(""):'<p class="empty">No hay picks ≥ 1.50 para este filtro.</p>';
  document.getElementById("stamp").textContent = "Snapshot BSD · "+new Date(GENERATED).toLocaleString("es-AR")+" · cuota mínima 1.50 · sin stakes.";
  document.querySelectorAll(".card .tog").forEach(btn=>{
    btn.onclick=()=>{
      const art=btn.closest(".card");
      art.classList.toggle("open");
      const lab=btn.querySelector(".foot span:last-child");
      if(lab) lab.textContent = art.classList.contains("open")?"Ocultar ▴":"Ver análisis ▾";
    };
  });
}
document.querySelectorAll("#days .chip").forEach(ch=>{
  ch.onclick=()=>{
    if(ch.dataset.live){ liveOnly=!liveOnly; ch.classList.toggle("on", liveOnly); render(); return; }
    if(ch.dataset.ev){ evOnly=!evOnly; ch.classList.toggle("on", evOnly); render(); return; }
    document.querySelectorAll("#days [data-day]").forEach(x=>x.classList.remove("on"));
    ch.classList.add("on");
    dayF=ch.dataset.day;
    render();
  };
});
render();
</script>
</body>
</html>
"""


def write_site(picks: list[dict]) -> None:
    payload = json.dumps(picks, ensure_ascii=False)
    generated = json.dumps(datetime.now(timezone.utc).isoformat())
    html = HTML.replace("__PICKS__", payload).replace("__GENERATED__", generated)
    (ROOT / "index.html").write_text(html)
    (ROOT / "docs" / "index.html").write_text(html)
    js_only = "/* served via index.html */\n"
    (ROOT / "app.js").write_text(js_only)
    (ROOT / "docs" / "app.js").write_text(js_only)
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
    readme = """# Predicciones Pro

Sitio público (GitHub Pages):

https://tipsterbet49-svg.github.io/Buitre-bets-1/

Esa es la URL de la página. El código fuente está en este mismo repo.

Si ves 404:
1. Settings → Pages
2. Source: Deploy from a branch
3. Branch: main, folder: / (root)
4. Save y esperá un minuto
"""
    (ROOT / "README.md").write_text(readme)
    print(f"wrote {len(picks)} picks")


def main() -> None:
    picks = load_picks()
    write_site(picks)
    for p in picks[:8]:
        print(f"{p['league']:16} {p['home']} vs {p['away']}: {p['market']} @{p['odds']} EV{p['evPct']:+}")


if __name__ == "__main__":
    main()
