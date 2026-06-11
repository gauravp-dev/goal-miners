/* =========================================================================
   World Cup 2026 — the official draw (Washington, 5 Dec 2025), including
   the March 2026 play-off winners. strength: OVR-style projection (67–92)
   used only to power the "auto" helpers — the draw itself is official.
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
    N("RSA", "South Africa",  "🇿🇦", 73, "CAF"),
    N("KOR", "South Korea",   "🇰🇷", 80, "AFC"),
    N("CZE", "Czechia",       "🇨🇿", 79, "UEFA"),
  ]},
  { name: "B", teams: [
    N("CAN", "Canada",        "🇨🇦", 78, "CONCACAF"),
    N("BIH", "Bosnia & H.",   "🇧🇦", 76, "UEFA"),
    N("QAT", "Qatar",         "🇶🇦", 72, "AFC"),
    N("SUI", "Switzerland",   "🇨🇭", 81, "UEFA"),
  ]},
  { name: "C", teams: [
    N("BRA", "Brazil",        "🇧🇷", 89, "CONMEBOL"),
    N("MAR", "Morocco",       "🇲🇦", 83, "CAF"),
    N("HAI", "Haiti",         "🇭🇹", 68, "CONCACAF"),
    N("SCO", "Scotland",      "🏴󠁧󠁢󠁳󠁣󠁴󠁿", 78, "UEFA"),
  ]},
  { name: "D", teams: [
    N("USA", "United States", "🇺🇸", 81, "CONCACAF"),
    N("PAR", "Paraguay",      "🇵🇾", 74, "CONMEBOL"),
    N("AUS", "Australia",     "🇦🇺", 75, "AFC"),
    N("TUR", "Türkiye",       "🇹🇷", 80, "UEFA"),
  ]},
  { name: "E", teams: [
    N("GER", "Germany",       "🇩🇪", 86, "UEFA"),
    N("CUW", "Curaçao",       "🇨🇼", 67, "CONCACAF"),
    N("CIV", "Côte d'Ivoire", "🇨🇮", 77, "CAF"),
    N("ECU", "Ecuador",       "🇪🇨", 79, "CONMEBOL"),
  ]},
  { name: "F", teams: [
    N("NED", "Netherlands",   "🇳🇱", 88, "UEFA"),
    N("JPN", "Japan",         "🇯🇵", 82, "AFC"),
    N("SWE", "Sweden",        "🇸🇪", 79, "UEFA"),
    N("TUN", "Tunisia",       "🇹🇳", 75, "CAF"),
  ]},
  { name: "G", teams: [
    N("BEL", "Belgium",       "🇧🇪", 86, "UEFA"),
    N("EGY", "Egypt",         "🇪🇬", 76, "CAF"),
    N("IRN", "Iran",          "🇮🇷", 74, "AFC"),
    N("NZL", "New Zealand",   "🇳🇿", 68, "OFC"),
  ]},
  { name: "H", teams: [
    N("ESP", "Spain",         "🇪🇸", 91, "UEFA"),
    N("CPV", "Cabo Verde",    "🇨🇻", 70, "CAF"),
    N("KSA", "Saudi Arabia",  "🇸🇦", 72, "AFC"),
    N("URU", "Uruguay",       "🇺🇾", 84, "CONMEBOL"),
  ]},
  { name: "I", teams: [
    N("FRA", "France",        "🇫🇷", 91, "UEFA"),
    N("SEN", "Senegal",       "🇸🇳", 81, "CAF"),
    N("IRQ", "Iraq",          "🇮🇶", 71, "AFC"),
    N("NOR", "Norway",        "🇳🇴", 84, "UEFA"),
  ]},
  { name: "J", teams: [
    N("ARG", "Argentina",     "🇦🇷", 92, "CONMEBOL"),
    N("ALG", "Algeria",       "🇩🇿", 77, "CAF"),
    N("AUT", "Austria",       "🇦🇹", 79, "UEFA"),
    N("JOR", "Jordan",        "🇯🇴", 70, "AFC"),
  ]},
  { name: "K", teams: [
    N("POR", "Portugal",      "🇵🇹", 88, "UEFA"),
    N("COD", "DR Congo",      "🇨🇩", 75, "CAF"),
    N("UZB", "Uzbekistan",    "🇺🇿", 71, "AFC"),
    N("COL", "Colombia",      "🇨🇴", 83, "CONMEBOL"),
  ]},
  { name: "L", teams: [
    N("ENG", "England",       "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 89, "UEFA"),
    N("CRO", "Croatia",       "🇭🇷", 84, "UEFA"),
    N("GHA", "Ghana",         "🇬🇭", 75, "CAF"),
    N("PAN", "Panama",        "🇵🇦", 72, "CONCACAF"),
  ]},
];

