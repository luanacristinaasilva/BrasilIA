#!/bin/bash
# =========================================================
# GlobalHack-IveSeenThisBefore — Deploy AWS
# =========================================================
# Serviços utilizados:
#   Backend  → AWS App Runner (via ECR)
#   Frontend → S3 + CloudFront
#
# Pré-requisitos:
#   - aws CLI configurado (aws configure)
#   - Docker instalado e rodando
#   - Permissões: ECR, AppRunner, S3, CloudFront
#
# Uso:
#   bash infrastructure/aws-deploy.sh [--region us-east-1]
# =========================================================

set -e

# ── Configurações ───────────────────────────────────────
PROJECT="GlobalHack-IveSeenThisBefore"
PROJECT_SLUG="globalhack-iveseenthisbefore"
REGION="${AWS_REGION:-us-east-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
ECR_REPO="${PROJECT_SLUG}-api"
S3_BUCKET="${PROJECT_SLUG}-frontend"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "================================================="
echo "🚀 Deploy: ${PROJECT}"
echo "   Região  : ${REGION}"
echo "   Account : ${AWS_ACCOUNT_ID}"
echo "================================================="

# ── 1. ECR — criar repositório se não existir ──────────
echo ""
echo "📦 [1/5] Configurando ECR..."
aws ecr describe-repositories --repository-names "${ECR_REPO}" \
  --region "${REGION}" > /dev/null 2>&1 || \
  aws ecr create-repository \
    --repository-name "${ECR_REPO}" \
    --region "${REGION}" \
    --tags Key=Project,Value="${PROJECT}" > /dev/null
echo "   ✅ Repositório ECR: ${ECR_REGISTRY}/${ECR_REPO}"

# ── 2. Build & Push da imagem do backend ───────────────
echo ""
echo "🐳 [2/5] Build e push da imagem backend..."
aws ecr get-login-password --region "${REGION}" \
  | docker login --username AWS --password-stdin "${ECR_REGISTRY}"

cd "${ROOT_DIR}"
docker build \
  -f backend/Dockerfile \
  -t "${ECR_REPO}:latest" \
  -t "${ECR_REGISTRY}/${ECR_REPO}:latest" \
  .

docker push "${ECR_REGISTRY}/${ECR_REPO}:latest"
echo "   ✅ Imagem publicada: ${ECR_REGISTRY}/${ECR_REPO}:latest"

# ── 3. App Runner — criar ou atualizar serviço ─────────
echo ""
echo "⚡ [3/5] Configurando App Runner..."

# Role para App Runner acessar ECR (cria se não existir)
ROLE_NAME="${PROJECT_SLUG}-apprunner-role"
ROLE_ARN=$(aws iam get-role --role-name "${ROLE_NAME}" \
  --query Role.Arn --output text 2>/dev/null || echo "")

if [ -z "${ROLE_ARN}" ]; then
  ROLE_ARN=$(aws iam create-role \
    --role-name "${ROLE_NAME}" \
    --assume-role-policy-document '{
      "Version":"2012-10-17",
      "Statement":[{"Effect":"Allow","Principal":{"Service":"build.apprunner.amazonaws.com"},"Action":"sts:AssumeRole"}]
    }' \
    --query Role.Arn --output text)
  aws iam attach-role-policy \
    --role-name "${ROLE_NAME}" \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess
  echo "   ✅ IAM Role criada: ${ROLE_ARN}"
fi

# Verificar se o serviço já existe
SERVICE_ARN=$(aws apprunner list-services --region "${REGION}" \
  --query "ServiceSummaryList[?ServiceName=='${PROJECT_SLUG}-api'].ServiceArn" \
  --output text 2>/dev/null || echo "")

