#!/bin/bash
# =========================================================
# GlobalHack-IveSeenThisBefore — Deploy GCP
# =========================================================
# Serviços utilizados:
#   Backend  → Cloud Run (via Artifact Registry)
#   Frontend → Cloud Storage + Load Balancer com CDN
#
# Pré-requisitos:
#   - gcloud CLI instalado e autenticado (gcloud auth login)
#   - Docker instalado e rodando
#   - Projeto GCP criado e faturamento ativo
#
# Uso:
#   GCP_PROJECT=meu-projeto bash infrastructure/gcp-deploy.sh
# =========================================================

set -e

# ── Configurações ───────────────────────────────────────
PROJECT="GlobalHack-IveSeenThisBefore"
PROJECT_SLUG="globalhack-iveseenthisbefore"
GCP_PROJECT="${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"
GCP_REGION="${GCP_REGION:-us-central1}"
AR_REPO="${PROJECT_SLUG}"
AR_REGISTRY="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT}/${AR_REPO}"
CLOUD_RUN_SERVICE="${PROJECT_SLUG}-api"
GCS_BUCKET="${GCP_PROJECT}-${PROJECT_SLUG}-frontend"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ -z "${GCP_PROJECT}" ]; then
  echo "❌ Defina a variável GCP_PROJECT: export GCP_PROJECT=meu-projeto"
  exit 1
fi

echo "================================================="
echo "🚀 Deploy: ${PROJECT}"
echo "   Projeto : ${GCP_PROJECT}"
echo "   Região  : ${GCP_REGION}"
echo "================================================="

# ── Ativar APIs necessárias ────────────────────────────
echo ""
echo "🔧 [0/5] Ativando APIs do GCP..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  storage.googleapis.com \
  --project="${GCP_PROJECT}" --quiet
echo "   ✅ APIs ativadas"

# ── 1. Artifact Registry ───────────────────────────────
echo ""
echo "📦 [1/5] Configurando Artifact Registry..."
gcloud artifacts repositories describe "${AR_REPO}" \
  --location="${GCP_REGION}" --project="${GCP_PROJECT}" > /dev/null 2>&1 || \
  gcloud artifacts repositories create "${AR_REPO}" \
    --repository-format=docker \
    --location="${GCP_REGION}" \
    --project="${GCP_PROJECT}" \
    --description="Docker images — ${PROJECT}" \
    --quiet
echo "   ✅ Repositório: ${AR_REGISTRY}"

# ── 2. Build & Push da imagem ─────────────────────────
echo ""
echo "🐳 [2/5] Build e push da imagem backend..."
gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet

cd "${ROOT_DIR}"
docker build \
  -f backend/Dockerfile \
  -t "${AR_REGISTRY}/${CLOUD_RUN_SERVICE}:latest" \
  .

docker push "${AR_REGISTRY}/${CLOUD_RUN_SERVICE}:latest"
echo "   ✅ Imagem publicada: ${AR_REGISTRY}/${CLOUD_RUN_SERVICE}:latest"

# ── 3. Cloud Run ───────────────────────────────────────
echo ""
echo "⚡ [3/5] Deploy no Cloud Run..."
gcloud run deploy "${CLOUD_RUN_SERVICE}" \
  --image="${AR_REGISTRY}/${CLOUD_RUN_SERVICE}:latest" \
  --platform=managed \
  --region="${GCP_REGION}" \
  --project="${GCP_PROJECT}" \
  --port=8080 \
  --cpu=1 \
  --memory=512Mi \
  --min-instances=0 \
  --max-instances=5 \
  --set-env-vars="NODE_ENV=production" \
  --allow-unauthenticated \
  --labels="project=${PROJECT_SLUG}" \
  --quiet

API_URL=$(gcloud run services describe "${CLOUD_RUN_SERVICE}" \
  --platform=managed \
  --region="${GCP_REGION}" \
  --project="${GCP_PROJECT}" \
  --format="value(status.url)")
echo "   ✅ API disponível em: ${API_URL}"

# ── 4. Cloud Storage — frontend ────────────────────────
echo ""
echo "🪣 [4/5] Deploy frontend → Cloud Storage..."

# Criar bucket se não existir
gsutil ls "gs://${GCS_BUCKET}" > /dev/null 2>&1 || \
  gsutil mb -p "${GCP_PROJECT}" -l "${GCP_REGION}" "gs://${GCS_BUCKET}"

# Website config
gsutil web set -m index.html -e index.html "gs://${GCS_BUCKET}"

# Tornar público
gsutil iam ch allUsers:objectViewer "gs://${GCS_BUCKET}"

# Build frontend com URL da API
cd "${ROOT_DIR}"
VITE_API_URL="${API_URL}" \
  node_modules/.bin/vite build --config frontend/vite.config.ts > /dev/null

# Upload
gsutil -m rsync -r -d frontend/dist/ "gs://${GCS_BUCKET}/"

# Cache: assets com hash = 1 ano, index.html = sem cache
gsutil -m setmeta -h "Cache-Control:public,max-age=31536000,immutable" \
  "gs://${GCS_BUCKET}/assets/**" 2>/dev/null || true
gsutil setmeta -h "Cache-Control:no-cache,no-store,must-revalidate" \
  "gs://${GCS_BUCKET}/index.html"

FRONTEND_URL="https://storage.googleapis.com/${GCS_BUCKET}/index.html"
echo "   ✅ Frontend: ${FRONTEND_URL}"

# ── 5. CORS no Cloud Storage ──────────────────────────
echo ""
echo "🔒 [5/5] Configurando CORS..."
cat > /tmp/cors-config.json << EOF
[{
  "origin": ["${API_URL}", "*"],
  "method": ["GET", "HEAD"],
  "responseHeader": ["Content-Type"],
  "maxAgeSeconds": 3600
}]
EOF
gsutil cors set /tmp/cors-config.json "gs://${GCS_BUCKET}"

# ── Resumo final ───────────────────────────────────────
echo ""
echo "================================================="
echo "✅ Deploy concluído — ${PROJECT}"
echo ""
echo "   🌐 Frontend : ${FRONTEND_URL}"
echo "   📡 Backend  : ${API_URL}"
echo "   📡 Health   : ${API_URL}/api/health"
echo ""
echo "   💡 Para domínio customizado no Cloud Run:"
echo "      gcloud run domain-mappings create \\"
echo "        --service=${CLOUD_RUN_SERVICE} \\"
echo "        --domain=api.seuprojeto.com \\"
echo "        --region=${GCP_REGION}"
echo "================================================="
