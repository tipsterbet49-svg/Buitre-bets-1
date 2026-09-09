const PICKS = [{"id": "liv-atm", "league": "UCL", "leagueKey": "ucl", "kickoff": "2026-09-09T19:00:00.000Z", "home": "Liverpool", "away": "Atlético Madrid", "market": "Ambos marcan (BTTS Sí)", "odds": 1.58, "impliedPct": 63.3, "modelPct": 73, "evPct": 15.3, "conf": 78, "sources": ["Forebet", "FootyStats"], "bullets": ["Forebet: 73% BTTS / marcador 2-1 / media 2.83 goles", "H2H: 9 partidos, media 2.89 goles", "1X2: 1.70 / 4.10 / 4.60 — Liverpool no es value"], "analysis": "El error típico es ir al 1 de Liverpool @ 1.69. Forebet le da 36% al local. Donde hay precio es BTTS: Forebet 73% vs implícita 63% @ 1.58.", "rejected": "Se descarta Liverpool gana @ 1.69."}, {"id": "nap-ars", "league": "UCL", "leagueKey": "ucl", "kickoff": "2026-09-09T19:00:00.000Z", "home": "Napoli", "away": "Arsenal", "market": "Menos de 2.5 goles", "odds": 1.88, "impliedPct": 53.2, "modelPct": 68, "evPct": 27.8, "conf": 80, "sources": ["Forebet", "FootyStats", "AdamChoi"], "bullets": ["Forebet: 0-1, media 1.97, BTTS No 57%", "Arsenal Under 2.5 en 4 UCL de visitante", "H2H media 1.75, Arsenal ganó 3 de 4"], "analysis": "No es un Over. Forebet proyecta 0-1 (media 1.97). Under @ 1.88 implica 53% y el modelo ~68%. Arsenal @ 1.74 no es value (44% vs 57%).", "rejected": "Se descarta Arsenal gana @ 1.74."}, {"id": "spo-gal", "league": "UCL", "leagueKey": "ucl", "kickoff": "2026-09-09T19:00:00.000Z", "home": "Sporting CP", "away": "Galatasaray", "market": "BTTS No", "odds": 2.3, "impliedPct": 43.5, "modelPct": 57, "evPct": 31.1, "conf": 74, "sources": ["Forebet", "AdamChoi"], "bullets": ["Forebet: 3-0 Sporting, BTTS No 57%", "Galatasaray: 0 goles en 4 visitas UCL", "Sporting @ 1.83 casi en línea, sin edge"], "analysis": "Forebet ve 3-0. Gala no marcó en 4 UCL de visitante. BTTS No @ 2.30 paga modelo 57% vs implícita 43%.", "rejected": "Se descarta BTTS Sí @ 1.57 y Sporting @ 1.83."}, {"id": "stu-vik", "league": "UCL", "leagueKey": "ucl", "kickoff": "2026-09-09T16:45:00.000Z", "home": "Stuttgart", "away": "Viking", "market": "Ambos marcan (BTTS Sí)", "odds": 1.58, "impliedPct": 63.3, "modelPct": 74, "evPct": 16.9, "conf": 76, "sources": ["Forebet"], "bullets": ["Forebet: 3-3, media 3.07, BTTS 74%", "Stuttgart @ 1.24 queda fuera (mínimo 1.50)"], "analysis": "Stuttgart 1.24 no se publica. Forebet ve 3-3 y 74% BTTS. @ 1.58 el modelo está 11 puntos arriba de la implícita.", "rejected": "Se descarta Stuttgart @ 1.24 y Over 2.5 @ 1.26."}, {"id": "pal-ldu", "league": "Libertadores", "leagueKey": "lib", "kickoff": "2026-09-09T22:00:00.000Z", "home": "Palmeiras", "away": "LDU", "market": "Menos de 2.5 goles", "odds": 1.86, "impliedPct": 53.8, "modelPct": 58, "evPct": 7.9, "conf": 68, "sources": ["Forebet", "FootyStats"], "bullets": ["Forebet: 1-0, media 2.35", "Palmeiras @ 1.25 se descarta"], "analysis": "Palmeiras 1.25 no se toca. Forebet 1-0 y media 2.35: Under 2.5 @ 1.86. Confianza no máxima por H2H corto.", "rejected": "Se descarta Palmeiras @ 1.25."}, {"id": "san-cam", "league": "Sudamericana", "leagueKey": "bra", "kickoff": "2026-09-09T22:00:00.000Z", "home": "Santos", "away": "Atlético Mineiro", "market": "Más de 2.5 goles", "odds": 2.3, "impliedPct": 43.5, "modelPct": 58, "evPct": 33.4, "conf": 70, "sources": ["FootyStats"], "bullets": ["H2H 48 partidos, media 2.94", "1X2 abierto 2.27 / 3.12 / 3.17"], "analysis": "48 H2H con media 2.94. Over @ 2.30 (implícita 43%). El Under @ 1.60 choca con el historial.", "rejected": "Se descarta Under 2.5 @ 1.60."}, {"id": "mor-ben", "league": "Liga Portugal", "leagueKey": "por", "kickoff": "2026-09-09T19:45:00.000Z", "home": "Moreirense", "away": "Benfica", "market": "BTTS No", "odds": 1.61, "impliedPct": 62.1, "modelPct": 62, "evPct": -0.2, "conf": 72, "sources": ["Forebet", "AdamChoi"], "bullets": ["Benfica invicto 38 en Liga Portugal", "Benfica @ 1.16 se descarta"], "analysis": "No se publica Benfica @ 1.16. El mercado accesible es BTTS No @ 1.61.", "rejected": "Se descarta Benfica @ 1.16."}, {"id": "est-cor", "league": "Libertadores", "leagueKey": "lib", "kickoff": "2026-09-10T00:30:00.000Z", "home": "Estudiantes", "away": "Corinthians", "market": "Gana Estudiantes", "odds": 2.24, "impliedPct": 44.6, "modelPct": 48, "evPct": 7.5, "conf": 73, "sources": ["Forebet"], "bullets": ["Forebet pick del día Libertadores", "Estudiantes invicto 8 locales en copa"], "analysis": "Uno de los pocos 1X2 que pasa 1.50. Forebet lo marca como pick del día. Under 2.5 @ 1.39 queda afuera.", "rejected": "Se descarta Under 2.5 @ 1.39."}, {"id": "bay-bod", "league": "UCL", "leagueKey": "ucl", "kickoff": "2026-09-10T19:00:00.000Z", "home": "Bayern", "away": "Bodø/Glimt", "market": "Ambos marcan (BTTS Sí)", "odds": 1.65, "impliedPct": 60.6, "modelPct": 62, "evPct": 2.3, "conf": 71, "sources": ["Forebet", "AdamChoi"], "bullets": ["Bodø Over 2.5 en 12 UCL seguidos", "Bayern @ 1.10 y Over 2.5 @ 1.12 fuera"], "analysis": "Bayern y Over 2.5 no se publican por cuota. La vía 1.50+ es BTTS @ 1.65.", "rejected": "Se descarta Bayern @ 1.10."}, {"id": "psv-sha", "league": "UCL", "leagueKey": "ucl", "kickoff": "2026-09-10T16:45:00.000Z", "home": "PSV", "away": "Shakhtar", "market": "Más de 3.5 goles", "odds": 2.14, "impliedPct": 46.7, "modelPct": 57, "evPct": 22.0, "conf": 75, "sources": ["Forebet", "FootyStats"], "bullets": ["Forebet 3-1, media 3.98", "PSV @ 1.42 y Over 2.5 @ 1.43 fuera"], "analysis": "Media 3.98. Over 2.5 @ 1.43 no se publica. Over 3.5 @ 2.14 todavía paga.", "rejected": "Se descarta PSV @ 1.42."}, {"id": "mun-sab", "league": "UCL", "leagueKey": "ucl", "kickoff": "2026-09-10T19:00:00.000Z", "home": "Manchester United", "away": "Sabah", "market": "Más de 3.5 goles", "odds": 1.65, "impliedPct": 60.6, "modelPct": 58, "evPct": -4.3, "conf": 72, "sources": ["FootyStats"], "bullets": ["United @ 1.11 y Over 2.5 @ 1.24 se descartan"], "analysis": "United 1.11 no se toca. Over 3.5 @ 1.65 es el primer precio que cumple 1.50.", "rejected": "Se descarta United @ 1.11."}, {"id": "fen-rom", "league": "UCL", "leagueKey": "ucl", "kickoff": "2026-09-10T16:45:00.000Z", "home": "Fenerbahçe", "away": "Roma", "market": "Gana Roma", "odds": 2.15, "impliedPct": 46.5, "modelPct": 40, "evPct": -14.0, "conf": 66, "sources": ["Forebet", "FootyStats"], "bullets": ["Forebet 38-22-40, predice 1-2", "BTTS @ 1.60 sin value"], "analysis": "Partido parejo. Forebet se inclina a Roma. Edge chico: confianza Media-Alta.", "rejected": "Se descarta BTTS Sí @ 1.60."}];

