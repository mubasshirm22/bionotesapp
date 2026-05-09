import { useState } from 'react'
import { getFavorites, addFavorite, removeFavorite, isFavorite, updateStatus, STATUSES } from '../utils/favorites'

function SearchPanel({ onTopicChange }) {
  // query is whatever the user typed in the search box
  const [query, setQuery] = useState('')

  // searchType switches between searching by keyword or by author name
  const [searchType, setSearchType] = useState('keyword')

  // tab controls which view is shown: the search form or the saved papers list
  const [tab, setTab] = useState('search')

  // results is the list of papers we got back from the server
  const [results, setResults] = useState([])

  // selected is the one paper the user clicked on to see more info
  const [selected, setSelected] = useState(null)

  // details holds the abstract, keywords, and MeSH terms for the selected paper
  const [details, setDetails] = useState(null)

  const [loading, setLoading] = useState(false)
  const [loadingDetails, setLoadingDetails] = useState(false)

  // expanded controls whether the "show more" section is open or collapsed
  const [expanded, setExpanded] = useState(false)

  const [error, setError] = useState('')

  // copied is used to briefly show "Copied!" after clicking the copy button
  const [copied, setCopied] = useState(false)

  // favorites is our local copy of what's stored in localStorage
  // we load it once at the start using a function inside useState
  const [favorites, setFavorites] = useState(() => getFavorites())

  // re-read favorites from localStorage and update our state
  // we call this whenever we add, remove, or update a favorite
  function refreshFavorites() {
    setFavorites(getFavorites())
  }

  // toggle a paper in or out of favorites
  function handleStar(paper, e) {
    // stop the click from also triggering the result-item click (selecting the paper)
    if (e) e.stopPropagation()

    if (isFavorite(paper)) {
      removeFavorite(paper)
    } else {
      addFavorite(paper)
    }
    refreshFavorites()
  }

  // change the reading status of a saved paper
  function handleStatusChange(paper, status) {
    updateStatus(paper, status)
    refreshFavorites()
  }

  // called when the user submits the search form
  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return

    // reset everything before starting a new search
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

  // clear the search box and reset all results
  function handleClear() {
    setQuery('')
    setResults([])
    setSelected(null)
    setDetails(null)
    setExpanded(false)
    setError('')
  }

  // when the user clicks a paper from the list, set it as selected
  function handleSelect(paper) {
    setSelected(paper)
    setDetails(null)
    setExpanded(false)
    // tell the notes panel what topic is selected so it pre-fills the note
    onTopicChange(paper.title)
  }

  // fetch the full details (abstract, MeSH, keywords) for the selected paper
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

  // copy the abstract text to the user's clipboard
  async function handleCopyAbstract() {
    if (!details?.abstract) return
    await navigator.clipboard.writeText(details.abstract)

    // show "Copied!" for 2 seconds then go back to normal
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="panel search-panel">

      {/* tabs at the top to switch between search and saved papers */}
      <div className="panel-tabs">
        <button
          className={tab === 'search' ? 'panel-tab active' : 'panel-tab'}
          onClick={() => setTab('search')}
        >
          Search
        </button>
        <button
          className={tab === 'saved' ? 'panel-tab active' : 'panel-tab'}
          onClick={() => { setTab('saved'); refreshFavorites() }}
        >
          Saved {favorites.length > 0 && <span className="tab-count">{favorites.length}</span>}
        </button>
      </div>

      {/* ── SEARCH TAB ── */}
      {tab === 'search' && (
        <>
          {/* toggle between keyword search and author search */}
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
            {/* wrapper div so we can position the X button inside the input */}
            <div className="search-input-wrap">
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
              {/* only show the X button if there's something in the search box */}
              {query && (
                <button type="button" className="clear-btn" onClick={handleClear}>×</button>
              )}
            </div>
            <button type="submit">Search</button>
          </form>

          {loading && <p>Loading...</p>}
          {error && <p className="error">{error}</p>}

          {/* list of results — only show this when no paper is selected yet */}
          {results.length > 0 && !selected && (
            <ul className="search-results">
              {results.map(paper => (
                <li
                  key={paper.pmid || paper.doi}
                  onClick={() => handleSelect(paper)}
                  className="result-item"
                >
                  <div className="result-item-top">
                    <strong>{paper.title}</strong>
                    {/* star button — stops the click from also selecting the paper */}
                    <button
                      className={isFavorite(paper) ? 'star-btn starred' : 'star-btn'}
                      onClick={(e) => handleStar(paper, e)}
                      title={isFavorite(paper) ? 'Remove from saved' : 'Save paper'}
                    >
                      {isFavorite(paper) ? '★' : '☆'}
                    </button>
                  </div>
                  <span className="meta">
                    {paper.authors.join(', ')} · {paper.journal} · {paper.year}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* detail view for the paper the user clicked on */}
          {selected && (
            <div className="pubmed-result">
              <div className="result-detail-header">
                <button className="back-btn" onClick={() => setSelected(null)}>← Back</button>
                {/* star button in the detail view */}
                <button
                  className={isFavorite(selected) ? 'star-btn starred' : 'star-btn'}
                  onClick={(e) => handleStar(selected, e)}
                  title={isFavorite(selected) ? 'Remove from saved' : 'Save paper'}
                >
                  {isFavorite(selected) ? '★ Saved' : '☆ Save'}
                </button>
              </div>

              <h3>{selected.title}</h3>
              <p className="meta">
                {selected.authors.join(', ')} · <em>{selected.journal}</em> · {selected.year}
              </p>

              {/* links to view the paper on PubMed or by DOI */}
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

              {/* only show this button if the paper has a PubMed ID and isn't expanded yet */}
              {selected.pmid && !expanded && (
                <button className="show-more-btn" onClick={handleShowMore}>Show more</button>
              )}

              {/* expanded section with abstract, keywords, and MeSH terms */}
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
                          <div className="abstract-header">
                            <span className="detail-label">Abstract</span>
                            {/* clicking this copies the abstract text to the clipboard */}
                            <button className="copy-btn" onClick={handleCopyAbstract}>
                              {copied ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
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

                  <button className="show-more-btn" onClick={handleCollapse}>Show less</button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* ── SAVED TAB ── */}
      {tab === 'saved' && (
        <div className="saved-list">
          {favorites.length === 0 && (
            <p className="empty">No saved papers yet. Hit ☆ on any result to save it.</p>
          )}

          {favorites.map(paper => (
            <div key={paper.pmid || paper.doi} className="saved-card">
              <div className="saved-card-top">
                <p className="saved-title">
                  <a href={paper.url} target="_blank" rel="noreferrer">{paper.title}</a>
                </p>
                {/* remove from favorites */}
                <button
                  className="star-btn starred"
                  onClick={() => handleStar(paper)}
                  title="Remove from saved"
                >
                  ★
                </button>
              </div>

              <span className="meta">
                {paper.authors.join(', ')} · {paper.journal} · {paper.year}
              </span>

              {/* status pill selector — click a pill to set the reading status */}
              <div className="status-row">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    className={`status-pill status-${s.replace(' ', '-').toLowerCase()} ${paper.status === s ? 'active' : ''}`}
                    onClick={() => handleStatusChange(paper, s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchPanel
