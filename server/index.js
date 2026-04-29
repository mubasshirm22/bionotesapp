const express = require('express')
const cors = require('cors')
require('dotenv').config()

const notesRouter = require('./routes/notes')
const wikiRouter = require('./routes/wiki')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

app.use('/api/notes', notesRouter)
app.use('/api/wiki', wikiRouter)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
