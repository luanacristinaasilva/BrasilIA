# 🌟 I've Seen This Before — Sororidade & Mentoria
### Time BrasilIA | Trilha: DataConcise / Modernização de Data & AI

> Quando a Dev ou a PO escreve uma especificação técnica, o agente não só busca padrões passados — ele faz matchmaking de mentoria e colaboração feminina.

---

## Stack Técnica

| Camada       | Tecnologia                                         | Motivo                                        |
|--------------|----------------------------------------------------|-----------------------------------------------|
| **Frontend** | React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui | Prototipagem rápida e UI bonita out-of-the-box |
| **Backend**  | Node.js + Express + TypeScript                     | Familiar, rápido, mesmo ecossistema            |
| **Data**     | JSON estático simulando repos/Confluence           | MVP sem banco de dados, fácil de apresentar    |
| **Testes**   | Vitest (unit) + Supertest (API) + Playwright (e2e) | Suite completa, zero config com Vite           |

---

## Estrutura de Pastas

```
hackaton/
├── README.md
├── package.json                    ← root workspace (npm workspaces)
├── .gitignore
│
├── data/                           ← STEP 1: Fonte de dados simulada
│   ├── users.json
│   ├── contributions.json
│   └── skills.json
│
├── backend/                        ← Node.js + Express + TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── src/
│       ├── index.ts
│       ├── app.ts
│       ├── step1-datasource/
│       │   ├── dataLoader.ts
│       │   └── types.ts
│       ├── step2-indexer/
│       │   ├── contributionIndexer.ts
│       │   └── tagService.ts
│       ├── step3-profiles/
│       │   ├── profileService.ts
│       │   └── profileRoutes.ts
│       ├── step4-matchmaking/
│       │   ├── matchmakingEngine.ts
│       │   ├── notificationService.ts
│       │   └── matchmakingRoutes.ts
│       ├── step5-scheduling/
│       │   ├── schedulingService.ts
│       │   └── schedulingRoutes.ts
│       └── shared/
│           └── utils.ts
│
├── backend/tests/
│   ├── unit/
│   │   ├── dataLoader.test.ts
│   │   ├── contributionIndexer.test.ts
│   │   ├── profileService.test.ts
│   │   ├── matchmakingEngine.test.ts
│   │   └── schedulingService.test.ts
│   └── functional/
│       ├── profiles.api.test.ts
│       ├── matchmaking.api.test.ts
│       └── scheduling.api.test.ts
│
└── frontend/                       ← React + Vite + TypeScript + Tailwind
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── playwright.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── pages/
        │   ├── Home.tsx
        │   ├── Contributions.tsx
        │   ├── Profile.tsx
        │   ├── Matchmaking.tsx
        │   └── Scheduling.tsx
        ├── components/
        │   ├── layout/
        │   │   ├── Header.tsx
        │   │   ├── Sidebar.tsx
        │   │   └── Footer.tsx
        │   ├── contributions/
        │   │   ├── ContributionCard.tsx
        │   │   └── ContributionList.tsx
        │   ├── profile/
        │   │   ├── ProfileCard.tsx
        │   │   ├── SkillBadge.tsx
        │   │   └── OptInToggle.tsx
        │   ├── matchmaking/
        │   │   ├── MatchCard.tsx
        │   │   └── MatchList.tsx
        │   └── scheduling/
        │       ├── ScheduleModal.tsx
        │       └── ChatCard.tsx
        ├── hooks/
        │   ├── useContributions.ts
        │   ├── useProfile.ts
        │   ├── useMatchmaking.ts
        │   └── useScheduling.ts
        ├── services/
        │   ├── api.ts
        │   ├── contributionsService.ts
        │   ├── profileService.ts
        │   ├── matchmakingService.ts
        │   └── schedulingService.ts
        ├── types/
        │   └── index.ts
        └── tests/
            ├── unit/
            │   ├── ContributionCard.test.tsx
            │   ├── ProfileCard.test.tsx
            │   ├── MatchCard.test.tsx
            │   └── matchmakingService.test.ts
            └── functional/
                ├── home.spec.ts
                ├── profile.spec.ts
                ├── matchmaking.spec.ts
                └── scheduling.spec.ts
```

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos

- **Node.js** v18+ (testado com v25)
- **npm** v9+

### 1. Instalar dependências

```bash
# Na raiz do projeto (instala tudo via npm workspaces)
npm install
```

### 2. Rodar backend + frontend juntos (macOS)

```bash
# Script que abre 2 janelas do Terminal automaticamente
bash start.sh
```

Isso vai:
1. Matar processos anteriores nas portas 3000 e 3001
2. Abrir o backend em nova janela do Terminal (`cd backend && npm run dev`)
3. Abrir o frontend em outra janela do Terminal (`cd frontend && npm run dev`)
4. Confirmar que o backend está respondendo

### 3. Abrir no navegador

| Serviço | URL |
|---------|-----|
| 🎨 **Frontend** | http://localhost:3000 |
| 📡 **Backend API** | http://localhost:3001/api/health |

### 4. Rodar separadamente (modo manual)

**Backend:**
```bash
cd backend
npm run dev
# Servidor sobe em http://localhost:3001
```

**Frontend (em outro terminal):**
```bash
cd frontend
npm run dev
# App disponível em http://localhost:3000
```

### 5. Rodar os testes

