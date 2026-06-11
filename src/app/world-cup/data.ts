/* =========================================================================
   World Cup 2026 — 48 nations (matched to the crest set), 12 groups.
   strength: OVR-style projection (67–92). This is a *projection*, not an
   official FIFA draw.
   ========================================================================= */

export type Team = {
  code: string;
  name: string;
  flag: string;
  strength: number;
  conf: string;
  logo: string;
};

export type Group = { name: string; teams: Team[] };

const N = (
  code: string,
  name: string,
  flag: string,
  strength: number,
  conf: string
): Team => ({ code, name, flag, strength, conf, logo: `/wc/logos/${code}.svg` });

export const GROUPS: Group[] = [
  { name: "A", teams: [
    N("MEX", "Mexico",        "🇲🇽", 84, "CONCACAF"),
    N("CRO", "Croatia",       "🇭🇷", 84, "UEFA"),
    N("SWE", "Sweden",        "🇸🇪", 79, "UEFA"),
    N("PAR", "Paraguay",      "🇵🇾", 74, "CONMEBOL"),
  ]},
  { name: "B", teams: [
    N("CAN", "Canada",        "🇨🇦", 78, "CONCACAF"),
    N("URU", "Uruguay",       "🇺🇾", 84, "CONMEBOL"),
    N("CZE", "Czechia",       "🇨🇿", 79, "UEFA"),
    N("RSA", "South Africa",  "🇿🇦", 73, "CAF"),
  ]},
  { name: "C", teams: [
    N("USA", "United States", "🇺🇸", 81, "CONCACAF"),
    N("NOR", "Norway",        "🇳🇴", 84, "UEFA"),
    N("SCO", "Scotland",      "🏴󠁧󠁢󠁳󠁣󠁴󠁿", 78, "UEFA"),
    N("QAT", "Qatar",         "🇶🇦", 72, "AFC"),
  ]},
  { name: "D", teams: [
    N("ARG", "Argentina",     "🇦🇷", 92, "CONMEBOL"),
    N("COL", "Colombia",      "🇨🇴", 83, "CONMEBOL"),
    N("ALG", "Algeria",       "🇩🇿", 77, "CAF"),
    N("KSA", "Saudi Arabia",  "🇸🇦", 72, "AFC"),
  ]},
  { name: "E", teams: [
    N("FRA", "France",        "🇫🇷", 91, "UEFA"),
    N("MAR", "Morocco",       "🇲🇦", 83, "CAF"),
    N("CIV", "Côte d'Ivoire", "🇨🇮", 77, "CAF"),
    N("PAN", "Panama",        "🇵🇦", 72, "CONCACAF"),
  ]},
  { name: "F", teams: [
    N("ESP", "Spain",         "🇪🇸", 91, "UEFA"),
    N("JPN", "Japan",         "🇯🇵", 82, "AFC"),
    N("BIH", "Bosnia & H.",   "🇧🇦", 76, "UEFA"),
    N("IRQ", "Iraq",          "🇮🇶", 71, "AFC"),
  ]},
  { name: "G", teams: [
    N("ENG", "England",       "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 89, "UEFA"),
    N("SEN", "Senegal",       "🇸🇳", 81, "CAF"),
    N("EGY", "Egypt",         "🇪🇬", 76, "CAF"),
    N("UZB", "Uzbekistan",    "🇺🇿", 71, "AFC"),
  ]},
  { name: "H", teams: [
    N("BRA", "Brazil",        "🇧🇷", 89, "CONMEBOL"),
    N("SUI", "Switzerland",   "🇨🇭", 81, "UEFA"),
    N("GHA", "Ghana",         "🇬🇭", 75, "CAF"),
    N("JOR", "Jordan",        "🇯🇴", 70, "AFC"),
  ]},
  { name: "I", teams: [
    N("POR", "Portugal",      "🇵🇹", 88, "UEFA"),
    N("KOR", "Korea Rep.",    "🇰🇷", 80, "AFC"),
    N("TUN", "Tunisia",       "🇹🇳", 75, "CAF"),
    N("CPV", "Cabo Verde",    "🇨🇻", 70, "CAF"),
  ]},
  { name: "J", teams: [
    N("GER", "Germany",       "🇩🇪", 86, "UEFA"),
    N("ECU", "Ecuador",       "🇪🇨", 79, "CONMEBOL"),
    N("AUS", "Australia",     "🇦🇺", 75, "AFC"),
    N("HAI", "Haiti",         "🇭🇹", 68, "CONCACAF"),
  ]},
  { name: "K", teams: [
    N("NED", "Netherlands",   "🇳🇱", 88, "UEFA"),
    N("TUR", "Türkiye",       "🇹🇷", 80, "UEFA"),
    N("COD", "DR Congo",      "🇨🇩", 75, "CAF"),
    N("NZL", "New Zealand",   "🇳🇿", 68, "OFC"),
  ]},
  { name: "L", teams: [
    N("BEL", "Belgium",       "🇧🇪", 86, "UEFA"),
    N("AUT", "Austria",       "🇦🇹", 79, "UEFA"),
    N("IRN", "Iran",          "🇮🇷", 74, "AFC"),
    N("CUW", "Curaçao",       "🇨🇼", 67, "CONCACAF"),
  ]},
];

