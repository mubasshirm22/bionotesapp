import { useState, useEffect } from 'react'

function NotesPanel({ topic }) {
  const [notes, setNotes] = useState([])
  const [newNote, setNewNote] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    fetchNotes()
  }, [])

  async function fetchNotes() {
    const res = await fetch('/api/notes')
    const data = await res.json()
    setNotes(data)
  }

  async function addNote(e) {
    e.preventDefault()
    if (!newNote.trim()) return

    await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic: topic || 'General', content: newNote })
    })

    setNewNote('')
    fetchNotes()
  }

  async function deleteNote(id) {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    fetchNotes()
  }

  async function saveEdit(id) {
    await fetch(`/api/notes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editText })
    })
    setEditingId(null)
    fetchNotes()
  }

  return (
    <div className="panel notes-panel">
      <h2>
        My Notes {topic && <span className="topic-tag">{topic}</span>}
      </h2>

      <form onSubmit={addNote}>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Write a note about this topic..."
          rows={3}
        />
        <button type="submit">Add Note</button>
      </form>

      <div className="notes-list">
        {notes.length === 0 && (
          <p className="empty">No notes yet. Search a topic and start writing!</p>
        )}
        {notes.map(note => (
          <div key={note.id} className="note-card">
            <span className="note-topic">{note.topic}</span>
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
