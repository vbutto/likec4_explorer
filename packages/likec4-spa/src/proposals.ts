import { type Project, useLikeC4Projects } from 'likec4:projects'

/**
 * Sandbox proposals.
 *
 * A proposal is an ordinary LikeC4 project that marks itself through project
 * config metadata:
 *
 * ```json
 * {
 *   "name": "proposal-checkout-split",
 *   "title": "Split checkout service",
 *   "metadata": {
 *     "proposal": {
 *       "status": "draft",
 *       "baseline": "boutique",
 *       "summary": "Extract payment orchestration out of checkout"
 *     }
 *   }
 * }
 * ```
 *
 * Metadata is authored by hand, so everything here parses defensively and
 * degrades to sensible defaults rather than throwing.
 */

export const proposalStatuses = [
  'draft',
  'in-review',
  'accepted',
  'rejected',
  'superseded',
] as const

export type ProposalStatus = typeof proposalStatuses[number]

export type Proposal = {
  project: Project
  status: ProposalStatus
  /** Project id of the baseline this proposal is made against, if declared. */
  baseline: string | null
  summary: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function asNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function asStatus(value: unknown): ProposalStatus {
  const status = asNonEmptyString(value)?.toLowerCase()
  return proposalStatuses.includes(status as ProposalStatus) ? status as ProposalStatus : 'draft'
}

/**
 * Reads the `metadata.proposal` contract off a project.
 * Returns `null` if the project is not a proposal.
 *
 * Accepts both the full object form and a bare truthy marker
 * (`"proposal": true`), which falls back to defaults.
 */
export function readProposal(project: Project): Proposal | null {
  const marker = project.metadata?.['proposal']
  if (marker === undefined || marker === null || marker === false) {
    return null
  }
  const declared = asRecord(marker)
  return {
    project,
    status: asStatus(declared?.['status']),
    baseline: asNonEmptyString(declared?.['baseline']),
    summary: asNonEmptyString(declared?.['summary']),
  }
}

export function isProposal(project: Project): boolean {
  return readProposal(project) !== null
}

/**
 * Splits projects into the ordinary ("baseline") ones and the proposals.
 *
 * Proposals must not count towards the single-vs-multi project decision, and
 * must not show up in the project switcher — they belong to their own section.
 */
export function partitionProjects(projects: readonly Project[]): {
  baseline: Project[]
  proposals: Proposal[]
} {
  const baseline: Project[] = []
  const proposals: Proposal[] = []
  for (const project of projects) {
    const proposal = readProposal(project)
    if (proposal) {
      proposals.push(proposal)
    } else {
      baseline.push(project)
    }
  }
  return { baseline, proposals }
}

/**
 * Projects that count as "real" projects for navigation: everything except
 * proposals. Falls back to the full list if a workspace contains nothing but
 * proposals, so the app is never left with zero projects.
 */
export function mainProjects(
  projects: readonly [Project, ...Project[]],
): [Project, ...Project[]] {
  const [first, ...rest] = partitionProjects(projects).baseline
  return first ? [first, ...rest] : [...projects]
}

export function useProposals(): Proposal[] {
  return partitionProjects(useLikeC4Projects()).proposals
}
