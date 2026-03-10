import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import "./PokedexList.css";

const TOTAL = 1025;
const PAGE_SIZE = 10;

const GENERATIONS = [
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

const TYPES = [
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

const SORT_OPTIONS = [
  { value: "id", label: "N° (defaut)" },
  { value: "name", label: "Nom A-Z" },
  { value: "hp", label: "PV" },
  { value: "attack", label: "Attaque" },
  { value: "defense", label: "Defense" },
  { value: "speed", label: "Vitesse" },
  { value: "total", label: "Total stats" },
];

export default function PokedexList() {
  const [pokemons, setPokemons] = useState([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageInput, setPageInput] = useState("");
  const [genFilter, setGenFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);
  const [sortBy, setSortBy] = useState("id");
  const [showFilters, setShowFilters] = useState(false);
  const [showLegendary, setShowLegendary] = useState(false);
  const [showMythical, setShowMythical] = useState(false);
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [showCapturedOnly, setShowCapturedOnly] = useState(false);
  const [showUncapturedOnly, setShowUncapturedOnly] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("poke-favorites") || "[]");
    } catch {
      return [];
    }
  });
  const [captured, setCaptured] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("poke-captured") || "[]");
    } catch {
      return [];
    }
  });
  const navigate = useNavigate();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const BATCH = 50;

    const fetchSpecies = async () => {
      try {
        const resp = await fetch(
          "https://pokeapi.co/api/v2/pokemon-species?limit=1025",
        );
        const data = await resp.json();
        const speciesList = data.results;
        const results = new Array(speciesList.length);

        for (let i = 0; i < speciesList.length; i += BATCH) {
          if (cancelled) return;
          const batch = speciesList.slice(i, i + BATCH);
          const fetched = await Promise.all(
            batch.map(async (specie, bi) => {
              const [spRes, pkRes] = await Promise.all([
                fetch(specie.url),
                fetch(
                  `https://pokeapi.co/api/v2/pokemon/${specie.url.split("/").filter(Boolean).pop()}`,
                ),
              ]);
              const spJson = await spRes.json();
              const pkJson = await pkRes.json();
              const frObj = spJson.names.find((n) => n.language.name === "fr");
              const statsMap = {};
              for (const s of pkJson.stats) statsMap[s.stat.name] = s.base_stat;
              return {
                idx: i + bi,
                entry: {
                  id: spJson.id,
                  nameEn: spJson.name,
                  nameFr: frObj ? frObj.name : spJson.name,
                  types: pkJson.types.map((t) => t.type.name),
                  isLegendary: spJson.is_legendary,
                  isMythical: spJson.is_mythical,
                  stats: statsMap,
                  total: Object.values(statsMap).reduce((a, b) => a + b, 0),
                },
              };
            }),
          );
          if (cancelled) return;
          for (const { idx, entry } of fetched) results[idx] = entry;
          setLoadedCount(Math.min(i + BATCH, speciesList.length));
        }
        if (!cancelled) setPokemons(results.filter(Boolean));
      } catch (err) {
        console.error("Error fetching species:", err);
      }
    };

    fetchSpecies();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Reset page on filter change ────────────────────────────────────────────
  useEffect(() => {
    setPage(0);
  }, [
    search,
    genFilter,
    typeFilter,
    sortBy,
    showLegendary,
    showMythical,
    showFavOnly,
    showCapturedOnly,
    showUncapturedOnly,
  ]);

  // ── Toggles ────────────────────────────────────────────────────────────────
  const toggleFav = (e, id) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(id)
        ? prev.filter((f) => f !== id)
        : [...prev, id];
      localStorage.setItem("poke-favorites", JSON.stringify(next));
      return next;
    });
  };

  const toggleCaptured = (e, id) => {
    e.stopPropagation();
    setCaptured((prev) => {
      const next = prev.includes(id)
        ? prev.filter((f) => f !== id)
        : [...prev, id];
      localStorage.setItem("poke-captured", JSON.stringify(next));
      return next;
    });
  };

  // ── Filter + Sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = pokemons.filter((p) => {
      if (
        search &&
        !p.nameFr.toLowerCase().includes(search.toLowerCase()) &&
        !String(p.id).includes(search)
      )
        return false;
      if (genFilter) {
        const gen = GENERATIONS.find((g) => g.label === genFilter);
        if (gen && (p.id < gen.min || p.id > gen.max)) return false;
      }
      if (typeFilter && !p.types.includes(typeFilter)) return false;
      if (showLegendary && !p.isLegendary) return false;
      if (showMythical && !p.isMythical) return false;
      if (showFavOnly && !favorites.includes(p.id)) return false;
      if (showCapturedOnly && !captured.includes(p.id)) return false;
      if (showUncapturedOnly && captured.includes(p.id)) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "name") return a.nameFr.localeCompare(b.nameFr);
      if (sortBy === "total") return b.total - a.total;
      if (sortBy in (a.stats ?? {}))
        return (b.stats[sortBy] ?? 0) - (a.stats[sortBy] ?? 0);
      return a.id - b.id;
    });
  }, [
    pokemons,
    search,
    genFilter,
    typeFilter,
    sortBy,
    showLegendary,
    showMythical,
    showFavOnly,
    showCapturedOnly,
    showUncapturedOnly,
    favorites,
    captured,
  ]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const handleClick = (p) => navigate(`/pokemon/${p.id}`);

  const activeFiltersCount = [
    genFilter,
    typeFilter,
    showLegendary,
    showMythical,
    showFavOnly,
    showCapturedOnly,
    showUncapturedOnly,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setGenFilter(null);
    setTypeFilter(null);
    setShowLegendary(false);
    setShowMythical(false);
    setShowFavOnly(false);
    setShowCapturedOnly(false);
    setShowUncapturedOnly(false);
    setSortBy("id");
  };

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (pokemons.length < TOTAL) {
    return (
      <div className="pokedex-shell">
        <div className="pokedex-header">POKEDEX</div>
        <div className="screen-frame">
          <div className="screen">
            <div className="loading">
              <div className="loading-text">CHARGEMENT...</div>
              <div className="loading-bar-track">
                <div
                  className="loading-bar-fill"
                  style={{ width: `${(loadedCount / TOTAL) * 100}%` }}
                />
              </div>
              <div className="loading-count">
                {loadedCount} / {TOTAL}
              </div>
            </div>
          </div>
        </div>
        <div className="pokedex-bottom">
          <div className="d-pad">
            {[...Array(9)].map((_, i) => (
              <div key={i} className={i === 4 ? "d-pad-center" : "d-pad-btn"} />
            ))}
          </div>
          <div className="action-btn" />
          <div className="action-btn" />
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div className="pokedex-shell">
      <div className="pokedex-header">POKEDEX</div>

      <div className="screen-frame">
        <div className="screen">
          {/* Capture progress */}
          <div className="capture-progress">
            <div className="capture-progress-bar">
              <div
                className="capture-progress-fill"
                style={{ width: `${(captured.length / TOTAL) * 100}%` }}
              />
            </div>
            <span className="capture-progress-label">
              {captured.length} / {TOTAL} captures
            </span>
          </div>

          <SearchBar value={search} onChange={setSearch} />

          {/* Toolbar */}
          <div className="list-toolbar">
            <span className="pokemon-count">
              {filtered.length} / {pokemons.length}
            </span>
            <div className="toolbar-btns">
              <button
                className={
                  "filter-toggle-btn" +
                  (showFilters ? " active" : "") +
                  (activeFiltersCount > 0 ? " has-filters" : "")
                }
                onClick={() => setShowFilters((v) => !v)}
              >
                {activeFiltersCount > 0
                  ? `FILTRES (${activeFiltersCount})`
                  : "FILTRES"}
              </button>
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="filter-panel">
              <div className="filter-section-label">GENERATION</div>
              <div className="filter-chips">
                <button
                  className={"chip" + (!genFilter ? " active" : "")}
                  onClick={() => setGenFilter(null)}
                >
                  TOUTES
                </button>
                {GENERATIONS.map((g) => (
                  <button
                    key={g.label}
                    className={
                      "chip" + (genFilter === g.label ? " active" : "")
                    }
                    onClick={() =>
                      setGenFilter(genFilter === g.label ? null : g.label)
                    }
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              <div className="filter-section-label">TYPE</div>
              <div className="filter-chips">
                <button
                  className={"chip" + (!typeFilter ? " active" : "")}
                  onClick={() => setTypeFilter(null)}
                >
                  TOUS
                </button>
                {TYPES.map((t) => (
                  <button
                    key={t}
                    className={
                      "chip type-chip" + (typeFilter === t ? " active" : "")
                    }
                    style={{ "--type-color": TYPE_COLORS[t] }}
                    onClick={() => setTypeFilter(typeFilter === t ? null : t)}
                  >
                    {TYPE_FR[t]}
                  </button>
                ))}
              </div>

              <div className="filter-section-label">SPECIAL</div>
              <div className="filter-chips">
                <button
                  className={"chip" + (showLegendary ? " active" : "")}
                  onClick={() => setShowLegendary((v) => !v)}
                >
                  Legendaire
                </button>
                <button
                  className={"chip" + (showMythical ? " active" : "")}
                  onClick={() => setShowMythical((v) => !v)}
                >
                  Mythique
                </button>
                <button
                  className={"chip" + (showFavOnly ? " active" : "")}
                  onClick={() => setShowFavOnly((v) => !v)}
                >
                  ★ Favoris
                </button>
                <button
                  className={"chip" + (showCapturedOnly ? " active" : "")}
                  onClick={() => {
                    setShowCapturedOnly((v) => !v);
                    setShowUncapturedOnly(false);
                  }}
                >
                  ⚪ Captures
                </button>
                <button
                  className={"chip" + (showUncapturedOnly ? " active" : "")}
                  onClick={() => {
                    setShowUncapturedOnly((v) => !v);
                    setShowCapturedOnly(false);
                  }}
                >
                  ○ Non captures
                </button>
                {activeFiltersCount > 0 && (
                  <button className="chip reset-chip" onClick={resetFilters}>
                    ✕ Reset
                  </button>
                )}
              </div>
            </div>
          )}

          {/* List */}
          <div className="pokemon-list">
            {paginated.length === 0 ? (
              <div className="no-result">AUCUN RESULTAT</div>
            ) : (
              paginated.map((p) => (
                <div
                  key={p.id}
                  className="pokemon-item"
                  onClick={() => handleClick(p)}
                >
                  <span className="pokemon-number">
                    #{String(p.id).padStart(3, "0")}
                  </span>
                  <span className="pokemon-name">{p.nameFr}</span>
                  <div className="pokemon-types">
                    {p.types.map((t) => (
                      <span
                        key={t}
                        className="type-dot"
                        style={{ background: TYPE_COLORS[t] }}
                        title={TYPE_FR[t]}
                      />
                    ))}
                  </div>
                  {p.isLegendary && (
                    <span className="badge legend" title="Legendaire">
                      L
                    </span>
                  )}
                  {p.isMythical && (
                    <span className="badge mythic" title="Mythique">
                      M
                    </span>
                  )}
                  <span
                    className={
                      "pokeball-icon" +
                      (captured.includes(p.id) ? " captured" : "")
                    }
                    onClick={(e) => toggleCaptured(e, p.id)}
                    title={captured.includes(p.id) ? "Capture" : "Non capture"}
                  >
                    {captured.includes(p.id) ? "⚪" : "○"}
                  </span>
                  <span
                    className={
                      "fav-star" + (favorites.includes(p.id) ? " active" : "")
                    }
                    onClick={(e) => toggleFav(e, p.id)}
                    title="Favori"
                  >
                    {favorites.includes(p.id) ? "★" : "☆"}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                ◀ PREC
              </button>
              <span className="page-info">
                {page + 1} / {totalPages}
              </span>
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
              >
                SUIV ▶
              </button>
            </div>
          )}
          {totalPages > 1 && (
            <div className="goto-page">
              <input
                className="goto-input"
                type="number"
                min={1}
                max={totalPages}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const n = parseInt(pageInput, 10);
                    if (!isNaN(n) && n >= 1 && n <= totalPages) {
                      setPage(n - 1);
                      setPageInput("");
                    }
                  }
                }}
                placeholder="N°"
              />
              <button
                className="goto-btn"
                onClick={() => {
                  const n = parseInt(pageInput, 10);
                  if (!isNaN(n) && n >= 1 && n <= totalPages) {
                    setPage(n - 1);
                    setPageInput("");
                  }
                }}
              >
                GO
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="pokedex-bottom">
        <div className="d-pad">
          {[...Array(9)].map((_, i) => (
            <div key={i} className={i === 4 ? "d-pad-center" : "d-pad-btn"} />
          ))}
        </div>
        <div className="action-btn" />
        <div className="action-btn" />
      </div>
      <a
        href="https://github.com/keyember"
        className="author-credit"
        target="_blank" /* Ouvre dans un nouvel onglet */
        rel="noopener noreferrer" /* Sécurité recommandée */
      >
        <p className="author-text">by Keyember</p>
        <img src="/github.png" alt="Logo Github" className="github-logo" />
      </a>
    </div>
  );
}
