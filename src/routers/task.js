const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  })

  try {
    await task.save()
    res.status(201).send(task)
  } catch (error) {
    res.status(400).send(error)
  }
})

// GET /tasks?completed=false
// GET /tasks?limit=10&skip=10
// GET /tasks?sortBy=createdAt_asc
router.get('/tasks', auth, async (req, res) => {
  try {
    const { completed, limit, skip, sort } = req.query
    const query = { owner: req.user._id }
    const sortQuery = {}
    if (completed) query.completed = completed
    if (sort) {
      const [sortField, sortOrder] = sort.split('_')
      sortQuery[sortField] = sortOrder
    }

    const tasks = await Task.find(query)
      .limit(Number(limit))
      .skip(Number(skip))
      .sort(sortQuery)
    res.status(200).send(tasks)
  } catch (error) {
    res.status(500).send(error)
  }
})

router.get('/tasks/:id', auth, async (req, res) => {
  const { id } = req.params
  try {
    const task = await Task.findOne({ _id: id, owner: req.user._id })
    if (!task) {
      return res.status(404).send('Task not found')
    }
    res.status(200).send(task)
  } catch (error) {
    res.status(500).send(error)
  }
})

router.patch('/tasks/:id', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['description', 'completed']
  const isValid = updates.every(key => allowedUpdates.includes(key))
  if (!isValid) {
    return res.status(404).send('Param not found')
  }

  const { id } = req.params
  try {
    const task = await Task.fineOne({ _id: id, owner: req.user._id })

    if (!task) {
      return res.status(404).send('task not found')
    }
    updates.forEach(update => {
      task[update] = req.body[update]
    })
    await task.save()
    res.send(task)
  } catch (error) {
    res.status(400).send(error)
  }
})

router.delete('/tasks/:id', auth, async (req, res) => {
  const { id } = req.params
  try {
    const task = await Task.findOneAndDelete({ _id: id, owner: req.user._id })
    if (!task) {
      return res.status(404).send('Task not found')
    }
    res.status(200).send(task)
  } catch (error) {
    res.status(500).send(error)
  }
})

module.exports = router
