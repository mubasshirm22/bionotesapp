import { useState } from 'react'
import SearchPanel from './components/SearchPanel'
import NotesPanel from './components/NotesPanel'

function App() {
  const [currentTopic, setCurrentTopic] = useState('')

  return (
    <div className="app">
      <h1>BioNotes</h1>
      <p className="subtitle">Search biology topics and take notes</p>
      <div className="problem-statement">
        <p>
          Biology researchers often work on multiple topics at once but don't have a coordinated
          place to organize their findings and take structured notes. BioNotes solves this by
          combining PubMed literature search with a personal notes workspace — making it easier
          to conduct literature reviews, track key papers, and build toward complete conclusions
          all in one place.
        </p>
      </div>
      <div className="panels">
        <SearchPanel onTopicChange={setCurrentTopic} />
        <NotesPanel topic={currentTopic} />
      </div>
    </div>
  )
}

export default App
