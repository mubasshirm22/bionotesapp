import { useState } from 'react'
import SearchPanel from './components/SearchPanel'
import NotesPanel from './components/NotesPanel'

function App() {
  const [currentTopic, setCurrentTopic] = useState('')

  return (
    <div className="app">
      <h1>BioNotes</h1>
      <p className="subtitle">Search biology topics and take notes</p>
      <div className="panels">
        <SearchPanel onTopicChange={setCurrentTopic} />
        <NotesPanel topic={currentTopic} />
      </div>
    </div>
  )
}

export default App
