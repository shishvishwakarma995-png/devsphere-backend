import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'DevSphere API is running 🚀' })
})

// TODO: add routes here on Day 3+

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`)
})