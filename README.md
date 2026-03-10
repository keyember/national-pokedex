# 🇫🇷 National Pokédex (FR) – React & PokéAPI

Un Pokédex national en **React** qui utilise **PokéAPI v2** pour afficher les Pokémon avec leurs **noms français**, une **recherche en temps réel** et une **fiche détaillée** (sprites, types, description Pokédex).

---

## Objectifs du projet

- Proposer un **Pokédex national en français** accessible depuis le navigateur.
- S’entraîner à consommer une API REST (PokéAPI) avec **React + Vite**.
- Travailler la **logique front** : appels API, gestion d’état, filtrage, affichage conditionnel.
- Préparer une base propre pour ajouter ensuite pagination, filtres avancés, routing, etc.

---

## Fonctionnalités principales

- Récupération des Pokémon via `https://pokeapi.co/api/v2/`.
- Utilisation de l’endpoint `pokemon-species` pour :
  - récupérer les **noms localisés**,
  - extraire le **nom français** de chaque Pokémon.
- Liste des Pokémon.
- **Barre de recherche** contrôlée qui filtre en direct sur le **nom FR**.
- Affichage des informations détaillées d’un Pokémon sélectionné :
  - Sprite (image de face, `sprites.front_default`)
  - Types (`types.type.name`)
  - Nom français (`names[language="fr"]`)
  - Description Pokédex en français (`flavor_text_entries[language="fr"]`).
- Architecture pensée pour pouvoir :
  - soit afficher les détails **sous la liste**,
  - soit utiliser **React Router** et des routes type `/pokemon/:id`.

---

## Stack technique

- **React** (hooks : `useState`, `useEffect`)
- **Vite** (scaffolding & dev server)
- **JavaScript** (ES6+)
- **CSS** pour le style
- **PokéAPI v2** comme source de données :  
  - Site : https://pokeapi.co  
  - Docs : https://pokeapi.co/docs/v2

---

## Structure du projet

```text
src/
  ├─ main.jsx            # Point d’entrée, éventuellement BrowserRouter
  ├─ App.jsx             # Déclaration des routes ou rendu du Pokedex
  ├─ Pokemons.jsx        # Liste + recherche + affichage des détails
  ├─ PokemonDetail.jsx   # (optionnel) page de détail si on utilise React Router
  ├─ SearchBar.jsx       # Composant barre de recherche contrôlé
  ├─ SearchBar.css       # Styles de la barre de recherche
  └─ styles/...          # Autres styles (cards, layout, etc.)
```

- `SearchBar.jsx` : reçoit `value` et `onChange` en props, gère uniquement l’UI de la recherche.
- `Pokemons.jsx` :
  - fetch la liste des espèces,
  - construit un tableau `{ id, nameEn, nameFr }`,
  - applique le filtre de recherche sur `nameFr`,
  - gère le clic sur un Pokémon et l’affichage des détails.
- `PokemonDetail.jsx` (optionnel) : utilisé si l’on sépare la fiche sur une route dédiée (`/pokemon/:id`).

---

## Installation & démarrage

### 1. Prérequis

- Node.js + npm installés sur la machine.
- Git (optionnel, si tu clones depuis GitHub).

### 2. Clonage du projet

```bash
git clone https://github.com/keyember/national-pokedex
cd national-pokedex
```

### 3. Installation des dépendances

```bash
npm install
```

### 4. (Optionnel) React Router

Si tu décides d’utiliser des pages dédiées avec des URLs (`/pokemon/:id`) :

```bash
npm install react-router-dom
```

Puis, dans `main.jsx` :

```jsx
import { BrowserRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

Et dans `App.jsx` quelque chose du style :

```jsx
import { Routes, Route } from "react-router-dom";
import PokedexList from "./Pokemons";
import PokemonDetail from "./PokemonDetail";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PokedexList />} />
      <Route path="/pokemon/:id" element={<PokemonDetail />} />
    </Routes>
  );
}
```

### 5. Lancer le serveur de dev

```bash
npm run dev
```

Ouvre ensuite l’URL affichée par Vite (souvent `http://localhost:5173`).

---

## Fonctionnement interne (logique PokéAPI)

### 1. Liste des Pokémon avec nom FR

- Appel : `GET /pokemon-species?limit=...`  
- Pour chaque élément de `results`, on suit `url` → `GET /pokemon-species/{id}`.
- Dans la réponse, on lit :

  - `id` : identifiant du Pokémon (index Pokédex national)
  - `name` : nom interne anglais
  - `names` : tableau de traductions  
    → on fait un `.find(n => n.language.name === "fr")` pour récupérer le nom français.

On construit ainsi un tableau de données minimal pour la liste :

```ts
{
  id: number;
  nameEn: string;
  nameFr: string;
}
```

### 2. Fiche détaillée

Pour un Pokémon sélectionné (par `id`) :

- `GET /pokemon/{id}`  
  → sprites, types, stats, taille, poids, etc.
- `GET /pokemon-species/{id}`  
  → noms localisés, description Pokédex (`flavor_text_entries`), autres méta-données.

On combine les deux réponses pour remplir la fiche détail : sprite, types, nom FR, texte descriptif FR, etc.

---

## Utilisation

1. Ouvrir la page principale.
2. La liste affiche les Pokémon avec leur **nom français**.
3. Taper dans la barre de recherche :
   - la liste se met à jour en temps réel (filtre sur `nameFr.toLowerCase().includes(search.toLowerCase())`).
4. Cliquer sur un Pokémon :
   - soit affiche ses **détails sous la liste** (version simple sans router),
   - soit redirige vers `/pokemon/:id` où une page dédiée charge les infos complètes.

---

## Remerciements

- **PokéAPI** pour fournir gratuitement une API complète Pokémon :  
  - https://pokeapi.co  
  - https://github.com/PokeAPI/pokeapi
- Les nombreux projets open source de Pokédex en React qui ont inspiré la structure et les bonnes pratiques.
