import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/authRoutes'
import apiRoutes from './routes/apiRoutes'
import { authMiddleware, roleMiddleware } from './middlewares/auth'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Rotas
app.use('/auth', authRoutes)
app.use('/api', apiRoutes)

// Rota de teste pública
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor Vigia Saúde está online.' })
})

// Rota de teste protegida
app.get('/me', authMiddleware, (req: any, res) => {
  res.json({ user: req.user })
})

// Exemplo de rota protegida por Role
app.get('/comprador-only', authMiddleware, roleMiddleware(['COMPRADOR']), (req, res) => {
  res.send('Acesso exclusivo para compradores.')
})

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`)
})