const TZ = "America/Argentina/Buenos_Aires";
function ymd(iso){return new Date(iso).toLocaleDateString("en-CA",{timeZone:TZ});}
function today(){return new Date().toLocaleDateString("en-CA",{timeZone:TZ});}
function tomorrow(){
  var p = today().split("-");
  var dt = new Date(Number(p[0]), Number(p[1])-1, Number(p[2])+1);
  var m = String(dt.getMonth()+1); if(m.length<2) m="0"+m;
  var d = String(dt.getDate()); if(d.length<2) d="0"+d;
  return dt.getFullYear()+"-"+m+"-"+d;
}
function clock(iso){return new Date(iso).toLocaleString("es-AR",{timeZone:TZ,weekday:"short",hour:"2-digit",minute:"2-digit"});}
function bucket(iso){
  var d = ymd(iso);
  if(d===today()) return "hoy";
  if(d===tomorrow()) return "manana";
  return "prox";
}
function stars(c){
  var n = c>=78?5:c>=72?4:3;
  var s="";
  for(var i=1;i<=5;i++) s += '<span class="'+(i<=n?"on":"")+'">*</span>';
  return s;
}
function lvl(c){return c>=78?"Maxima":c>=72?"Alta":"Media-Alta";}
function esc(t){return String(t);}

