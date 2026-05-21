import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middleware/auth'

const router = Router()

// GET /api/bookmarks — get my saved posts
router.get('/', requireAuth, async (req: any, res) => {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      post: {
        include: {
          author:    { select: { username: true, image: true } },
          community: { select: { name: true, slug: true } },
          _count:    { select: { votes: true, comments: true } },
        }
      }
    }
  })
  // Return posts directly
  res.json(bookmarks.map(b => b.post))
})

// POST /api/bookmarks/:postId — toggle bookmark
router.post('/:postId', requireAuth, async (req: any, res) => {
  const { postId } = req.params
  const userId = req.userId

  const existing = await prisma.bookmark.findUnique({
    where: { userId_postId: { userId, postId } }
  })

  if (existing) {
    await prisma.bookmark.delete({
      where: { userId_postId: { userId, postId } }
    })
    return res.json({ bookmarked: false })
  }

  await prisma.bookmark.create({
    data: { userId, postId }
  })
  res.json({ bookmarked: true })
})

export default router