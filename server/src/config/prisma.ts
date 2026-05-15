import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['error', 'warn'],
})

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada nas variáveis de ambiente!')
}

export default prisma
