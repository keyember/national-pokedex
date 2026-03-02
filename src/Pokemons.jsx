import { useEffect, useState } from "react";

export default function GetPokemons() {
  const [pokemons, setPokemons] = useState([]);
  useEffect(() => {
    const fetchPokemons = async () => {
      const resp = await fetch("https://pokeapi.co/api/v2/pokemon");
      const data = await resp.json();
      setPokemons(data);
    };
    fetchPokemons();
  }, []);
  return console.log(pokemons.results);

  /* <div className="pokemons-list">
      <h2>Pokemons List</h2>
      <div className="pokemons">{pokemons.results}</div>
    </div> */
}
