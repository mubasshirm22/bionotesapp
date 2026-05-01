import { useState } from 'react'

function SearchPanel({ onTopicChange }) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    const res = await fetch(`/api/wiki?topic=${encodeURIComponent(query)}`)
    const data = await res.json()

    setLoading(false)

    if (data.error) {
      setError('Topic not found. Try something else.')
      return
    }

    setResult(data)
    onTopicChange(data.title)
  }

  return (
    <div className="panel search-panel">
      <h2>Search</h2>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. mitosis, DNA, photosynthesis"
        />
        <button type="submit">Search</button>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {result && (
        <div className="wiki-result">
          {result.thumbnail && (
            <img src={result.thumbnail.source} alt={result.title} />
          )}
          <h3>{result.title}</h3>
          <p>{result.extract}</p>
          <a href={result.content_urls?.desktop?.page} target="_blank" rel="noreferrer">
            Read more on Wikipedia
          </a>
        </div>
      )}
    </div>
  )
}

export default SearchPanel
