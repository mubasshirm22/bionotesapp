const express = require('express')
const router = express.Router()
const supabase = require('../db')

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.post('/', async (req, res) => {
  const { topic, content } = req.body
  const { data, error } = await supabase
    .from('notes')
    .insert([{ topic, content }])
    .select()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data[0])
})

router.put('/:id', async (req, res) => {
  const { content } = req.body
  const { data, error } = await supabase
    .from('notes')
    .update({ content })
    .eq('id', req.params.id)
    .select()

  if (error) return res.status(500).json({ error: error.message })
  res.json(data[0])
})

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', req.params.id)

  if (error) return res.status(500).json({ error: error.message })
  res.json({ message: 'deleted' })
})

module.exports = router