var dayF="hoy", lgF="all";
function list(){
  return PICKS.filter(function(p){
    var b=bucket(p.kickoff);
    if(dayF!=="all" && b!==dayF) return false;
    if(lgF!=="all" && p.leagueKey!==lgF) return false;
    return true;
  }).sort(function(a,b){return b.conf-a.conf;});
}
function card(p){
  var when = bucket(p.kickoff)==="hoy"?"Hoy":(bucket(p.kickoff)==="manana"?"Man.":"Prox");
  var bullets = p.bullets.map(function(b){return "<li>"+esc(b)+"</li>";}).join("");
  var tags = p.sources.map(function(s){return '<span class="tag">'+esc(s)+"</span>";}).join("") + '<span class="tag ev">EV +'+p.evPct+"%</span>";
  var share = "https://t.me/share/url?url="+encodeURIComponent(location.href)+"&text="+encodeURIComponent(p.home+" vs "+p.away+" | "+p.market+" @ "+p.odds);
  return '<article class="card">'
    +'<div class="row"><span class="chip">'+esc(p.league)+'</span><span class="time">'+when+" · "+clock(p.kickoff)+"</span></div>"
    +'<div class="conf"><span class="cl">Confianza</span><div class="stars">'+stars(p.conf)+'</div><span class="lvl">'+lvl(p.conf)+"</span></div>"
    +'<div class="teams"><div class="team">'+esc(p.home)+'</div><div class="vs">VS</div><div class="team">'+esc(p.away)+"</div></div>"
    +'<div class="rec"><div><small>Pick 1.50+</small><div class="pick">'+esc(p.market)+'</div></div><div class="odds">'+p.odds.toFixed(2)+"</div></div>"
    +'<div class="nums"><div>Modelo<b>'+p.modelPct+'%</b></div><div>Implicita<b>'+p.impliedPct+'%</b></div><div>EV<b>+'+p.evPct+"%</b></div></div>"
    +'<ul class="bul">'+bullets+"</ul>"
    +'<p class="why"><b>Por que este pick:</b> '+esc(p.analysis)+"</p>"
    +'<p class="rej">'+esc(p.rejected)+"</p>"
    +'<div class="tags">'+tags+"</div>"
    +'<button class="share" type="button" data-share="'+share+'">Compartir en Telegram</button>'
    +"</article>";
}
function render(){
  var L=list();
  document.getElementById("st-hoy").textContent = PICKS.filter(function(p){return bucket(p.kickoff)==="hoy";}).length;
  document.getElementById("st-total").textContent = PICKS.length;
  document.getElementById("grid").innerHTML = L.length ? L.map(card).join("") : '<div class="empty">No hay picks para este filtro.</div>';
  var btns = document.querySelectorAll(".share");
  for(var i=0;i<btns.length;i++){
    btns[i].onclick = function(){ location.href = this.getAttribute("data-share"); };
  }
}
function bind(sel, key, store){
  var nodes = document.querySelectorAll(sel+" .fbtn");
  for(var i=0;i<nodes.length;i++){
    nodes[i].onclick = function(){
      var all = this.parentNode.querySelectorAll(".fbtn");
      for(var j=0;j<all.length;j++) all[j].className="fbtn";
      this.className="fbtn active";
      if(store==="day") dayF=this.getAttribute("data-k");
      else lgF=this.getAttribute("data-k");
      render();
    };
  }
}
bind("#dayf","day","day");
bind("#lgf","lg","lg");
render();

