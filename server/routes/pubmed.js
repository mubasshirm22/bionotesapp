const express = require('express')
const router = express.Router()

async function searchPubMed(term, limit = 5) {
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmax=${limit}&retmode=json&sort=relevance`
  const searchRes = await fetch(searchUrl)
  const searchData = await searchRes.json()
  const ids = searchData.esearchresult?.idlist || []

  if (ids.length === 0) return []

  const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`
  const summaryRes = await fetch(summaryUrl)
  const summaryData = await summaryRes.json()

  return ids.map(id => {
    const paper = summaryData.result[id]
    if (!paper) return null

    const doi = paper.articleids?.find(a => a.idtype === 'doi')?.value || null
    const authors = (paper.authors || []).slice(0, 3).map(a => a.name)
    if ((paper.authors || []).length > 3) authors.push('et al.')

    return {
      pmid: id,
      title: paper.title,
      authors,
      journal: paper.fulljournalname || paper.source,
      year: paper.pubdate?.split(' ')[0] || '',
      doi,
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
    }
  }).filter(Boolean)
}

async function lookupDOI(doi) {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'BioNotes/1.0 (mailto:mubasshirm22@gmail.com)' }
  })

  if (!res.ok) return null

  const data = await res.json()
  const work = data.message

  const authors = (work.author || []).slice(0, 3).map(a =>
    a.family ? `${a.family}${a.given ? ' ' + a.given[0] : ''}`.trim() : (a.name || '')
  )
  if ((work.author || []).length > 3) authors.push('et al.')

  return {
    pmid: null,
    title: work.title?.[0] || 'Unknown title',
    authors,
    journal: work['container-title']?.[0] || work.publisher || '',
    year: work.published?.['date-parts']?.[0]?.[0]?.toString() || '',
    doi: work.DOI,
    url: `https://doi.org/${work.DOI}`
  }
}

function extractMatches(xml, regex) {
  const results = []
  let match
  while ((match = regex.exec(xml)) !== null) {
    results.push(match)
  }
  return results
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '')
    .trim()
}

// Search route
router.get('/', async (req, res) => {
  const { query, type } = req.query
  if (!query) return res.status(400).json({ error: 'No query provided' })

  try {
    if (query.trim().startsWith('10.')) {
      const paper = await lookupDOI(query.trim())
      if (!paper) return res.status(404).json({ error: 'DOI not found' })
      return res.json({ results: [paper] })
    }

    const term = type === 'author' ? `${query}[Author]` : query
    const results = await searchPubMed(term)
    if (results.length === 0) return res.status(404).json({ error: 'No results found' })

    res.json({ results })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Search failed' })
  }
})

// Details route — fetches abstract, keywords, MeSH terms for a single PMID
router.get('/details', async (req, res) => {
  const { pmid } = req.query
  if (!pmid) return res.status(400).json({ error: 'No PMID provided' })

  try {
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&rettype=xml&retmode=xml`
    const response = await fetch(url)
    const xml = await response.text()

    // Abstract — may be structured (Background, Methods, etc.) or plain
    const abstractMatches = extractMatches(xml, /<AbstractText(?:\s+Label="([^"]*)")?[^>]*>([\s\S]*?)<\/AbstractText>/g)
    const abstractParts = abstractMatches.map(m => {
      const label = m[1]
      const text = decodeEntities(m[2])
      return label ? `${label}: ${text}` : text
    })
    const abstract = abstractParts.join('\n\n') || null

    // Author keywords
    const keywordMatches = extractMatches(xml, /<Keyword[^>]*>([\s\S]*?)<\/Keyword>/g)
    const keywords = keywordMatches.map(m => decodeEntities(m[1])).filter(Boolean)

    // MeSH descriptor terms
    const meshMatches = extractMatches(xml, /<DescriptorName[^>]*>([\s\S]*?)<\/DescriptorName>/g)
    const meshTerms = [...new Set(meshMatches.map(m => decodeEntities(m[1])).filter(Boolean))]

    // Publication types
    const pubTypeMatches = extractMatches(xml, /<PublicationType[^>]*>([\s\S]*?)<\/PublicationType>/g)
    const pubTypes = [...new Set(pubTypeMatches.map(m => decodeEntities(m[1])).filter(Boolean))]

    res.json({ abstract, keywords, meshTerms, pubTypes })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch details' })
  }
})

module.exports = router
