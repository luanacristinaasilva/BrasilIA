import { Contribution, User } from '../step1-datasource/types'
import { buildTagIndex, TagIndex, searchByTags } from './tagService'
import { classifyImpactHeuristic, ImpactScore } from './impactClassifier'

export interface ContributionWithUser extends Contribution {
  user?: {
    id: string
    name: string
    avatar: string
    role: string
  }
  impactScore?: ImpactScore  // sinais explicativos da classificação
}

export interface IndexedData {
  contributions: Contribution[]
  tagIndex: TagIndex
  userSkillMap: Record<string, string[]> // userId -> skills
}

export function buildIndex(contributions: Contribution[], users: User[]): IndexedData {
  const tagIndex = buildTagIndex(contributions)

  const userSkillMap: Record<string, string[]> = {}
  for (const user of users) {
    userSkillMap[user.id] = user.skills.map((s) => s.toLowerCase())
  }

  // ── Reclassifica o impacto de cada contribuição via IA ──
  // (sobrescreve o campo estático do JSON com a classificação inteligente)
  const reclassified = contributions.map((c) => {
    const impactScore = classifyImpactHeuristic(c)
    return { ...c, impact: impactScore.impact }
  })

  return { contributions: reclassified, tagIndex, userSkillMap }
}

export function enrichContributionsWithUsers(
  contributions: Contribution[],
  users: User[]
): ContributionWithUser[] {
  const userMap = new Map(users.map((u) => [u.id, u]))
  return contributions.map((c) => {
    const user = userMap.get(c.userId)
    return {
      ...c,
      user: user
        ? {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
          }
        : undefined,
    }
  })
}

export function searchContributions(
  indexedData: IndexedData,
  query: string,
  users: User[]
): ContributionWithUser[] {
  if (!query || query.trim() === '') {
    return enrichContributionsWithUsers(indexedData.contributions, users)
  }

  const byTags = searchByTags(indexedData.tagIndex, indexedData.contributions, query)

  // Also search in title and description
  const queryLower = query.toLowerCase()
  const byText = indexedData.contributions.filter(
    (c) =>
      c.title.toLowerCase().includes(queryLower) ||
      c.description.toLowerCase().includes(queryLower)
  )

  // Merge without duplicates
  const merged = [...byTags]
  for (const c of byText) {
    if (!merged.find((m) => m.id === c.id)) {
      merged.push(c)
    }
  }

  return enrichContributionsWithUsers(merged, users)
}