var asEl=document.getElementById("as"), asb=document.getElementById("asb");
document.getElementById("fab").onclick=function(){ asEl.classList.toggle("open"); };
document.getElementById("asx").onclick=function(){ asEl.classList.remove("open"); };
function add(t,w){ var d=document.createElement("div"); d.className="msg "+w; d.textContent=t; asb.appendChild(d); asb.scrollTop=asb.scrollHeight; }
function answer(q){
  var t=q.toLowerCase();
  var top=PICKS.slice().sort(function(a,b){return b.conf-a.conf;}).slice(0,4);
  if(/hoy|mejor|top|pick/.test(t)){
    var s="Picks con mas confianza:\n";
    for(var i=0;i<top.length;i++) s+="• "+top[i].home+" vs "+top[i].away+": "+top[i].market+" @ "+top[i].odds+"\n";
    return s;
  }
  for(var i=0;i<PICKS.length;i++){
    var p=PICKS[i];
    if(t.indexOf(p.home.toLowerCase())>=0 || t.indexOf(p.away.toLowerCase().split(" ")[0].toLowerCase())>=0){
      return p.home+" vs "+p.away+": "+p.market+" @ "+p.odds+". "+p.analysis;
    }
  }
  if(/1.50|cuota/.test(t)) return "Solo se publican mercados desde 1.50. Favoritos a 1.10 no entran.";
  return "Preguntame por un partido (Liverpool, Napoli, Sporting) o por la regla de cuota 1.50.";
}
function send(){
  var inp=document.getElementById("asi");
  var q=inp.value.trim();
  if(!q) return;
  inp.value="";
  add(q,"user");
  add(answer(q),"bot");
}
document.getElementById("ass").onclick=send;
document.getElementById("asi").addEventListener("keydown", function(e){ if(e.key==="Enter") send(); });
