const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'changelog', label: 'Changelog' },
  { id: 'release', label: 'Releases' },
  { id: 'blog', label: 'Blog' },
  { id: 'forum', label: 'Forum' },
  { id: 'video', label: 'Videos' },
  { id: 'tutorial', label: 'Tutorials' },
];

export function CategoryFilter({ value, onChange }) {
  return (
    <div className="filter-section">
      <span className="filter-label">Browse by topic</span>
      <nav className="category-filter" aria-label="Filter by category">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id || 'all'}
            type="button"
            className={value === cat.id ? 'chip chip-active' : 'chip'}
            onClick={() => onChange(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
