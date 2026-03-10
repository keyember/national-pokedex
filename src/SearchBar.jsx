import "./SearchBar.css";

export default function SearchBar({ value, onChange }) {
  return (
    <div className="searchbar-content">
      <span className="searchbar-label">▶ RECHERCHE</span>
      <input
        className="searchbar-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Pikachu, 025..."
        autoComplete="off"
      />
    </div>
  );
}
