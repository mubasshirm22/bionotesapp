const express = require('express')
const router = express.Router()

router.get('/', async (req, res) => {
  const topic = req.query.topic
  if (!topic) return res.status(400).json({ error: 'No topic provided' })

  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`

  const response = await fetch(url)
  const data = await response.json()

  if (response.status === 404) {
    return res.status(404).json({ error: 'Topic not found' })
  }

  res.json(data)
})

module.exports = router
