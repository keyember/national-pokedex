// Filtre par jeu : chaque jeu pointe vers une plage d'IDs de Pokémon disponibles
export const GAMES = [
  // Gen 1
  { label: "Rouge / Bleu / Jaune", gen: "Gen 1", min: 1, max: 151 },
  // Gen 2
  { label: "Or / Argent / Cristal", gen: "Gen 2", min: 1, max: 251 },
  // Gen 3
  { label: "Rubis / Saphir / Émeraude", gen: "Gen 3", min: 1, max: 386 },
  { label: "Rouge Feu / Vert Feuille", gen: "Gen 3", min: 1, max: 151 },
  // Gen 4
  { label: "Diamant / Perle / Platine", gen: "Gen 4", min: 1, max: 493 },
  { label: "Or HeartGold / Argent SoulSilver", gen: "Gen 4", min: 1, max: 493 },
  // Gen 5
  { label: "Noir / Blanc", gen: "Gen 5", min: 494, max: 649 },
  { label: "Noir 2 / Blanc 2", gen: "Gen 5", min: 1, max: 649 },
  // Gen 6
  { label: "X / Y", gen: "Gen 6", min: 1, max: 721 },
  { label: "Rubis Oméga / Saphir Alpha", gen: "Gen 6", min: 1, max: 721 },
  // Gen 7
  { label: "Soleil / Lune", gen: "Gen 7", min: 1, max: 802 },
  { label: "Ultra-Soleil / Ultra-Lune", gen: "Gen 7", min: 1, max: 807 },
  // Gen 8
  { label: "Épée / Bouclier", gen: "Gen 8", min: 1, max: 905 },
  {
    label: "Diamant Étincelant / Perle Scintillante",
    gen: "Gen 8",
    min: 1,
    max: 905,
  },
  { label: "Légendes Arceus", gen: "Gen 8", min: 1, max: 905 },
  // Gen 9
  { label: "Écarlate / Violet", gen: "Gen 9", min: 1, max: 1025 },
];

export const GENERATIONS = [
  { label: "Gen 1", min: 1, max: 151 },
  { label: "Gen 2", min: 152, max: 251 },
  { label: "Gen 3", min: 252, max: 386 },
  { label: "Gen 4", min: 387, max: 493 },
  { label: "Gen 5", min: 494, max: 649 },
  { label: "Gen 6", min: 650, max: 721 },
  { label: "Gen 7", min: 722, max: 809 },
  { label: "Gen 8", min: 810, max: 905 },
  { label: "Gen 9", min: 906, max: 1025 },
];

export const TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
];

export const TYPE_FR = {
  normal: "Normal",
  fire: "Feu",
  water: "Eau",
  electric: "Electrik",
  grass: "Plante",
  ice: "Glace",
  fighting: "Combat",
  poison: "Poison",
  ground: "Sol",
  flying: "Vol",
  psychic: "Psy",
  bug: "Insecte",
  rock: "Roche",
  ghost: "Spectre",
  dragon: "Dragon",
  dark: "Tenebres",
  steel: "Acier",
  fairy: "Fee",
};

export const TYPE_COLORS = {
  normal: "#A8A878",
  fire: "#F08030",
  water: "#6890F0",
  electric: "#F8D030",
  grass: "#78C850",
  ice: "#98D8D8",
  fighting: "#C03028",
  poison: "#A040A0",
  ground: "#E0C068",
  flying: "#A890F0",
  psychic: "#F85888",
  bug: "#A8B820",
  rock: "#B8A038",
  ghost: "#705898",
  dragon: "#7038F8",
  dark: "#705848",
  steel: "#B8B8D0",
  fairy: "#EE99AC",
};

export const SORT_OPTIONS = [
  { value: "id", label: "N° (defaut)" },
  { value: "name", label: "Nom A-Z" },
  { value: "hp", label: "PV" },
  { value: "attack", label: "Attaque" },
  { value: "defense", label: "Defense" },
  { value: "speed", label: "Vitesse" },
  { value: "total", label: "Total stats" },
];

// ── Table des multiplicateurs offensifs : TYPE_CHART[attaquant][défenseur] ──
export const TYPE_CHART = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
    steel: 2,
  },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: {
    water: 2,
    electric: 0.5,
    grass: 0.5,
    ground: 0,
    flying: 2,
    dragon: 0.5,
  },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 0.5,
    ground: 2,
    flying: 2,
    dragon: 2,
    steel: 0.5,
  },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: {
    grass: 2,
    poison: 0.5,
    ground: 0.5,
    rock: 0.5,
    ghost: 0.5,
    steel: 0,
    fairy: 2,
  },
  ground: {
    fire: 2,
    electric: 2,
    grass: 0.5,
    poison: 2,
    flying: 0,
    bug: 0.5,
    rock: 2,
    steel: 2,
  },
  flying: {
    electric: 0.5,
    grass: 2,
    fighting: 2,
    bug: 2,
    rock: 0.5,
    steel: 0.5,
  },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: {
    fire: 2,
    ice: 2,
    fighting: 0.5,
    ground: 0.5,
    flying: 2,
    bug: 2,
    steel: 0.5,
  },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: {
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    ice: 2,
    rock: 2,
    steel: 0.5,
    fairy: 2,
  },
  fairy: {
    fire: 0.5,
    fighting: 2,
    poison: 0.5,
    dragon: 2,
    dark: 2,
    steel: 0.5,
  },
};

/**
 * Calcule les multiplicateurs de dégâts reçus pour un Pokémon
 * ayant les types donnés (tableau de strings anglais).
 * Retourne { typeName: multiplicateur } pour les 18 types d'attaque.
 */
export function computeDefenseChart(defenderTypes) {
  const result = {};
  for (const atkType of TYPES) {
    let mult = 1;
    for (const defType of defenderTypes) {
      mult *= TYPE_CHART[atkType]?.[defType] ?? 1;
    }
    result[atkType] = mult;
  }
  return result;
}
