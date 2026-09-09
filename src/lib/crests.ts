/** Real crests via API-Sports public media CDN. Keys are `norm()` of BSD team names. */

function media(id: number) {
  return `https://media.api-sports.io/football/teams/${id}.png`;
}

export function normTeam(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[øØ]/g, "o")
    .replace(/[æÆ]/g, "ae")
    .replace(/[åÅ]/g, "a")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(fc|cf|ssc|sk|ac|as|sc|cd|ud|rc|rcd|afc|cfc|bk|fk|if|the|club|1)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** API-Football team ids. Verified against the media CDN. */
const IDS: Record<string, number> = {
  // Premier
  arsenal: 42,
  "aston villa": 66,
  bournemouth: 35,
  brentford: 55,
  brighton: 51,
  "brighton and hove albion": 51,
  chelsea: 49,
  "crystal palace": 52,
  everton: 45,
  fulham: 36,
  ipswich: 57,
  "ipswich town": 57,
  leicester: 46,
  "leicester city": 46,
  liverpool: 40,
  "manchester city": 50,
  "man city": 50,
  "manchester united": 33,
  "man united": 33,
  "man utd": 33,
  newcastle: 34,
  "newcastle united": 34,
  "nottingham forest": 65,
  forest: 65,
  southampton: 41,
  tottenham: 47,
  "tottenham hotspur": 47,
  spurs: 47,
  "west ham": 48,
  "west ham united": 48,
  wolves: 39,
  "wolverhampton wanderers": 39,
  "leeds united": 63,
  leeds: 63,
  burnley: 44,

  // La Liga
  "real madrid": 541,
  barcelona: 529,
  "atletico madrid": 530,
  sevilla: 536,
  valencia: 532,
  villarreal: 533,
  "real sociedad": 548,
  "athletic club": 531,
  "athletic bilbao": 531,
  "real betis": 543,
  betis: 543,
  girona: 547,
  osasuna: 727,
  celta: 538,
  "celta de vigo": 538,
  mallorca: 798,
  "rayo vallecano": 728,
  rayo: 728,
  getafe: 546,
  "las palmas": 534,
  alaves: 542,
  espanyol: 540,
  valladolid: 720,
  "real valladolid": 720,
  leganes: 537,

  // Serie A
  inter: 505,
  "inter milan": 505,
  "internazionale": 505,
  milan: 489,
  juventus: 496,
  napoli: 492,
  roma: 497,
  lazio: 487,
  atalanta: 499,
  fiorentina: 502,
  bologna: 500,
  torino: 503,
  udinese: 494,
  como: 895,
  venezia: 517,
  genoa: 495,
  cagliari: 490,
  lecce: 867,
  parma: 523,
  empoli: 511,
  verona: 504,
  "hellas verona": 504,
  monza: 1579,
  sassuolo: 488,

  // Bundesliga
  bayern: 157,
  "bayern munich": 157,
  "bayern munchen": 157,
  dortmund: 165,
  "borussia dortmund": 165,
  leverkusen: 168,
  "bayer leverkusen": 168,
  leipzig: 173,
  "rb leipzig": 173,
  frankfurt: 169,
  "eintracht frankfurt": 169,
  wolfsburg: 161,
  "borussia monchengladbach": 163,
  gladbach: 163,
  freiburg: 160,
  "union berlin": 182,
  stuttgart: 172,
  "vfb stuttgart": 172,
  mainz: 164,
  "mainz 05": 164,
  augsburg: 170,
  hoffenheim: 167,
  "werder bremen": 162,
  bremen: 162,
  heidenheim: 191,
  "st pauli": 180,
  koln: 192,
  "fc koln": 192,
  hamburg: 171,
  "hamburger sv": 171,
  schalke: 174,
  "schalke 04": 174,
  bochum: 176,
  hertha: 159,
  "hertha bsc": 159,

  // Ligue 1
  "paris saint germain": 85,
  psg: 85,
  marseille: 81,
  "olympique de marseille": 81,
  "olympique marseille": 81,
  monaco: 91,
  "as monaco": 91,
  lyon: 80,
  "olympique lyonnais": 80,
  lille: 79,
  rennes: 94,
  "stade rennais": 94,
  nice: 84,
  "ogc nice": 84,
  lens: 116,
  strasbourg: 95,
  toulouse: 96,
  reims: 93,
  nantes: 83,
  brest: 106,
  montpellier: 82,
  "le havre": 111,
  angers: 77,
  auxerre: 108,
  "saint etienne": 1063,

  // Portugal
  benfica: 211,
  porto: 212,
  "fc porto": 212,
  sporting: 228,
  "sporting cp": 228,
  "sporting lisbon": 228,
  braga: 217,
  "sporting braga": 217,
  moreirense: 215,
  "estrela amadora": 15130,
  "vitoria guimaraes": 224,
  guimaraes: 224,
  "gil vicente": 231,
  famalicao: 242,
  "casa pia": 4716,
  arouca: 240,
  "rio ave": 226,
  "santa clara": 227,

  // Brazil
  flamengo: 127,
  palmeiras: 121,
  "sao paulo": 126,
  corinthians: 131,
  santos: 128,
  fluminense: 124,
  botafogo: 120,
  vasco: 133,
  "vasco da gama": 133,
  gremio: 130,
  internacional: 129,
  cruzeiro: 135,
  "atletico mineiro": 1062,
  athletico: 134,
  "athletico paranaense": 134,
  "atletico paranaense": 134,
  bahia: 123,
  fortaleza: 132,
  bragantino: 119,
  "red bull bragantino": 119,
  cuiaba: 137,
  ceara: 122,
  vitoria: 125,
  juventude: 152,
  coritiba: 147,
  "atletico goianiense": 144,
  "sport recife": 136,

  // Argentina
  "river plate": 435,
  river: 435,
  "boca juniors": 451,
  boca: 451,
  racing: 436,
  independiente: 453,
  "san lorenzo": 434,
  "estudiantes de la plata": 450,
  "estudiantes la plata": 450,
  estudiantes: 450,
  "gimnasia la plata": 445,
  "gimnasia y esgrima la plata": 445,
  "gimnasia y esgrima mendoza": 10620,
  "gimnasia mendoza": 10620,
  huracan: 460,
  lanus: 446,
  banfield: 455,
  "rosario central": 437,
  "newells old boys": 457,
  newells: 457,
  "velez sarsfield": 438,
  velez: 438,
  talleres: 456,
  "talleres de cordoba": 456,
  belgrano: 1064,
  instituto: 478,
  "argentinos juniors": 439,
  argentinos: 439,
  platense: 1065,
  tigre: 464,
  union: 467,
  "union de santa fe": 467,
  "godoy cruz": 443,
  "defensa y justicia": 442,
  "central cordoba": 1066,
  "barracas central": 2432,
  sarmiento: 474,
  aldosivi: 463,
  colon: 441,
  "independiente rivadavia": 473,

  // Libertadores / Sudamericana / UCL extras
  "independiente del valle": 1156,
  ldu: 1158,
  "ldu quito": 1158,
  cienciano: 2562,
  "montevideo city torque": 2474,
  torque: 2474,
  "bodo glimt": 737,
  "bod glimt": 737,
  sabah: 3563,
  "shakhtar donetsk": 555,
  shakhtar: 555,
  galatasaray: 645,
  fenerbahce: 611,
  "slavia praha": 560,
  "slavia prague": 560,
  slavia: 560,
  "slovan bratislava": 656,
  "psv eindhoven": 197,
  psv: 197,
  feyenoord: 209,
  viking: 759,
  "ajax": 194,
  celtic: 247,
  "club brugge": 569,
  brugge: 569,
  "red bull salzburg": 571,
  salzburg: 571,
  "young boys": 599,
  copenhagen: 400,
  "fc copenhagen": 400,
  olympiacos: 553,
  paok: 619,
  "dynamo kyiv": 566,
  besiktas: 549,
  "qarabag": 556,
  "dinamo zagreb": 620,
  "red star belgrade": 598,
  "crvena zvezda": 598,
  fcsb: 5474,
  "sparta prague": 614,
  "sturm graz": 637,
  midtjylland: 397,
  rangers: 257,
  "malmo ff": 375,
  malmo: 375,
  ferencvaros: 651,
  anderleicht: 554,
  anderlecht: 554,
  "fc basel": 550,
  basel: 550,
  "barcelona sc": 1155,
  "barcelona ecuador": 1155,
  emelec: 1150,
  "alianza lima": 1169,
  universitario: 1170,
  "sporting cristal": 1171,
  libertad: 1129,
  "cerro porteno": 1128,
  olimpia: 1130,
  bolivar: 1123,
  "the strongest": 1124,
  junior: 1141,
  millonarios: 1138,
  "atletico nacional": 1137,
  "america de cali": 1136,
  "colo colo": 1166,
  "universidad de chile": 1168,
  "universidad catolica": 1167,
  nacional: 1133,
  "nacional montevideo": 1133,
  penarol: 1132,
  "always ready": 1126,
};

