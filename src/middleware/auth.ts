import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export function requireAuth(req: any, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader?.split(' ')[1] // "Bearer TOKEN"

  if (!token) return res.status(401).json({ error: 'Not logged in' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    req.userId = decoded.userId
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}