/**
 * =========================================================
 * STEP 2 — Classificador de Impacto por IA
 * =========================================================
 *
 * COMO FUNCIONA (pipeline de classificação):
 *
 *  1. COLETA: os dados chegam de GitHub (PRs, commits) e
 *     Confluence (specs, ADRs, RFCs) via dataLoader.ts
 *
 *  2. SINAIS: para cada contribuição extraímos sinais:
 *     - Engajamento social    → likes, comentários
 *     - Tipo de artefato      → PR, spec, ADR, RFC
 *     - Vocabulário técnico   → palavras de alto/baixo impacto
 *     - Tags de domínio       → Security, Architecture, Performance
 *     - Tamanho do contexto   → specs longas = mais impacto
 *
 *  3. CLASSIFICAÇÃO (2 modos):
 *     a) HEURÍSTICA (padrão, sem API key):
 *        → Soma de pontos ponderados por sinal
 *        → Threshold: ≥ 7 = high | 4-6 = medium | < 4 = low
 *
 *     b) LLM / OpenAI (produção):
 *        → Prompt estruturado com os sinais como contexto
 *        → GPT-4o retorna { impact, reason, confidence }
 *        → Veja classifyWithOpenAI() abaixo
 *
 *  4. RESULTADO: campo `impact` é sobrescrito no runtime
 *     (o JSON estático vira apenas seed — a IA reclassifica)
 * =========================================================
 */

import { Contribution } from '../step1-datasource/types'

// ── Sinais de ALTO impacto (palavras e tags) ──────────────
const HIGH_IMPACT_KEYWORDS = [
  'security', 'autenticação', 'auth', 'oauth', 'jwt', 'vulnerabilidade',
  'arquitetura', 'architecture', 'adr', 'rfc', 'decisão técnica',
  'migração', 'migration', 'refatoração', 'refactoring',
  'performance', 'escalabilidade', 'scalability',
  'breaking change', 'deprecation',
  'design system', 'api gateway', 'infrastructure',
  'ci/cd', 'pipeline', 'observability', 'monitoring',
  'gdpr', 'lgpd', 'compliance', 'auditoria',
  'crítico', 'critical', 'produção', 'production',
]

// ── Sinais de BAIXO impacto ───────────────────────────────
const LOW_IMPACT_KEYWORDS = [
  'typo', 'typos', 'correção de texto', 'atualização de readme',
  'bump version', 'update dependency', 'minor fix',
  'wip', 'chore', 'linting', 'formatação', 'prettier',
]

// ── Tags de alto impacto ──────────────────────────────────
const HIGH_IMPACT_TAGS = [
  'security', 'architecture', 'performance', 'auth', 'oauth2',
  'infrastructure', 'ci/cd', 'design-system', 'migration',
  'refactoring', 'api', 'database', 'scalability', 'compliance',
]

// ── Interface do resultado da classificação ───────────────
export interface ImpactScore {
  impact: 'low' | 'medium' | 'high'
  score: number
  signals: string[]   // por que foi classificado assim
  confidence: number  // 0-1
}

