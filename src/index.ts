import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes       from './routes/auth'
import postRoutes       from './routes/posts'
import communityRoutes  from './routes/communities'
import userRoutes       from './routes/users'
import { prisma } from './lib/prisma'
import bookmarkRoutes from './routes/bookmarks'
import { requireAuth } from './middleware/auth'



dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/auth',        authRoutes)
app.use('/api/posts',       postRoutes)
app.use('/api/communities', communityRoutes)
app.use('/api/users',       userRoutes)
app.use('/api/bookmarks', bookmarkRoutes)

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'DevSphere API is running 🚀' })
})

// TODO: add routes here on Day 3+

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})

// GET /api/search?q=typescript
app.get('/api/search', async (req, res) => {
  const q = (req.query.q as string || '').trim()
  if (!q || q.length < 2)
    return res.json({ posts: [], communities: [], users: [] })

  const [posts, communities, users] = await Promise.all([
    prisma.post.findMany({
      where: {
        OR: [
          { title:   { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
          { tags:    { has: q } },
        ]
      },
      take: 5,
      include: {
        author:    { select: { username: true } },
        community: { select: { name: true, slug: true } },
      }
    }),
    prisma.community.findMany({
      where: {
        OR: [
          { name:        { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ]
      },
      take: 3,
      include: { _count: { select: { members: true } } }
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: 'insensitive' } },
          { name:     { contains: q, mode: 'insensitive' } },
        ]
      },
      take: 3,
      select: { username: true, name: true, headline: true }
    }),
  ])

  res.json({ posts, communities, users })
})

// GET /api/trending/tags
app.get('/api/trending/tags', async (req, res) => {
  const since = new Date(Date.now() - 24 * 3600 * 1000)

  const posts = await prisma.post.findMany({
    where: { createdAt: { gte: since } },
    select: { tags: true }
  })

  // Count occurrences of each tag
  const tagCount: Record<string, number> = {}
  posts.forEach(p =>
    p.tags.forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1 })
  )

  // Sort by count, take top 8
  const trending = Object.entries(tagCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }))

  res.json(trending)
})

// GET /api/feed/following — posts from followed users
app.get('/api/feed/following', requireAuth, async (req: any, res) => {
  try {
    // Get IDs of users I follow
    const follows = await prisma.follow.findMany({
      where: { followerId: req.userId },
      select: { followingId: true }
    })
    const followingIds = follows.map(f => f.followingId)

    if (followingIds.length === 0)
      return res.json([])

    // Get their posts
    const posts = await prisma.post.findMany({
      where: { authorId: { in: followingIds } },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        author:    { select: { username: true, image: true } },
        community: { select: { name: true, slug: true } },
        _count:    { select: { votes: true, comments: true } },
      }
    })
    res.json(posts)
  } catch (e) { res.status(500).json({ error: 'Server error' }) }
})

// GET /api/stats — public stats for landing page
app.get('/api/stats', async (req, res) => {
  const [posts, communities, users] = await Promise.all([
    prisma.post.count(),
    prisma.community.count(),
    prisma.user.count(),
  ])
  res.json({ posts, communities, users })
})