import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PokemonDetail.css";

const TYPE_FR = {
  normal: "Normal",
  fire: "Feu",
  water: "Eau",
  electric: "Électrik",
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
  dark: "Ténèbres",
  steel: "Acier",
  fairy: "Fée",
};

const STAT_FR = {
  hp: "PV",
  attack: "Attaque",
  defense: "Défense",
  "special-attack": "Att. Spé",
  "special-defense": "Déf. Spé",
  speed: "Vitesse",
};

const MAX_ID = 1025;

export default function PokemonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const numId = parseInt(id ?? "0", 10);

  const [data, setData] = useState({ pokemon: null, species: null });
  const [shiny, setShiny] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [cryPlaying, setCryPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      // Reset au début de la fonction async, pas dans le corps de l'effet
      setData({ pokemon: null, species: null });
      setShiny(false);

      try {
        const [respPokemon, respSpecies] = await Promise.all([
          fetch(`https://pokeapi.co/api/v2/pokemon/${numId}`),
          fetch(`https://pokeapi.co/api/v2/pokemon-species/${numId}`),
        ]);
        const pokemon = await respPokemon.json();
        const species = await respSpecies.json();
        setData({ pokemon, species });
      } catch (err) {
        console.error("Erreur fetch detail:", err);
      }

      // Load favorite state
      try {
        const favs = JSON.parse(localStorage.getItem("poke-favorites") || "[]");
        setIsFav(favs.includes(numId));
      } catch {
        setIsFav(false);
      }
    };

    fetchData();
  }, [numId]);

  // Favorite toggle
  const toggleFav = () => {
    setIsFav((prev) => {
      const next = !prev;
      try {
        const favs = JSON.parse(localStorage.getItem("poke-favorites") || "[]");
        const updated = next
          ? [...favs, numId]
          : favs.filter((f) => f !== numId);
        localStorage.setItem("poke-favorites", JSON.stringify(updated));
      } catch {
        /* localStorage not available */
      }
      return next;
    });
  };

  // Play cry
  const playCry = () => {
    if (!data.pokemon) return;
    const cryUrl = data.pokemon.cries?.latest;
    if (!cryUrl) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(cryUrl);
    audioRef.current = audio;
    setCryPlaying(true);
    audio.play();
    audio.onended = () => setCryPlaying(false);
  };

  const { pokemon, species } = data;

  if (!pokemon || !species) {
    return (
      <div className="detail-shell">
        <div className="pokedex-header">POKEDEX</div>
        <div className="screen-frame">
          <div className="screen">
            <div className="detail-loading">
              <span className="loading-text">CHARGEMENT...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const frNameObj = species.names.find((n) => n.language.name === "fr");
  const nameFr = frNameObj ? frNameObj.name : species.name;

  const frFlavorObj = species.flavor_text_entries.find(
    (e) => e.language.name === "fr",
  );
  const flavor = frFlavorObj
    ? frFlavorObj.flavor_text.replace(/\f|\n/g, " ")
    : "—";

  const sprite = shiny
    ? pokemon.sprites.front_shiny
    : pokemon.sprites.front_default;

  return (
    <div className="detail-shell">
      <div className="pokedex-header">POKEDEX</div>

      <div className="screen-frame">
        <div className="screen">
          {/* Nav bar */}
          <div className="detail-nav">
            <div className="detail-back" onClick={() => navigate("/")}>
              ◀ LISTE
            </div>
            <div className="detail-nav-arrows">
              <button
                className="nav-arrow"
                onClick={() => navigate(`/pokemon/${numId - 1}`)}
                disabled={numId <= 1}
              >
                ◀
              </button>
              <button
                className="nav-arrow"
                onClick={() => navigate(`/pokemon/${numId + 1}`)}
                disabled={numId >= MAX_ID}
              >
                ▶
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="detail-header">
            <div className="sprite-container">
              {sprite && (
                <img className="detail-sprite" src={sprite} alt={nameFr} />
              )}
              <div className="sprite-actions">
                <button
                  className={"shiny-btn" + (shiny ? " active" : "")}
                  onClick={() => setShiny((v) => !v)}
                  title="Voir shiny"
                >
                  ✨
                </button>
                <button
                  className={"cry-btn" + (cryPlaying ? " playing" : "")}
                  onClick={playCry}
                  title="Écouter le cri"
                >
                  🔊
                </button>
              </div>
            </div>

            <div className="detail-info">
              <div className="detail-number-fav">
                <div className="detail-number">
                  N°{String(pokemon.id).padStart(3, "0")}
                </div>
                <button
                  className={"fav-btn" + (isFav ? " active" : "")}
                  onClick={toggleFav}
                  title="Favori"
                >
                  {isFav ? "★" : "☆"}
                </button>
              </div>
              <div className="detail-name">{nameFr.toUpperCase()}</div>
              <div className="types-row">
                {pokemon.types.map((t) => (
                  <span
                    key={t.type.name}
                    className={"type-badge type-" + t.type.name}
                  >
                    {TYPE_FR[t.type.name] || t.type.name}
                  </span>
                ))}
              </div>
              <div className="detail-physical">
                <span>⬆ {(pokemon.height / 10).toFixed(1)} m</span>
                <span>⚖ {(pokemon.weight / 10).toFixed(1)} kg</span>
              </div>
            </div>
          </div>

          <div className="detail-flavor">{flavor}</div>

          <div className="stats-title">── STATS ──</div>
          {pokemon.stats.map((s) => (
            <div key={s.stat.name} className="stat-row">
              <span className="stat-name">
                {STAT_FR[s.stat.name] || s.stat.name}
              </span>
              <div className="stat-bar-track">
                <div
                  className="stat-bar-fill"
                  style={{
                    width: `${Math.min(100, (s.base_stat / 255) * 100)}%`,
                  }}
                />
              </div>
              <span className="stat-val">{s.base_stat}</span>
            </div>
          ))}
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
