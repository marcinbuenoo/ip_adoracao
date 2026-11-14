# IP Adoração

Aplicativo para apoiar o ministério de louvor com repertório, músicas e eventos. O projeto está em desenvolvimento.

## Tecnologias

- **Aplicativo:** Flutter (Android e iOS)
- **API:** Node.js, TypeScript e Express
- **Banco de dados:** PostgreSQL hospedado no Neon
- **Acesso ao banco:** Prisma ORM

## Estrutura do projeto

```text
lib/       Aplicativo Flutter
backend/   API Express, schema Prisma e migrations
```

## Requisitos

- Flutter SDK e ferramentas para a plataforma que será executada
- Node.js e npm
- Projeto PostgreSQL no Neon

## Configurar o backend

No terminal, entre na pasta `backend` e instale as dependências:

```powershell
cd backend
npm install
```

Crie `backend/.env` com as duas URLs de conexão fornecidas pelo Neon:

```env
DATABASE_URL="URL pooled do Neon"
DIRECT_URL="URL direta do Neon"
GOOGLE_CLIENT_ID="ID do cliente OAuth configurado para o app"
JWT_SECRET="chave aleatória com pelo menos 32 caracteres"
BOOTSTRAP_ADMIN_EMAIL="email Google do primeiro administrador"
```

Use a URL com pooler em `DATABASE_URL` para as conexões da API e a URL direta em `DIRECT_URL` para as operações do Prisma CLI. O arquivo `.env` está no `.gitignore`; não envie credenciais ao repositório.

Gere o cliente Prisma e aplique migrations pendentes:

```powershell
npx prisma generate
npx prisma migrate dev
```

Inicie a API:

```powershell
npm run dev
```

O servidor local usa a porta `3000`. A rota `GET http://localhost:3000/health` retorna o status da API.

### Alterar o banco de dados

Depois de alterar `prisma/schema.prisma`, crie e aplique uma migration e atualize o cliente:

```powershell
npx prisma migrate dev --name nome_da_mudanca
npx prisma generate
```

## Executar o Flutter

Na raiz do projeto:

```powershell
flutter pub get
flutter run
```

O app ainda não está conectado à API.

## Rotas disponíveis

Base local: `http://localhost:3000`

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Verifica se a API está ativa |
| `POST` | `/auth/google` | Valida o ID token Google e inicia sessão ou informa que aguarda aprovação |
| `GET` | `/users/pending` | Lista cadastros pendentes (líder ou administrador) |
| `PATCH` | `/users/:userId/status` | Aprova (`ACTIVE`) ou rejeita (`REJECTED`) cadastro (líder ou administrador) |
| `PATCH` | `/users/:userId/role` | Define `MEMBER` ou `LEADER` (somente administrador) |
| `GET` | `/songs` | Lista músicas por título |
| `POST` | `/songs` | Cadastra música (`title` e `lyrics` obrigatórios) |
| `GET` | `/songs/:id` | Busca música pelo ID |
| `PATCH` | `/songs/:id` | Atualiza campos da música |
| `DELETE` | `/songs/:id` | Exclui música |
| `GET` | `/events` | Lista eventos e seus repertórios |
| `POST` | `/events` | Cadastra culto ou ensaio |
| `GET` | `/events/:eventId` | Busca evento e repertório pelo ID |
| `PATCH` | `/events/:eventId` | Atualiza campos do evento |
| `DELETE` | `/events/:eventId` | Exclui evento e seus itens de repertório |
| `POST` | `/events/:eventId/setlist` | Adiciona música ao repertório |
| `PATCH` | `/events/:eventId/setlist/:itemId` | Altera posição ou tom da música no repertório |
| `DELETE` | `/events/:eventId/setlist/:itemId` | Remove música do repertório |

Os campos opcionais de música são `artist`, `key` e `chords`. Para eventos, envie `title`, `type` (`WORSHIP` ou `REHEARSAL`) e `startsAt`; `location` e `notes` são opcionais.

As rotas `/songs`, `/events` e `/users` exigem `Authorization: Bearer <accessToken>`. Para entrar, envie `POST /auth/google` com `{ "idToken": "..." }`. Novos usuários ficam pendentes. O e-mail verificado definido em `BOOTSTRAP_ADMIN_EMAIL` recebe acesso de administrador para configurar os primeiros acessos. Um token de acesso válido dura 2 horas. Configure o OAuth do app para emitir um ID token com `GOOGLE_CLIENT_ID` como audience.

Depois de adicionar o modelo de usuário ao Prisma, aplique a alteração ao banco e gere o cliente:

```powershell
npx prisma migrate dev --name add_users_auth
npx prisma generate
```

Exemplo de cadastro de evento:

```json
{
  "title": "Culto de domingo",
  "type": "WORSHIP",
  "startsAt": "2026-11-08T19:30:00-03:00",
  "location": "Igreja",
  "notes": "Chegar às 18h"
}
```

## Próximas etapas

- Gerenciar músicas no app Flutter
- Criar e editar repertórios de eventos
- Organizar escalas e confirmações de presença
- Integrar o login Google no app Flutter
- Criar avisos para a equipe
