# Passo #4: Transações e Auditoria Automática

Implementamos a inteligência de negócio no backend, focando em integridade de dados e rastreabilidade.

## 1. Regras de Negócio Implementadas

### Saldo Disponível da ATA
- Ao criar um pedido (`POST /api/pedidos`), o sistema agora calcula automaticamente quanto da ATA já foi consumido.
- Se o valor do novo pedido ultrapassar o `valorTeto` da ATA, o sistema retorna um erro **400 (Bad Request)** e bloqueia a criação.

### Transações Atômicas (`prisma.$transaction`)
- A confirmação de entrega (`PATCH /api/pedidos/:id/entrega`) utiliza transações.
- Isso garante que o status do pedido **SÓ** mude se o log de auditoria for gravado com sucesso. Se um falhar, o outro sofre rollback.

## 2. Rastreabilidade (Compliance)
- Todo novo pedido e toda confirmação de entrega agora geram automaticamente um registro na tabela `Auditoria`.
- O log armazena:
    - Quem fez a ação (ID do usuário).
    - O que foi feito (`CRIACAO_PEDIDO`, `CONFIRMACAO_ENTREGA`).
    - O estado anterior e posterior dos dados (`dadosAntes` e `dadosDepois`).

## 3. Acesso aos Logs
- Criamos o endpoint `GET /api/auditoria`.
- **Segurança:** Apenas usuários com o perfil `COMPRADOR` podem visualizar esses logs.

## 4. Como testar
1. Faça login para obter o token.
2. Use o token para tentar criar um pedido com valor astronômico (deve falhar).
3. Confirme a entrega de um pedido existente e verifique se o log apareceu na auditoria.
