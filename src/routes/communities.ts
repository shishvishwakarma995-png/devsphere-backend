import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()

// GET /api/communities
router.get('/', async (req, res) => {
  const communities = await prisma.community.findMany({
    include: { _count: { select: { members: true, posts: true } } },
    orderBy: { createdAt: 'desc' }
  })
  res.json(communities)
})

// GET /api/communities/:slug
router.get('/:slug', async (req, res) => {
  const community = await prisma.community.findUnique({
    where: { slug: req.params.slug },
    include: {
      posts: {
        include: {
          author: { select: { username: true, image: true } },
          _count: { select: { votes: true, comments: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      },
      _count: { select: { members: true } }
    }
  })
  if (!community) return res.status(404).json({ error: 'Community not found' })
  res.json(community)
})

// POST /api/communities
router.post('/', requireAuth, async (req: any, res) => {
  const { name, slug, description } = req.body
  try {
    const community = await prisma.community.create({
      data: { name, slug, description }
    })
    res.json(community)
  } catch {
    res.status(400).json({ error: 'Community already exists' })
  }
})

// POST /api/communities/:slug/join — toggle join/leave
router.post('/:slug/join', requireAuth, async (req: any, res) => {
  try {
    const community = await prisma.community.findUnique({
      where: { slug: req.params.slug }
    })
    if (!community)
      return res.status(404).json({ error: 'Community not found' })

    const existing = await prisma.communityMember.findUnique({
      where: { userId_communityId: {
        userId: req.userId, communityId: community.id
      }}
    })

    if (existing) {
      await prisma.communityMember.delete({
        where: { userId_communityId: {
          userId: req.userId, communityId: community.id
        }}
      })
      return res.json({ joined: false })
    }

    await prisma.communityMember.create({
      data: { userId: req.userId, communityId: community.id }
    })
    res.json({ joined: true })
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/communities/my/list — my joined communities
router.get('/my/list', requireAuth, async (req: any, res) => {
  const memberships = await prisma.communityMember.findMany({
    where: { userId: req.userId },
    include: { community: true }
  })
  res.json(memberships.map(m => m.community))
})

export default router