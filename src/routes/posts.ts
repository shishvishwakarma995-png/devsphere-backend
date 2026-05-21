import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()

// GET /api/posts — feed with sort
// GET /api/posts?sort=hot&tag=TypeScript
router.get('/', async (req, res) => {
  const sort = req.query.sort as string || 'hot'
  const tag  = req.query.tag  as string | undefined

  const where = tag ? { tags: { has: tag } } : {}

  let orderBy: any = { createdAt: 'desc' }
  if (sort === 'top')  orderBy = { votes:     { _count: 'desc' } }
  if (sort === 'new')  orderBy = { createdAt: 'desc' }
  if (sort === 'hot')  orderBy = { createdAt: 'desc' } // hot uses score below

  const posts = await prisma.post.findMany({
    where,
    orderBy,
    take: 20,
    include: {
      author:    { select: { id: true, username: true, image: true } },
      community: { select: { id: true, name: true, slug: true } },
      _count:    { select: { votes: true, comments: true } },
    }
  })

  // Hot sort: score = votes / (hours_old + 2)^1.5
  // Rising: posts from last 6 hours sorted by votes
if (sort === 'rising') {
  const sixHoursAgo = new Date(Date.now() - 6 * 3600 * 1000)
  const rising = await prisma.post.findMany({
    where: {
      ...where,
      createdAt: { gte: sixHoursAgo }
    },
    orderBy: { votes: { _count: 'desc' } },
    take: 20,
    include: {
      author:    { select: { username: true, image: true } },
      community: { select: { name: true, slug: true } },
      _count:    { select: { votes: true, comments: true } },
    }
  })
  return res.json(rising)
}
  res.json(posts)
})

// GET /api/posts/:id — single post
router.get('/:id', async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: {
      author:    { select: { username: true, image: true } },
      community: { select: { name: true, slug: true } },
      comments:  { include: { author: { select: { username: true, image: true } } } },
      _count:    { select: { votes: true } },
    }
  })
  if (!post) return res.status(404).json({ error: 'Post not found' })
  res.json(post)
})

// POST /api/posts — create (auth required)
router.post('/', requireAuth, async (req: any, res) => {
  const { title, content, type, tags, communityId } = req.body
  const post = await prisma.post.create({
    data: { title, content, type, tags, communityId, authorId: req.userId }
  })
  res.json(post)
})

// POST /api/posts/:id/vote
router.post('/:id/vote', requireAuth, async (req: any, res) => {
  const { type } = req.body // "UP" or "DOWN"
  const { id: postId } = req.params
  const userId = req.userId

  try {
    // Check if already voted
    const existing = await prisma.vote.findUnique({
      where: { userId_postId: { userId, postId } }
    })

    if (existing) {
      if (existing.type === type) {
        // Same vote → remove it (toggle off)
        await prisma.vote.delete({
          where: { userId_postId: { userId, postId } }
        })
        return res.json({ action: 'removed' })
      } else {
        // Different vote → update it
        await prisma.vote.update({
          where: { userId_postId: { userId, postId } },
          data: { type }
        })
        return res.json({ action: 'updated', type })
      }
    }

    // No vote yet → create it
    await prisma.vote.create({
      data: { type, userId, postId }
    })
    res.json({ action: 'added', type })
  } catch (e) {
    res.status(500).json({ error: 'Vote failed' })
  }
})


// GET /api/posts/:id/comments
router.get('/:id/comments', async (req, res) => {
  const comments = await prisma.comment.findMany({
    where: { postId: req.params.id },
    include: {
      author: { select: { username: true, image: true, name: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
  res.json(comments)
})

// POST /api/posts/:id/comments
router.post('/:id/comments', requireAuth, async (req: any, res) => {
  const { content } = req.body
  if (!content?.trim())
    return res.status(400).json({ error: 'Comment cannot be empty' })
  const comment = await prisma.comment.create({
    data: { content, postId: req.params.id, authorId: req.userId },
    include: { author: { select: { username: true, image: true } } }
  })
  res.json(comment)
})

// DELETE /api/posts/:id — only author can delete
router.delete('/:id', requireAuth, async (req: any, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } })
    if (!post) return res.status(404).json({ error: 'Post not found' })
    if (post.authorId !== req.userId)
      return res.status(403).json({ error: 'Not your post' })

    // Delete related records first
    await prisma.vote.deleteMany({ where: { postId: req.params.id } })
    await prisma.comment.deleteMany({ where: { postId: req.params.id } })
    await prisma.bookmark.deleteMany({ where: { postId: req.params.id } })
    await prisma.post.delete({ where: { id: req.params.id } })

    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: 'Delete failed' }) }
})

export default router