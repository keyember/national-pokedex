import { useState, useEffect } from "react";

const TOTAL = 1025;
const CACHE_KEY = "pokedex-cache-v2";
const BATCH_SIZE = 30;
const CONCURRENT_BATCHES = 3;

async function fetchPokemonBatch(ids) {
  return Promise.all(
    ids.map(async (id) => {
      try {
        const [spRes, pkRes] = await Promise.all([
          fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`),
          fetch(`https://pokeapi.co/api/v2/pokemon/${id}`),
        ]);
        const spJson = await spRes.json();
        const pkJson = await pkRes.json();
        const frObj = spJson.names.find((n) => n.language.name === "fr");
        const statsMap = {};
        for (const s of pkJson.stats) statsMap[s.stat.name] = s.base_stat;
        return {
          id: spJson.id,
          nameEn: spJson.name,
          nameFr: frObj ? frObj.name : spJson.name,
          types: pkJson.types.map((t) => t.type.name),
          isLegendary: spJson.is_legendary,
          isMythical: spJson.is_mythical,
          stats: statsMap,
          total: Object.values(statsMap).reduce((a, b) => a + b, 0),
          // Sprite URL calculée directement, sans fetch supplémentaire
          sprite: pkJson.sprites.front_default,
        };
      } catch {
        return null;
      }
    }),
  );
}

export function usePokemonData() {
  const [pokemons, setPokemons] = useState([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // 1. Vérifier le cache sessionStorage
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.length >= TOTAL) {
            setPokemons(parsed);
            setLoadedCount(TOTAL);
            setIsReady(true);
            return;
          }
        }
      } catch {
        // cache corrompu, on ignore
      }

      // 2. Chargement progressif par batches concurrents
      const allIds = Array.from({ length: TOTAL }, (_, i) => i + 1);
      const results = new Array(TOTAL).fill(null);

      for (let i = 0; i < allIds.length; i += BATCH_SIZE * CONCURRENT_BATCHES) {
        if (cancelled) return;

        // Lance CONCURRENT_BATCHES batches en parallèle
        const batchPromises = [];
        for (let b = 0; b < CONCURRENT_BATCHES; b++) {
          const start = i + b * BATCH_SIZE;
          const end = Math.min(start + BATCH_SIZE, allIds.length);
          if (start >= allIds.length) break;
          const batchIds = allIds.slice(start, end);
          batchPromises.push(
            fetchPokemonBatch(batchIds).then((fetched) => ({ start, fetched })),
          );
        }

        const batchResults = await Promise.all(batchPromises);
        if (cancelled) return;

        for (const { start, fetched } of batchResults) {
          fetched.forEach((entry, idx) => {
            if (entry) results[start + idx] = entry;
          });
        }

        const loaded = Math.min(i + BATCH_SIZE * CONCURRENT_BATCHES, TOTAL);
        setLoadedCount(loaded);

        const valid = results.filter(Boolean);
        setPokemons([...valid]);

        if (valid.length >= TOTAL) {
          setIsReady(true);
          // Mettre en cache
          try {
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(valid));
          } catch {
            // sessionStorage plein, on ignore
          }
        }
      }

      if (!cancelled) {
        const valid = results.filter(Boolean);
        setPokemons(valid);
        setLoadedCount(TOTAL);
        setIsReady(true);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(valid));
        } catch {
          /*  */
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { pokemons, loadedCount, isReady };
}
