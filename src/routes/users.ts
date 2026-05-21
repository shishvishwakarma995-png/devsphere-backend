import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()

// GET /api/users/:username — public profile
router.get('/:username', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      select: {
        id: true, username: true, name: true,
        image: true, bio: true, headline: true,
        skills: true, createdAt: true,
        _count: { select: {
          posts: true, followers: true, following: true
        }},
        posts: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            community: { select: { name: true, slug: true } },
            _count: { select: { votes: true, comments: true } }
          }
        }
      }
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/users/me/profile — get my own data
router.get('/me/profile', requireAuth, async (req: any, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true, email: true, username: true,
      name: true, image: true, bio: true,
      headline: true, skills: true
    }
  })
  res.json(user)
})

// PUT /api/users/me — update my profile
router.put('/me', requireAuth, async (req: any, res) => {
  try {
    const { name, bio, headline, skills } = req.body
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { name, bio, headline, skills },
      select: {
        id: true, username: true, name: true,
        bio: true, headline: true, skills: true, image: true
      }
    })
    res.json(user)
  } catch (e) { res.status(500).json({ error: 'Update failed' }) }
})

// POST /api/users/:username/follow — follow or unfollow
router.post('/:username/follow', requireAuth, async (req: any, res) => {
  try {
    const target = await prisma.user.findUnique({
      where: { username: req.params.username }
    })
    if (!target) return res.status(404).json({ error: 'User not found' })
    if (target.id === req.userId)
      return res.status(400).json({ error: 'Cannot follow yourself' })

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: {
        followerId: req.userId, followingId: target.id
      }}
    })
    if (existing) {
      await prisma.follow.delete({
        where: { followerId_followingId: {
          followerId: req.userId, followingId: target.id
        }}
      })
      return res.json({ following: false })
    }
    await prisma.follow.create({
      data: { followerId: req.userId, followingId: target.id }
    })
    res.json({ following: true })
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

export default router