const runtime = new Map<string, string>();

export function crestUrl(name: string): string | undefined {
  const k = normTeam(name);
  if (!k) return undefined;
  const id = IDS[k];
  if (id) return media(id);
  return runtime.get(k);
}

type TsdbTeam = {
  strTeam?: string;
  strSport?: string;
  strBadge?: string | null;
  idAPIfootball?: string | number | null;
};

export async function hydrateCrests(names: string[]): Promise<void> {
  const missing = [...new Set(names)].filter((n) => {
    const k = normTeam(n);
    return k && !IDS[k] && !runtime.has(k);
  });
  if (!missing.length) return;

  const slice = missing.slice(0, 10);
  await Promise.all(slice.map(lookupOne));
}

async function lookupOne(name: string) {
  const k = normTeam(name);
  if (!k) return;
  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(name)}`,
      { signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return;
    const data = (await res.json()) as { teams?: TsdbTeam[] | null };
    const teams = data.teams ?? [];
    const soccer = teams.filter((t) => (t.strSport ?? "").toLowerCase() === "soccer");
    const hit = (soccer[0] ?? teams[0]) as TsdbTeam | undefined;
    if (!hit) return;
    const api = Number(hit.idAPIfootball);
    const url = Number.isFinite(api) && api > 0 ? media(api) : hit.strBadge || undefined;
    if (url) runtime.set(k, url);
  } catch {
    /* keep initials fallback */
  }
}
