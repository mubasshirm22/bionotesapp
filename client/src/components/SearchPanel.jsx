import { useState } from 'react'

function SearchPanel({ onTopicChange }) {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('keyword')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setResults([])
    setSelected(null)
    setDetails(null)
    setExpanded(false)

    const res = await fetch(`/api/pubmed?query=${encodeURIComponent(query)}&type=${searchType}`)
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
    setDetails(null)
    setExpanded(false)
    onTopicChange(paper.title)
  }

  async function handleShowMore() {
    if (!selected.pmid) return
    setLoadingDetails(true)
    setExpanded(true)

    const res = await fetch(`/api/pubmed/details?pmid=${selected.pmid}`)
    const data = await res.json()

    setLoadingDetails(false)
    setDetails(data)
  }

  function handleCollapse() {
    setExpanded(false)
  }

  return (
    <div className="panel search-panel">
      <h2>Search</h2>

      <div className="search-type-toggle">
        <button
          type="button"
          className={searchType === 'keyword' ? 'toggle-btn active' : 'toggle-btn'}
          onClick={() => setSearchType('keyword')}
        >
          Keyword
        </button>
        <button
          type="button"
          className={searchType === 'author' ? 'toggle-btn active' : 'toggle-btn'}
          onClick={() => setSearchType('author')}
        >
          Author
        </button>
      </div>

      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            searchType === 'author'
              ? 'e.g. Smith J, Zhang Wei'
              : 'e.g. CRISPR, mitosis, or a DOI like 10.1038/...'
          }
        />
        <button type="submit">Search</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {results.length > 0 && !selected && (
        <ul className="search-results">
          {results.map(paper => (
            <li
              key={paper.pmid || paper.doi}
              onClick={() => handleSelect(paper)}
              className="result-item"
            >
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

          {selected.pmid && !expanded && (
            <button className="show-more-btn" onClick={handleShowMore}>
              Show more
            </button>
          )}

          {expanded && (
            <>
              {loadingDetails && <p className="loading-details">Loading details...</p>}

              {details && (
                <div className="details-section">
                  {details.pubTypes?.length > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Type</span>
                      <div className="chip-list">
                        {details.pubTypes.map(t => (
                          <span key={t} className="chip chip-type">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {details.abstract && (
                    <div className="detail-row">
                      <span className="detail-label">Abstract</span>
                      <p className="abstract-text">{details.abstract}</p>
                    </div>
                  )}

                  {details.keywords?.length > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Keywords</span>
                      <div className="chip-list">
                        {details.keywords.map(k => (
                          <span key={k} className="chip chip-keyword">{k}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {details.meshTerms?.length > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">MeSH</span>
                      <div className="chip-list">
                        {details.meshTerms.map(m => (
                          <span key={m} className="chip chip-mesh">{m}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button className="show-more-btn" onClick={handleCollapse}>
                Show less
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchPanel
