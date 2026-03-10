import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TYPE_FR, TYPE_COLORS } from "./pokemonConstants";
import "./PokemonDetail.css";

const STAT_FR = {
  hp: "PV",
  attack: "Attaque",
  defense: "Defense",
  "special-attack": "Att. Spe",
  "special-defense": "Def. Spe",
  speed: "Vitesse",
};

const MAX_ID = 1025;

const DAMAGE_CLASS_FR = {
  physical: "Physique",
  special: "Special",
  status: "Statut",
};

// ── Evolution helpers ──────────────────────────────────────────────────────────
function flattenChain(node, trigger = null) {
  const results = [{ name: node.species.name, trigger }];
  for (const next of node.evolves_to) {
    results.push(...flattenChain(next, next.evolution_details[0] ?? {}));
  }
  return results;
}

function describeEvolution(detail) {
  if (!detail) return null;
  const parts = [];
  if (detail.min_level) parts.push(`Niv. ${detail.min_level}`);
  if (detail.item)
    parts.push(`Pierre : ${detail.item.name.replace(/-/g, " ")}`);
  if (detail.held_item)
    parts.push(`Objet tenu : ${detail.held_item.name.replace(/-/g, " ")}`);
  if (detail.known_move)
    parts.push(`Apprendre : ${detail.known_move.name.replace(/-/g, " ")}`);
  if (detail.location)
    parts.push(`Lieu : ${detail.location.name.replace(/-/g, " ")}`);
  if (detail.min_happiness && detail.min_happiness > 0)
    parts.push(`Bonheur >= ${detail.min_happiness}`);
  if (detail.min_affection && detail.min_affection > 0)
    parts.push(`Affection >= ${detail.min_affection}`);
  if (detail.time_of_day)
    parts.push(
      detail.time_of_day === "day"
        ? "Jour"
        : detail.time_of_day === "night"
          ? "Nuit"
          : detail.time_of_day,
    );
  if (detail.gender !== null && detail.gender !== undefined)
    parts.push(detail.gender === 1 ? "Femelle" : "Male");
  if (detail.needs_overworld_rain) parts.push("Sous la pluie");
  if (detail.turn_upside_down) parts.push("Retourner console");
  if (
    detail.relative_physical_stats !== null &&
    detail.relative_physical_stats !== undefined
  ) {
    const s = detail.relative_physical_stats;
    parts.push(s > 0 ? "Att > Def" : s < 0 ? "Def > Att" : "Att = Def");
  }
  if (detail.trade_species)
    parts.push(`Echange : ${detail.trade_species.name}`);
  else if (detail.trigger?.name === "trade") parts.push("Echange");
  return parts.length > 0 ? parts.join(" · ") : null;
}

// ── Comparator mini-component ──────────────────────────────────────────────────
function StatComparator({ statsA, nameA, statsB, nameB, onClose }) {
  const statKeys = [
    "hp",
    "attack",
    "defense",
    "special-attack",
    "special-defense",
    "speed",
  ];
  return (
    <div className="comparator">
      <div className="comparator-header">
        <span className="comparator-name">{nameA}</span>
        <span className="comparator-vs">VS</span>
        <span className="comparator-name">{nameB}</span>
        <button className="comparator-close" onClick={onClose}>
          ✕
        </button>
      </div>
      {statKeys.map((key) => {
        const a = statsA[key] ?? 0;
        const b = statsB[key] ?? 0;
        return (
          <div key={key} className="cmp-row">
            <span
              className={"cmp-val" + (a > b ? " win" : a < b ? " lose" : "")}
            >
              {a}
            </span>
            <div className="cmp-bars">
              <div
                className="cmp-bar-a"
                style={{
                  width: `${(a / 255) * 100}%`,
                  opacity: a >= b ? 1 : 0.45,
                }}
              />
              <span className="cmp-label">{STAT_FR[key]}</span>
              <div
                className="cmp-bar-b"
                style={{
                  width: `${(b / 255) * 100}%`,
                  opacity: b >= a ? 1 : 0.45,
                }}
              />
            </div>
            <span
              className={
                "cmp-val right" + (b > a ? " win" : b < a ? " lose" : "")
              }
            >
              {b}
            </span>
          </div>
        );
      })}
      <div className="cmp-total-row">
        <span
          className={
            "cmp-val" +
            (Object.values(statsA).reduce((s, v) => s + v, 0) >
            Object.values(statsB).reduce((s, v) => s + v, 0)
              ? " win"
              : " lose")
          }
        >
          {Object.values(statsA).reduce((s, v) => s + v, 0)}
        </span>
        <span className="cmp-total-label">TOTAL</span>
        <span
          className={
            "cmp-val right" +
            (Object.values(statsB).reduce((s, v) => s + v, 0) >
            Object.values(statsA).reduce((s, v) => s + v, 0)
              ? " win"
              : " lose")
          }
        >
          {Object.values(statsB).reduce((s, v) => s + v, 0)}
        </span>
      </div>
    </div>
  );
}

