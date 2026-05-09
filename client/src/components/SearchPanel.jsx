import { useState } from 'react'

function SearchPanel({ onTopicChange }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setResults([])
    setSelected(null)

    const res = await fetch(`/api/pubmed?query=${encodeURIComponent(query)}`)
    const data = await res.json()

    setLoading(false)

    if (data.error) {
      setError('No results found. Try a different term or DOI.')
      return
    }

    setResults(data.results)
  }

  function handleSelect(paper) {
    setSelected(paper)
    onTopicChange(paper.title)
  }

  return (
    <div className="panel search-panel">
      <h2>Search</h2>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. CRISPR, mitosis, or a DOI like 10.1038/..."
        />
        <button type="submit">Search</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {results.length > 0 && !selected && (
        <ul className="search-results">
          {results.map(paper => (
            <li key={paper.pmid || paper.doi} onClick={() => handleSelect(paper)} className="result-item">
              <strong>{paper.title}</strong>
              <span className="meta">
                {paper.authors.join(', ')} · {paper.journal} · {paper.year}
              </span>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="pubmed-result">
          <button className="back-btn" onClick={() => setSelected(null)}>← Back to results</button>
          <h3>{selected.title}</h3>
          <p className="meta">
            {selected.authors.join(', ')} · <em>{selected.journal}</em> · {selected.year}
          </p>
          <div className="result-links">
            {selected.pmid && (
              <a href={selected.url} target="_blank" rel="noreferrer">View on PubMed</a>
            )}
            {selected.doi && (
              <a href={`https://doi.org/${selected.doi}`} target="_blank" rel="noreferrer">
                DOI: {selected.doi}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchPanel
