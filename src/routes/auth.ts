import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'

const router = Router()

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, username, password: hashed }
    })
    res.json({ message: 'User created!', userId: user.id })
  } catch (err) {
    res.status(400).json({ error: 'User already exists' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !(await bcrypt.compare(password, user.password!)))
      return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )
    res.json({ token, user: { id: user.id, email: user.email, username: user.username } })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router