export default function PokemonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const numId = parseInt(id ?? "0", 10);

  const [data, setData] = useState({ pokemon: null, species: null });
  const [evoChain, setEvoChain] = useState(null);
  const [moves, setMoves] = useState([]);
  const [movesLoading, setMovesLoading] = useState(false);
  const [showMoves, setShowMoves] = useState(false);
  const [compareId, setCompareId] = useState("");
  const [compareData, setCompareData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [shiny, setShiny] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);
  const [cryPlaying, setCryPlaying] = useState(false);
  const audioRef = useRef(null);

  // ── Fetch main data ──────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setData({ pokemon: null, species: null });
      setEvoChain(null);
      setMoves([]);
      setShowMoves(false);
      setCompareData(null);
      setCompareId("");
      setShiny(false);

      try {
        const [respPokemon, respSpecies] = await Promise.all([
          fetch(`https://pokeapi.co/api/v2/pokemon/${numId}`),
          fetch(`https://pokeapi.co/api/v2/pokemon-species/${numId}`),
        ]);
        const pokemon = await respPokemon.json();
        const species = await respSpecies.json();
        setData({ pokemon, species });

        // Evolution chain
        const respEvo = await fetch(species.evolution_chain.url);
        const evoData = await respEvo.json();
        const flatNodes = flattenChain(evoData.chain);
        const enriched = await Promise.all(
          flatNodes.map(async (node) => {
            try {
              const [rSp, rPk] = await Promise.all([
                fetch(`https://pokeapi.co/api/v2/pokemon-species/${node.name}`),
                fetch(`https://pokeapi.co/api/v2/pokemon/${node.name}`),
              ]);
              const spJson = await rSp.json();
              const pkJson = await rPk.json();
              const frObj = spJson.names.find((n) => n.language.name === "fr");
              return {
                ...node,
                id: spJson.id,
                nameFr: frObj ? frObj.name : spJson.name,
                sprite: pkJson.sprites.front_default,
              };
            } catch {
              return { ...node, id: null, nameFr: node.name, sprite: null };
            }
          }),
        );
        setEvoChain(enriched);
      } catch (err) {
        console.error("Error fetching detail:", err);
      }

      try {
        const favs = JSON.parse(localStorage.getItem("poke-favorites") || "[]");
        setIsFav(favs.includes(numId));
      } catch {
        setIsFav(false);
      }
      try {
        const caps = JSON.parse(localStorage.getItem("poke-captured") || "[]");
        setIsCaptured(caps.includes(numId));
      } catch {
        setIsCaptured(false);
      }
    };

    fetchData();
  }, [numId]);

  // ── Fetch moves on demand ────────────────────────────────────────────────────
  const loadMoves = async () => {
    if (!data.pokemon || moves.length > 0) {
      setShowMoves((v) => !v);
      return;
    }
    setShowMoves(true);
    setMovesLoading(true);
    try {
      const moveDetails = await Promise.all(
        data.pokemon.moves.slice(0, 60).map(async (m) => {
          const res = await fetch(m.move.url);
          const json = await res.json();
          const frName = json.names?.find((n) => n.language.name === "fr");
          return {
            name: frName ? frName.name : m.move.name,
            type: json.type?.name,
            power: json.power,
            accuracy: json.accuracy,
            pp: json.pp,
            damageClass: json.damage_class?.name,
          };
        }),
      );
      setMoves(moveDetails);
    } catch (err) {
      console.error("Error fetching moves:", err);
    }
    setMovesLoading(false);
  };

  // ── Fetch comparator ─────────────────────────────────────────────────────────
  const loadCompare = async () => {
    const n = parseInt(compareId, 10);
    if (isNaN(n) || n < 1 || n > MAX_ID || n === numId) return;
    setCompareLoading(true);
    try {
      const [rSp, rPk] = await Promise.all([
        fetch(`https://pokeapi.co/api/v2/pokemon-species/${n}`),
        fetch(`https://pokeapi.co/api/v2/pokemon/${n}`),
      ]);
      const spJson = await rSp.json();
      const pkJson = await rPk.json();
      const frObj = spJson.names.find((nn) => nn.language.name === "fr");
      const statsMap = {};
      for (const s of pkJson.stats) statsMap[s.stat.name] = s.base_stat;
      setCompareData({
        nameFr: frObj ? frObj.name : spJson.name,
        stats: statsMap,
      });
    } catch (err) {
      console.error("Error fetching compare:", err);
    }
    setCompareLoading(false);
  };

  // ── Toggles ──────────────────────────────────────────────────────────────────
  const toggleFav = () => {
    setIsFav((prev) => {
      const next = !prev;
      try {
        const favs = JSON.parse(localStorage.getItem("poke-favorites") || "[]");
        localStorage.setItem(
          "poke-favorites",
          JSON.stringify(
            next ? [...favs, numId] : favs.filter((f) => f !== numId),
          ),
        );
      } catch {
        /* localStorage not available */
      }
      return next;
    });
  };

  const toggleCaptured = () => {
    setIsCaptured((prev) => {
      const next = !prev;
      try {
        const caps = JSON.parse(localStorage.getItem("poke-captured") || "[]");
        localStorage.setItem(
          "poke-captured",
          JSON.stringify(
            next ? [...caps, numId] : caps.filter((f) => f !== numId),
          ),
        );
      } catch {
        /* localStorage not available */
      }
      return next;
    });
  };

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
  const statsMap = {};
  for (const s of pokemon.stats) statsMap[s.stat.name] = s.base_stat;

  return (
    <div className="detail-shell">
      <div className="pokedex-header">POKEDEX</div>
      <div className="screen-frame">
        <div className="screen">
          {/* Nav */}
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
                  title="Toggle shiny"
                >
                  ✨
                </button>
                <button
                  className={"cry-btn" + (cryPlaying ? " playing" : "")}
                  onClick={playCry}
                  title="Play cry"
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
                <div className="detail-actions">
                  <button
                    className={"capture-btn" + (isCaptured ? " active" : "")}
                    onClick={toggleCaptured}
                  >
                    {isCaptured ? "⚪" : "○"}
                  </button>
                  <button
                    className={"fav-btn" + (isFav ? " active" : "")}
                    onClick={toggleFav}
                  >
                    {isFav ? "★" : "☆"}
                  </button>
                </div>
              </div>
              <div className="detail-name">{nameFr.toUpperCase()}</div>
              <div className="types-row">
                {pokemon.types.map((t) => (
                  <span
                    key={t.type.name}
                    className="type-badge"
                    style={{
                      background:
                        TYPE_COLORS[t.type.name] ?? "var(--screen-dark)",
                      color: "white",
                    }}
                  >
                    {TYPE_FR[t.type.name] || t.type.name}
                  </span>
                ))}
              </div>
              <div className="detail-physical">
                <span>⬆ {(pokemon.height / 10).toFixed(1)} m</span>
                <span>⚖ {(pokemon.weight / 10).toFixed(1)} kg</span>
              </div>
              {(species.is_legendary || species.is_mythical) && (
                <div className="detail-special-badges">
                  {species.is_legendary && (
                    <span className="special-badge legend">Legendaire</span>
                  )}
                  {species.is_mythical && (
                    <span className="special-badge mythic">Mythique</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="detail-flavor">{flavor}</div>

          {/* Stats */}
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
          <div className="stat-total">
            TOTAL : {pokemon.stats.reduce((acc, s) => acc + s.base_stat, 0)}
          </div>

          {/* Comparator */}
          <div className="comparator-section">
            <div className="section-title">── COMPARER ──</div>
            {!compareData ? (
              <div className="comparator-input-row">
                <input
                  className="cmp-input"
                  type="number"
                  min={1}
                  max={MAX_ID}
                  placeholder="N° pokemon"
                  value={compareId}
                  onChange={(e) => setCompareId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loadCompare();
                  }}
                />
                <button
                  className="cmp-btn"
                  onClick={loadCompare}
                  disabled={compareLoading}
                >
                  {compareLoading ? "..." : "GO"}
                </button>
              </div>
            ) : (
              <StatComparator
                statsA={statsMap}
                nameA={nameFr}
                statsB={compareData.stats}
                nameB={compareData.nameFr}
                onClose={() => {
                  setCompareData(null);
                  setCompareId("");
                }}
              />
            )}
          </div>

          {/* Moves */}
          <div className="moves-section">
            <div
              className="section-title"
              style={{ cursor: "pointer" }}
              onClick={loadMoves}
            >
              ── ATTAQUES {showMoves ? "▲" : "▼"} ──
            </div>
            {showMoves &&
              (movesLoading ? (
                <div className="moves-loading">Chargement...</div>
              ) : (
                <div className="moves-table">
                  <div className="moves-thead">
                    <span>NOM</span>
                    <span>TYPE</span>
                    <span>CAT</span>
                    <span>PUI</span>
                    <span>PRE</span>
                    <span>PP</span>
                  </div>
                  {moves.map((m, i) => (
                    <div key={i} className="moves-row">
                      <span className="move-name">{m.name}</span>
                      <span
                        className="move-type"
                        style={{
                          background: TYPE_COLORS[m.type] ?? "#888",
                          color: "white",
                        }}
                      >
                        {TYPE_FR[m.type] || m.type || "—"}
                      </span>
                      <span className="move-cat">
                        {DAMAGE_CLASS_FR[m.damageClass] || "—"}
                      </span>
                      <span className="move-stat">{m.power ?? "—"}</span>
                      <span className="move-stat">{m.accuracy ?? "—"}</span>
                      <span className="move-stat">{m.pp ?? "—"}</span>
                    </div>
                  ))}
                  {data.pokemon.moves.length > 60 && (
                    <div className="moves-more">
                      + {data.pokemon.moves.length - 60} attaques non affichees
                    </div>
                  )}
                </div>
              ))}
          </div>

          {/* Evolutions */}
          {evoChain && evoChain.length > 1 && (
            <>
              <div className="evo-title">── EVOLUTIONS ──</div>
              <div className="evo-chain">
                {evoChain.map((evo, idx) => {
                  const isCurrent = evo.id === numId;
                  const triggerText =
                    idx > 0 ? describeEvolution(evo.trigger) : null;
                  return (
                    <div key={evo.name} className="evo-entry">
                      {idx > 0 && (
                        <div className="evo-arrow">
                          <span className="evo-arrow-icon">▶</span>
                          {triggerText && (
                            <span className="evo-trigger">{triggerText}</span>
                          )}
                        </div>
                      )}
                      <div
                        className={
                          "evo-card" +
                          (isCurrent ? " current" : "") +
                          (evo.id && !isCurrent ? " clickable" : "")
                        }
                        onClick={() =>
                          evo.id && !isCurrent && navigate(`/pokemon/${evo.id}`)
                        }
                      >
                        {evo.sprite ? (
                          <img
                            className="evo-sprite"
                            src={evo.sprite}
                            alt={evo.nameFr}
                          />
                        ) : (
                          <div className="evo-sprite-placeholder">?</div>
                        )}
                        <span className="evo-name">{evo.nameFr}</span>
                        {evo.id && (
                          <span className="evo-num">
                            #{String(evo.id).padStart(3, "0")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {evoChain && evoChain.length <= 1 && (
            <div className="evo-none">── PAS D'EVOLUTION ──</div>
          )}
          {!evoChain && pokemon && (
            <div className="evo-loading">Chargement evolutions...</div>
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
