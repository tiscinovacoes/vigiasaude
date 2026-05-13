# Passo #3: Autenticação JWT e Segurança

Implementamos a camada de segurança para proteger os dados do Vigia Saúde.

## 1. O que foi instalado?
- `jsonwebtoken`: Para gerar e validar os tokens de acesso.
- `bcrypt`: Para criptografar e comparar senhas de forma segura.

## 2. Nova Variável no `.env`
Adicione uma chave secreta para assinar os tokens no seu arquivo `server/.env`:

```env
JWT_SECRET="uma_frase_muito_segura_e_aleatoria"
```

## 3. Como funciona a Autenticação?

### Login (`POST /auth/login`)
- Recebe `email` e `password`.
- Verifica se o usuário existe via Prisma.
- Compara a senha digitada com o hash salvo no banco.
- Retorna um JSON com os dados do usuário e o `token`.

### Middlewares de Proteção
- **`authMiddleware`**: Verificará em todas as rotas protegidas se o cabeçalho `Authorization: Bearer <TOKEN>` é válido.
- **`roleMiddleware`**: Bloqueia o acesso se o usuário não tiver o cargo necessário (ex: um Fornecedor tentando acessar rotas de Comprador).

## 4. Testando as Rotas Protegidas
Uma vez logado, você deve enviar o token em todas as requisições para:
- `GET /me`: Retorna os dados do seu token (id e role).
- `GET /comprador-only`: Só funciona se o seu usuário for `COMPRADOR`.
