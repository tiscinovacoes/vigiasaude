import express from 'express'
import cors from 'cors'
import * as dotenv from 'dotenv'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import authRoutes from './routes/authRoutes'
import apiRoutes from './routes/apiRoutes'
import { authMiddleware, roleMiddleware } from './middlewares/auth'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middlewares de Segurança
app.use(helmet())
app.use(cors())
app.use(express.json())

// Rate Limit para o Login (Prevenir Brute Force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 tentativas por IP
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
})

// Rotas
app.use('/auth', loginLimiter, authRoutes)
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
