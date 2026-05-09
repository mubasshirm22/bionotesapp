import { useState, useEffect } from 'react'

// the max number of characters allowed in a note
const MAX_CHARS = 500

function NotesPanel({ topic }) {
  // this holds all the notes we got from the database
  const [notes, setNotes] = useState([])

  // this is what the user is typing in the "add note" box
  const [newNote, setNewNote] = useState('')

  // when editingId is set, that note card shows a textarea instead of text
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  // filterText is what the user types in the notes search box
  const [filterText, setFilterText] = useState('')

  // sort can be 'newest' or 'oldest' — controls which order notes appear
  const [sort, setSort] = useState('newest')

  // run fetchNotes once when the component first appears on the page
  useEffect(() => {
    fetchNotes()
  }, [])

  // go ask the server for all saved notes and store them in state
  async function fetchNotes() {
    const res = await fetch('/api/notes')
    const data = await res.json()
    setNotes(data)
  }

  // called when the user submits the "add note" form
  async function addNote(e) {
    e.preventDefault()

    // don't add empty notes or notes that are too long
    if (!newNote.trim() || newNote.length > MAX_CHARS) return

    // send the new note to the server to save it
    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: topic || 'General', content: newNote })
    })

    // clear the textarea and reload the notes list
    setNewNote('')
    fetchNotes()
  }

  // delete a note by its id
  async function deleteNote(id) {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    fetchNotes()
  }

  // save the edited version of a note
  async function saveEdit(id) {
    await fetch(`/api/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editText })
    })
    setEditingId(null)
    fetchNotes()
  }

  // filter notes by the search text — checks both the topic and the note content
  // if the filter box is empty, just show everything
  const filteredNotes = notes.filter(note => {
    if (!filterText) return true
    const search = filterText.toLowerCase()
    return (
      note.content.toLowerCase().includes(search) ||
      note.topic.toLowerCase().includes(search)
    )
  })

  // sort the filtered notes — the server returns newest first by default
  // for 'oldest' we just flip the array around
  const visibleNotes = sort === 'newest'
    ? filteredNotes
    : [...filteredNotes].reverse()

  // figure out the color for the character counter
  // green normally, orange when getting close, red when at the limit
  function charCountColor() {
    if (newNote.length >= MAX_CHARS) return '#c0392b'
    if (newNote.length >= MAX_CHARS * 0.8) return '#e67e22'
    return '#aaa'
  }

  return (
    <div className="panel notes-panel">
      <h2>
        My Notes {topic && <span className="topic-tag">{topic}</span>}
      </h2>

      {/* form to write and submit a new note */}
      <form onSubmit={addNote}>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Write a note about this topic..."
          rows={3}
          maxLength={MAX_CHARS}
        />

        {/* show how many characters are left — only show once the user starts typing */}
        {newNote.length > 0 && (
          <p className="char-count" style={{ color: charCountColor() }}>
            {newNote.length} / {MAX_CHARS}
          </p>
        )}

        <button type="submit" disabled={newNote.length > MAX_CHARS}>
          Add Note
        </button>
      </form>

      {/* controls above the notes list — filter input and sort toggle */}
      {notes.length > 0 && (
        <div className="notes-controls">
          <input
            type="text"
            className="notes-filter"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter notes..."
          />
          {/* clicking this button switches between newest and oldest order */}
          <button
            type="button"
            className="sort-btn"
            onClick={() => setSort(sort === 'newest' ? 'oldest' : 'newest')}
          >
            {sort === 'newest' ? 'Newest first' : 'Oldest first'}
          </button>
        </div>
      )}

      <div className="notes-list">
        {/* no notes saved at all yet */}
        {notes.length === 0 && (
          <p className="empty">No notes yet. Search a topic and start writing!</p>
        )}

        {/* notes exist but the filter didn't match any of them */}
        {notes.length > 0 && visibleNotes.length === 0 && (
          <p className="empty">No notes match "{filterText}"</p>
        )}

        {/* loop through all the visible notes and show each one as a card */}
        {visibleNotes.map(note => (
          <div key={note.id} className="note-card">
            <span className="note-topic">{note.topic}</span>

            {/* if this note is being edited, show a textarea. otherwise show the text */}
            {editingId === note.id ? (
              <>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                />
                <div className="note-actions">
                  <button onClick={() => saveEdit(note.id)}>Save</button>
                  <button onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <p>{note.content}</p>
                <div className="note-actions">
                  <button onClick={() => { setEditingId(note.id); setEditText(note.content) }}>
                    Edit
                  </button>
                  <button className="delete" onClick={() => deleteNote(note.id)}>
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default NotesPanel
