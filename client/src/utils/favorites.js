// this is the key name we use to store data in localStorage
// localStorage is like a mini database built into the browser
const STORAGE_KEY = 'bionotes-favorites'

// the 4 status options a paper can have
export const STATUSES = ['Not Started', 'Reading', 'Reviewed', 'Mastered']

// get all saved papers from the browser's localStorage
// if nothing is saved yet, return an empty array
export function getFavorites() {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

// save a paper to favorites — adds it to the front of the list
// also sets the default status to 'Not Started'
export function addFavorite(paper) {
  const favorites = getFavorites()

  // don't add the same paper twice
  const alreadySaved = favorites.some(f =>
    (paper.pmid && f.pmid === paper.pmid) || (paper.doi && f.doi === paper.doi)
  )
  if (alreadySaved) return

  favorites.unshift({ ...paper, status: 'Not Started' })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
}

// remove a paper from favorites using its pmid or doi as the id
export function removeFavorite(paper) {
  const filtered = getFavorites().filter(f =>
    !(paper.pmid && f.pmid === paper.pmid) && !(paper.doi && f.doi === paper.doi)
  )
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

// check if a paper is already in favorites — returns true or false
export function isFavorite(paper) {
  return getFavorites().some(f =>
    (paper.pmid && f.pmid === paper.pmid) || (paper.doi && f.doi === paper.doi)
  )
}

// change the reading status of a saved paper
export function updateStatus(paper, status) {
  const updated = getFavorites().map(f => {
    const match = (paper.pmid && f.pmid === paper.pmid) || (paper.doi && f.doi === paper.doi)
    return match ? { ...f, status } : f
  })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}
