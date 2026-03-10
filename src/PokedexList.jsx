import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import "./PokedexList.css";

const TOTAL = 1025;
const PAGE_SIZE = 10;

export default function PokedexList() {
  const [pokemons, setPokemons] = useState([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("poke-favorites") || "[]");
    } catch {
      return [];
    }
  });
  const [showFavOnly, setShowFavOnly] = useState(false);
  const navigate = useNavigate();

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
              const res = await fetch(specie.url);
              const json = await res.json();
              const frObj = json.names.find((n) => n.language.name === "fr");
              return {
                idx: i + bi,
                entry: {
                  id: json.id,
                  nameEn: json.name,
                  nameFr: frObj ? frObj.name : json.name,
                },
              };
            }),
          );
          if (cancelled) return;
          for (const { idx, entry } of fetched) {
            results[idx] = entry;
          }
          // Valeur absolue pour eviter les doublons du StrictMode
          setLoadedCount(Math.min(i + BATCH, speciesList.length));
        }

        if (!cancelled) {
          setPokemons(results.filter(Boolean));
        }
      } catch (err) {
        console.error("Error fetching species:", err);
      }
    };

    fetchSpecies();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const resetPage = () => setPage(0);
    resetPage();
  }, [search, showFavOnly]);

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

  const filtered = pokemons.filter((p) => {
    const matchSearch =
      p.nameFr.toLowerCase().includes(search.toLowerCase()) ||
      String(p.id).includes(search);
    const matchFav = showFavOnly ? favorites.includes(p.id) : true;
    return matchSearch && matchFav;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleClick = (pokemon) => navigate(`/pokemon/${pokemon.id}`);

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

  return (
    <div className="pokedex-shell">
      <div className="pokedex-header">POKEDEX</div>

      <div className="screen-frame">
        <div className="screen">
          <SearchBar value={search} onChange={setSearch} />

          <div className="list-toolbar">
            <span className="pokemon-count">{filtered.length} POKEMON(S)</span>
            <button
              className={"fav-filter-btn" + (showFavOnly ? " active" : "")}
              onClick={() => setShowFavOnly((v) => !v)}
              title="Show favorites"
            >
              {showFavOnly ? "★ FAVS" : "☆ FAVS"}
            </button>
          </div>

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
                  <span
                    className={
                      "fav-star" + (favorites.includes(p.id) ? " active" : "")
                    }
                    onClick={(e) => toggleFav(e, p.id)}
                    title="Favorite"
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
