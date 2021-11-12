const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/user')
const auth = require('../middleware/auth')

const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('File must be an image'))
    }
    cb(undefined, true)
  }
})

const router = new express.Router()

router.post('/users', async (req, res) => {
  const user = new User(req.body)
  try {
    await user.save()
    const token = await user.generateAuthToken()
    res.status(201).send({ user, token })
  } catch (error) {
    res.status(400).send(error)
  }
})

router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password)
    const token = await user.generateAuthToken()
    res.send({ user, token })
  } catch (error) {
    res.status(400).send(error)
  }
})

router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(t => t.token !== req.token)
    await req.user.save()
    res.send('Successfully logged out')
  } catch (error) {
    res.status(500).send(error)
  }
})

router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = []
    await req.user.save()
    res.send('Successfully logged out from all devices')
  } catch (error) {
    res.status(500).send(error)
  }
})

router.get('/users/me', auth, async (req, res) => {
  res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ['name', 'email', 'password', 'age']
  const isValid = updates.every(key => allowedUpdates.includes(key))
  if (!isValid) {
    return res.status(404).send('Param not found')
  }

  const id = req.user._id
  try {
    const user = req.user

    updates.forEach(update => {
      user[update] = req.body[update]
    })
    await user.save()
    res.send(user)
  } catch (error) {
    res.status(400).send(error)
  }
})

router.delete('/users/me', auth, async (req, res) => {
  const id = req.user._id
  try {
    await req.user.remove()
    res.status(200).send(req.user)
  } catch (error) {
    res.status(500).send(error)
  }
})

router.post(
  '/users/me/avatar',
  auth,
  upload.single('avatar'),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
  },
  (error, res, req, next) => {
    req.status(400).send({ error: error.message })
  }
)

router.delete(
  '/users/me/avatar',
  auth,
  async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
  }
)

router.get('/users/:id/avatar', async (req, res) => {
   try {
     const user = await User.findById(req.params.id)
     if (!user || !user.avatar) {
       throw new Error()
     }

     res.set('Content-Type', 'image/png')
     res.send(user.avatar)
   } catch (error) {
    res.status(404).send(error)
   }
})

module.exports = router
