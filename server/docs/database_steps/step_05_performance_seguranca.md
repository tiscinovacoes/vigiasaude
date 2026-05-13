# Passo #5: Performance e Segurança HTTP

Refinamos a robustez do backend e a velocidade das consultas no banco de dados.

## 1. Segurança de Infraestrutura
- **Helmet**: Adicionado para proteger a aplicação de vulnerabilidades web conhecidas, configurando cabeçalhos HTTP de segurança automaticamente.
- **CORS**: Configurado para permitir a comunicação com o frontend React.
- **Rate Limit**: Implementamos um limitador na rota de login. Se houver mais de 10 tentativas em 15 minutos do mesmo IP, a requisição será bloqueada. Isso previne ataques de força bruta.

## 2. Índices de Performance (Banco de Dados)
Adicionamos índices nas colunas mais consultadas para garantir que o sistema continue rápido mesmo com milhares de registros:
- **Tabela `pedidos_compra`**: Índices em `ataId` (filtro por ata) e `status` (filtro de listagem).
- **Tabela `auditorias`**: Índices em `usuarioId` (quem fez a ação) e `dataHora` (ordenar os logs).

## 3. Comandos Necessários
Como o schema mudou, você precisará rodar uma nova migration quando puder acessar o banco:

```bash
cd server
npx prisma migrate dev --name add_performance_indexes
```

## 4. O que testar
1. Tente errar a senha de login 11 vezes seguidas. Você deverá ver uma mensagem de bloqueio por tempo.
2. Observe que as consultas de auditoria e listagem de pedidos estarão mais rápidas em grandes volumes de dados.
