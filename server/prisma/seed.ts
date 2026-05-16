import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Iniciando seed...')

  // Limpar dados existentes (opcional, cuidado em produção)
  // await prisma.auditoria.deleteMany({})
  // await prisma.pedidoCompra.deleteMany({})
  // await prisma.medicamentoAta.deleteMany({})
  // await prisma.ata.deleteMany({})
  // await prisma.user.deleteMany({})

  // Criar Usuário Comprador
  const comprador = await prisma.user.upsert({
    where: { email: 'comprador@vigiasaude.com.br' },
    update: {},
    create: {
      nome: 'João Comprador',
      email: 'comprador@vigiasaude.com.br',
      senhaHash: '$2b$10$BOy0TlhfA4uYyvDEN0bCHeK8eRwAjqumO60t72AEyxJ3TGEgR/fgS', // Senha: 123456
      role: 'COMPRADOR',
    },
  })

  // Criar Usuário Fornecedor
  const fornecedor = await prisma.user.upsert({
    where: { email: 'fornecedor@medsupply.com.br' },
    update: {},
    create: {
      nome: 'Maria Fornecedora',
      email: 'fornecedor@medsupply.com.br',
      senhaHash: '$2b$10$BOy0TlhfA4uYyvDEN0bCHeK8eRwAjqumO60t72AEyxJ3TGEgR/fgS', // Senha: 123456
      role: 'FORNECEDOR',
      fornecedorId: 'f1',
    },
  })

  console.log({ comprador, fornecedor })
  console.log('Seed finalizado com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    //@ts-ignore
    if (typeof process !== 'undefined') process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
