import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import { usePokemonData } from "./usePokemonData";
import {
  GENERATIONS,
  TYPE_FR,
  TYPE_COLORS,
  TYPES,
  SORT_OPTIONS,
} from "./pokemonConstants";
import "./PokedexList.css";

const TOTAL = 1025;
const PAGE_SIZE = 10;

function getSpriteUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

// Wrapper qui remet page à 0 automatiquement quand un filtre change
function usePagedFilters() {
  const [state, setState] = useState({
    search: "",
    genFilter: null,
    typeFilter: null,
    sortBy: "id",
    showLegendary: false,
    showMythical: false,
    showFavOnly: false,
    showCapturedOnly: false,
    showUncapturedOnly: false,
    page: 0,
  });

  const setFilter = (key, value) =>
    setState((prev) => ({ ...prev, [key]: value, page: 0 }));

  const setPage = (value) =>
    setState((prev) => ({
      ...prev,
      page: typeof value === "function" ? value(prev.page) : value,
    }));

  const resetFilters = () =>
    setState((prev) => ({
      ...prev,
      genFilter: null,
      typeFilter: null,
      sortBy: "id",
      showLegendary: false,
      showMythical: false,
      showFavOnly: false,
      showCapturedOnly: false,
      showUncapturedOnly: false,
      page: 0,
    }));

  return { ...state, setFilter, setPage, resetFilters };
}

export default function PokedexList() {
  const { pokemons, loadedCount, isReady } = usePokemonData();

  const {
    search,
    genFilter,
    typeFilter,
    sortBy,
    showFilters: _sf, // géré séparément car ne reset pas la page
    showLegendary,
    showMythical,
    showFavOnly,
    showCapturedOnly,
    showUncapturedOnly,
    page,
    setFilter,
    setPage,
    resetFilters,
  } = usePagedFilters();

  const [showFilters, setShowFilters] = useState(false);
  const [pageInput, setPageInput] = useState("");
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
  const safePage = Math.min(page, Math.max(0, totalPages - 1));
  const paginated = filtered.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE,
  );

  const activeFiltersCount = [
    genFilter,
    typeFilter,
    showLegendary,
    showMythical,
    showFavOnly,
    showCapturedOnly,
    showUncapturedOnly,
  ].filter(Boolean).length;

  if (!isReady && pokemons.length < 50) {
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

  return (
    <div className="pokedex-shell">
      <div className="pokedex-header">POKEDEX</div>

      <div className="screen-frame">
        <div className="screen">
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

          {!isReady && (
            <div className="bg-loading-bar">
              <div
                className="bg-loading-fill"
                style={{ width: `${(loadedCount / TOTAL) * 100}%` }}
              />
              <span className="bg-loading-label">
                {loadedCount} / {TOTAL}
              </span>
            </div>
          )}

          <SearchBar value={search} onChange={(v) => setFilter("search", v)} />

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
                onChange={(e) => setFilter("sortBy", e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {showFilters && (
            <div className="filter-panel">
              <div className="filter-section-label">GENERATION</div>
              <div className="filter-chips">
                <button
                  className={"chip" + (!genFilter ? " active" : "")}
                  onClick={() => setFilter("genFilter", null)}
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
                      setFilter(
                        "genFilter",
                        genFilter === g.label ? null : g.label,
                      )
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
                  onClick={() => setFilter("typeFilter", null)}
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
                    onClick={() =>
                      setFilter("typeFilter", typeFilter === t ? null : t)
                    }
                  >
                    {TYPE_FR[t]}
                  </button>
                ))}
              </div>

              <div className="filter-section-label">SPECIAL</div>
              <div className="filter-chips">
                <button
                  className={"chip" + (showLegendary ? " active" : "")}
                  onClick={() => setFilter("showLegendary", !showLegendary)}
                >
                  Legendaire
                </button>
                <button
                  className={"chip" + (showMythical ? " active" : "")}
                  onClick={() => setFilter("showMythical", !showMythical)}
                >
                  Mythique
                </button>
                <button
                  className={"chip" + (showFavOnly ? " active" : "")}
                  onClick={() => setFilter("showFavOnly", !showFavOnly)}
                >
                  ★ Favoris
                </button>
                <button
                  className={"chip" + (showCapturedOnly ? " active" : "")}
                  onClick={() => {
                    setFilter("showCapturedOnly", !showCapturedOnly);
                    setFilter("showUncapturedOnly", false);
                  }}
                >
                  ⚪ Captures
                </button>
                <button
                  className={"chip" + (showUncapturedOnly ? " active" : "")}
                  onClick={() => {
                    setFilter("showUncapturedOnly", !showUncapturedOnly);
                    setFilter("showCapturedOnly", false);
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

          <div className="pokemon-list">
            {paginated.length === 0 ? (
              <div className="no-result">AUCUN RESULTAT</div>
            ) : (
              paginated.map((p) => (
                <div
                  key={p.id}
                  className="pokemon-item"
                  onClick={() => navigate(`/pokemon/${p.id}`)}
                >
                  <img
                    className="pokemon-sprite-thumb"
                    src={p.sprite || getSpriteUrl(p.id)}
                    alt={p.nameFr}
                    loading="lazy"
                  />
                  <span className="pokemon-number">
                    #{String(p.id).padStart(3, "0")}
                  </span>
                  <span className="pokemon-name">{p.nameFr}</span>
                  <div className="pokemon-types">
                    {p.types.map((t) => (
                      <span
                        key={t}
                        className="type-badge-small"
                        style={{ background: TYPE_COLORS[t] }}
                        title={TYPE_FR[t]}
                      >
                        {TYPE_FR[t]}
                      </span>
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

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
              >
                ◀ PREC
              </button>
              <span className="page-info">
                {safePage + 1} / {totalPages}
              </span>
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage === totalPages - 1}
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
        target="_blank"
        rel="noopener noreferrer"
      >
        <p className="author-text">by Keyember</p>
        <img src="/github.png" alt="Logo Github" className="github-logo" />
      </a>
    </div>
  );
}
