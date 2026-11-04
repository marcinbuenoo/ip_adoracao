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
| `GET` | `/songs` | Lista músicas por título |
| `POST` | `/songs` | Cadastra música (`title` e `lyrics` obrigatórios) |
| `GET` | `/songs/:id` | Busca música pelo ID |
| `PATCH` | `/songs/:id` | Atualiza campos da música |
| `DELETE` | `/songs/:id` | Exclui música |
| `GET` | `/events` | Lista eventos e seus repertórios |
| `POST` | `/events` | Cadastra culto ou ensaio |

Os campos opcionais de música são `artist`, `key` e `chords`. Para eventos, envie `title`, `type` (`WORSHIP` ou `REHEARSAL`) e `startsAt`; `location` e `notes` são opcionais.

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
- Adicionar autenticação, incluindo login Google
- Criar avisos para a equipe