```bash
# Todos os testes (backend + frontend)
npm test

# Só backend
npm run test:backend

# Só frontend
npm run test:frontend
```

---

## 🗺️ Rotas disponíveis

| Página | URL | Descrição |
|--------|-----|-----------|
| Dashboard | `/` | Visão geral com stats e destaques |
| Contribuições | `/contributions` | Lista com busca e filtros |
| Meu Perfil | `/profile/u6` | Perfil com toggle de mentoria |
| Matchmaking | `/matchmaking` | Mentoras com score de compatibilidade |
| Agenda | `/scheduling` | Sessões agendadas + chat |

### API Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Health check |
| GET | `/api/profiles` | Lista todos os perfis |
| GET | `/api/profiles/:id` | Perfil por ID |
| PATCH | `/api/profiles/:id/opt-in` | Toggle opt-in mentoria |
| GET | `/api/contributions` | Lista contribuições (filtrável) |
| GET | `/api/contributions/tags` | Top tags |
| GET | `/api/matchmaking/:userId` | Matches para uma usuária |
| POST | `/api/matchmaking/notify` | Notificar mentora |
| GET | `/api/scheduling/:userId` | Sessões de uma usuária |
| POST | `/api/scheduling` | Criar sessão |
| GET | `/api/scheduling/:sessionId/chat` | Mensagens do chat |
| POST | `/api/scheduling/:sessionId/chat` | Enviar mensagem |

---

## 👩‍💻 Usuária Demo

A aplicação usa por padrão a usuária **`u6`** (definida em `frontend/src/constants.ts`).  
Para trocar, edite o valor de `CURRENT_USER_ID` nesse arquivo.

---

## ☁️ Deploy em Nuvem

O projeto segue o padrão de nomenclatura **`GlobalHack-IveSeenThisBefore`**.

### Arquitetura de Deploy

| Camada | AWS | GCP |
|--------|-----|-----|
| **Backend** | App Runner (via ECR) | Cloud Run (via Artifact Registry) |
| **Frontend** | S3 + CloudFront | Cloud Storage + CDN |
| **CI/CD** | GitHub Actions | GitHub Actions |

### Pré-requisitos comuns

- Docker instalado e rodando
- Repositório conectado ao GitHub

---

### 🟠 Deploy AWS (App Runner + S3 + CloudFront)

**1. Configurar credenciais AWS:**
```bash
aws configure
# AWS Access Key ID: ...
# AWS Secret Access Key: ...
# Default region: us-east-1
```

**2. Executar o script de deploy:**
```bash
bash infrastructure/aws-deploy.sh
# Opcional: definir região diferente
AWS_REGION=sa-east-1 bash infrastructure/aws-deploy.sh
```

O script faz automaticamente:
1. Cria repositório no **ECR**
2. Build e push da imagem Docker do backend
3. Cria/atualiza serviço no **App Runner** (auto-deploy ativado)
4. Cria bucket **S3** com hosting estático
5. Cria distribuição **CloudFront** com HTTPS

**Resultado:**
```
✅ Frontend : https://xxxxxxxx.cloudfront.net
✅ API      : https://xxxxxxxx.us-east-1.awsapprunner.com
```

**Secrets para GitHub Actions (Settings → Secrets):**
| Secret | Valor |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | Access key da IAM user |
| `AWS_SECRET_ACCESS_KEY` | Secret key da IAM user |
| `AWS_REGION` | Ex: `us-east-1` |

---

### 🔵 Deploy GCP (Cloud Run + Cloud Storage)

**1. Autenticar e configurar projeto:**
```bash
gcloud auth login
gcloud config set project MEU_PROJETO_GCP
```

**2. Executar o script de deploy:**
```bash
GCP_PROJECT=meu-projeto bash infrastructure/gcp-deploy.sh
# Opcional: definir região
GCP_PROJECT=meu-projeto GCP_REGION=southamerica-east1 bash infrastructure/gcp-deploy.sh
```

O script faz automaticamente:
1. Ativa as APIs necessárias (Cloud Run, Artifact Registry, Storage)
2. Cria repositório no **Artifact Registry**
3. Build e push da imagem Docker
4. Deploy no **Cloud Run** (serverless, escala para zero)
5. Deploy do frontend no **Cloud Storage** com CDN

**Resultado:**
```
✅ Frontend : https://storage.googleapis.com/.../index.html
✅ API      : https://globalhack-iveseenthisbefore-api-xxxx.run.app
```

**Secrets para GitHub Actions:**
| Secret | Valor |
|--------|-------|
| `GCP_SA_KEY` | JSON da Service Account com permissões Cloud Run + Storage |
| `GCP_PROJECT` | ID do projeto GCP |
| `GCP_REGION` | Ex: `us-central1` |

---

### 🐳 Testar com Docker localmente

```bash
# Subir backend + frontend em containers
docker compose up --build

# Frontend → http://localhost:3000
# Backend  → http://localhost:3001/api/health
```

---

### 🔄 CI/CD com GitHub Actions

O workflow `.github/workflows/deploy.yml` dispara automaticamente em push para `main`:

1. Roda os testes do backend
2. Se passarem, faz deploy em AWS e/ou GCP

**Trigger manual** (para escolher o destino):
- Vá em **Actions → Deploy → Run workflow**
- Escolha: `aws`, `gcp` ou `both`