// =========================================================
// MODO A: Classificação Heurística (padrão — sem API key)
// =========================================================
export function classifyImpactHeuristic(contribution: Contribution): ImpactScore {
  let score = 0
  const signals: string[] = []

  const textLower = `${contribution.title} ${contribution.description}`.toLowerCase()
  const tagsLower = contribution.tags.map((t) => t.toLowerCase())

  // ── Sinal 1: Engajamento social (likes) ───────────────
  if (contribution.likes >= 20) {
    score += 3
    signals.push(`Alta repercussão: ${contribution.likes} likes`)
  } else if (contribution.likes >= 10) {
    score += 2
    signals.push(`Boa repercussão: ${contribution.likes} likes`)
  } else if (contribution.likes >= 5) {
    score += 1
    signals.push(`Repercussão moderada: ${contribution.likes} likes`)
  }

  // ── Sinal 2: Tipo de artefato ─────────────────────────
  if (contribution.type === 'pull_request') {
    score += 2
    signals.push('Pull Request: impacto direto no código')
  } else if (contribution.type === 'confluence') {
    score += 1
    signals.push('Confluence: documentação/spec técnica')
  }

  // ── Sinal 3: Palavras de alto impacto no texto ────────
  const highKeywordsFound = HIGH_IMPACT_KEYWORDS.filter((k) =>
    textLower.includes(k.toLowerCase())
  )
  if (highKeywordsFound.length > 0) {
    const points = Math.min(highKeywordsFound.length * 1.5, 4) // cap 4 pts
    score += points
    signals.push(`Vocabulário crítico: ${highKeywordsFound.slice(0, 3).join(', ')}`)
  }

  // ── Sinal 4: Tags de alto impacto ────────────────────
  const highTagsFound = tagsLower.filter((t) =>
    HIGH_IMPACT_TAGS.some((ht) => t.includes(ht))
  )
  if (highTagsFound.length >= 2) {
    score += 2
    signals.push(`Tags de alto impacto: ${highTagsFound.join(', ')}`)
  } else if (highTagsFound.length === 1) {
    score += 1
    signals.push(`Tag de alto impacto: ${highTagsFound[0]}`)
  }

  // ── Sinal 5: Profundidade do conteúdo ─────────────────
  const wordCount = contribution.description.split(/\s+/).length
  if (wordCount > 50) {
    score += 1
    signals.push(`Descrição detalhada: ${wordCount} palavras`)
  }

  // ── Sinal 6: Palavras de baixo impacto (penalidade) ──
  const lowKeywordsFound = LOW_IMPACT_KEYWORDS.filter((k) =>
    textLower.includes(k.toLowerCase())
  )
  if (lowKeywordsFound.length > 0) {
    score -= 2
    signals.push(`⬇️ Baixo impacto detectado: ${lowKeywordsFound.join(', ')}`)
  }

  // ── Classificação final ───────────────────────────────
  const impact: 'low' | 'medium' | 'high' =
    score >= 7 ? 'high' : score >= 4 ? 'medium' : 'low'

  const confidence = Math.min(0.5 + Math.abs(score - 4) * 0.05, 0.95)

  return { impact, score, signals, confidence }
}

// =========================================================
// MODO B: Classificação com OpenAI GPT-4o
// =========================================================
// Para usar: defina OPENAI_API_KEY no ambiente (.env)
//
// Instalar: npm install openai --workspace=backend
//
// Exemplo de uso:
//   const result = await classifyWithOpenAI(contribution)
//   contribution.impact = result.impact
//
// =========================================================
export async function classifyWithOpenAI(
  contribution: Contribution,
  openaiApiKey?: string
): Promise<ImpactScore> {
  const apiKey = openaiApiKey ?? process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.warn('[ImpactClassifier] OPENAI_API_KEY não definida — usando heurística')
    return classifyImpactHeuristic(contribution)
  }

  const prompt = `
Você é um especialista em engenharia de software analisando contribuições técnicas.

Classifique o impacto desta contribuição como "high", "medium" ou "low".

Contribuição:
- Título: ${contribution.title}
- Tipo: ${contribution.type}
- Tags: ${contribution.tags.join(', ')}
- Likes: ${contribution.likes}
- Descrição: ${contribution.description}

Critérios:
- HIGH: mudanças arquiteturais, segurança, migrations, design systems, breaking changes, specs estratégicas
- MEDIUM: features completas, refatorações significativas, documentação de produto
- LOW: correções pontuais, atualizações de dependências, typos, chores

Responda APENAS com JSON no formato:
{"impact": "high|medium|low", "reason": "string", "confidence": 0.0-1.0}
`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1, // baixo para classificação consistente
      }),
    })

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>
    }
    const parsed = JSON.parse(data.choices[0].message.content) as {
      impact: 'low' | 'medium' | 'high'
      reason: string
      confidence: number
    }

    return {
      impact: parsed.impact,
      score: parsed.confidence * 10,
      signals: [parsed.reason],
      confidence: parsed.confidence,
    }
  } catch (err) {
    console.error('[ImpactClassifier] Erro OpenAI — fallback heurística:', err)
    return classifyImpactHeuristic(contribution)
  }
}

// =========================================================
// CLASSIFICADOR PRINCIPAL — chama heurística ou OpenAI
// =========================================================
export async function classifyImpact(
  contribution: Contribution
): Promise<ImpactScore> {
  if (process.env.OPENAI_API_KEY) {
    return classifyWithOpenAI(contribution)
  }
  return classifyImpactHeuristic(contribution)
}

// =========================================================
// Reclassifica um array de contribuições em batch
// =========================================================
export async function reclassifyAll(
  contributions: Contribution[]
): Promise<Contribution[]> {
  const results = await Promise.all(
    contributions.map(async (c) => {
      const { impact } = await classifyImpact(c)
      return { ...c, impact }
    })
  )
  return results
}
