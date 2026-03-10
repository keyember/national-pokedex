import { Routes, Route } from "react-router-dom";
import PokedexList from "./PokedexList.jsx";
import PokemonDetail from "./PokemonDetail.jsx";
import "./App.css";

function App() {
  return (
    <div className="app-wrapper">
      <Routes>
        <Route path="/" element={<PokedexList />} />
        <Route path="/pokemon/:id" element={<PokemonDetail />} />
      </Routes>
    </div>
  );
}

export default App;