if [ -z "${SERVICE_ARN}" ]; then
  echo "   Criando novo serviço App Runner..."
  SERVICE_ARN=$(aws apprunner create-service \
    --region "${REGION}" \
    --service-name "${PROJECT_SLUG}-api" \
    --source-configuration "{
      \"ImageRepository\": {
        \"ImageIdentifier\": \"${ECR_REGISTRY}/${ECR_REPO}:latest\",
        \"ImageRepositoryType\": \"ECR\",
        \"ImageConfiguration\": {
          \"Port\": \"8080\",
          \"RuntimeEnvironmentVariables\": {\"NODE_ENV\": \"production\"}
        }
      },
      \"AuthenticationConfiguration\": {\"AccessRoleArn\": \"${ROLE_ARN}\"},
      \"AutoDeploymentsEnabled\": true
    }" \
    --instance-configuration '{"Cpu":"0.25 vCPU","Memory":"0.5 GB"}' \
    --tags "[{\"Key\":\"Project\",\"Value\":\"${PROJECT}\"}]" \
    --query Service.ServiceArn --output text)
  echo "   ✅ App Runner criado. Aguardando inicialização..."
  aws apprunner wait service-running \
    --service-arn "${SERVICE_ARN}" --region "${REGION}" 2>/dev/null || true
else
  echo "   Atualizando serviço existente..."
  aws apprunner start-deployment \
    --service-arn "${SERVICE_ARN}" --region "${REGION}" > /dev/null
fi

API_URL=$(aws apprunner describe-service \
  --service-arn "${SERVICE_ARN}" --region "${REGION}" \
  --query Service.ServiceUrl --output text)
echo "   ✅ API disponível em: https://${API_URL}"

# ── 4. S3 — criar bucket e fazer deploy do frontend ───
echo ""
echo "🪣 [4/5] Deploy frontend → S3..."

# Criar bucket se não existir
aws s3api head-bucket --bucket "${S3_BUCKET}" 2>/dev/null || \
  aws s3api create-bucket \
    --bucket "${S3_BUCKET}" \
    --region "${REGION}" \
    $([ "${REGION}" != "us-east-1" ] && echo "--create-bucket-configuration LocationConstraint=${REGION}") \
    > /dev/null

# Desabilitar bloqueio público e configurar website
aws s3api put-public-access-block \
  --bucket "${S3_BUCKET}" \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

aws s3api put-bucket-website \
  --bucket "${S3_BUCKET}" \
  --website-configuration '{"IndexDocument":{"Suffix":"index.html"},"ErrorDocument":{"Key":"index.html"}}'

aws s3api put-bucket-policy \
  --bucket "${S3_BUCKET}" \
  --policy "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Sid\":\"PublicRead\",\"Effect\":\"Allow\",\"Principal\":\"*\",\"Action\":\"s3:GetObject\",\"Resource\":\"arn:aws:s3:::${S3_BUCKET}/*\"}]}"

# Build e upload do frontend (com URL da API)
cd "${ROOT_DIR}"
VITE_API_URL="https://${API_URL}" \
  node_modules/.bin/vite build --config frontend/vite.config.ts > /dev/null

aws s3 sync frontend/dist/ "s3://${S3_BUCKET}/" \
  --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html"

aws s3 cp frontend/dist/index.html "s3://${S3_BUCKET}/index.html" \
  --cache-control "no-cache,no-store,must-revalidate"

echo "   ✅ Frontend no S3: http://${S3_BUCKET}.s3-website-${REGION}.amazonaws.com"

# ── 5. CloudFront — distribuição sobre o S3 ───────────
echo ""
echo "🌐 [5/5] Configurando CloudFront..."

DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='${PROJECT_SLUG}'].Id" \
  --output text 2>/dev/null || echo "")

if [ -z "${DISTRIBUTION_ID}" ]; then
  DISTRIBUTION_ID=$(aws cloudfront create-distribution \
    --distribution-config "{
      \"CallerReference\": \"${PROJECT_SLUG}-$(date +%s)\",
      \"Comment\": \"${PROJECT_SLUG}\",
      \"DefaultRootObject\": \"index.html\",
      \"Origins\": {
        \"Quantity\": 1,
        \"Items\": [{
          \"Id\": \"S3-${S3_BUCKET}\",
          \"DomainName\": \"${S3_BUCKET}.s3-website-${REGION}.amazonaws.com\",
          \"CustomOriginConfig\": {
            \"HTTPPort\": 80,\"HTTPSPort\": 443,
            \"OriginProtocolPolicy\": \"http-only\"
          }
        }]
      },
      \"DefaultCacheBehavior\": {
        \"TargetOriginId\": \"S3-${S3_BUCKET}\",
        \"ViewerProtocolPolicy\": \"redirect-to-https\",
        \"CachePolicyId\": \"658327ea-f89d-4fab-a63d-7e88639e58f6\",
        \"AllowedMethods\": {\"Quantity\": 2, \"Items\": [\"GET\",\"HEAD\"]}
      },
      \"CustomErrorResponses\": {
        \"Quantity\": 1,
        \"Items\": [{
          \"ErrorCode\": 404,
          \"ResponsePagePath\": \"/index.html\",
          \"ResponseCode\": \"200\",
          \"ErrorCachingMinTTL\": 0
        }]
      },
      \"Enabled\": true,
      \"PriceClass\": \"PriceClass_100\"
    }" \
    --query Distribution.Id --output text)
  echo "   ✅ CloudFront criado (propagação leva ~5 min): ${DISTRIBUTION_ID}"
else
  aws cloudfront create-invalidation \
    --distribution-id "${DISTRIBUTION_ID}" \
    --paths "/*" > /dev/null
  echo "   ✅ Cache do CloudFront invalidado: ${DISTRIBUTION_ID}"
fi

CF_DOMAIN=$(aws cloudfront get-distribution \
  --id "${DISTRIBUTION_ID}" \
  --query Distribution.DomainName --output text)

# ── Resumo final ───────────────────────────────────────
echo ""
echo "================================================="
echo "✅ Deploy concluído — ${PROJECT}"
echo ""
echo "   🌐 Frontend : https://${CF_DOMAIN}"
echo "   📡 Backend  : https://${API_URL}"
echo "   📡 Health   : https://${API_URL}/api/health"
echo "================================================="
