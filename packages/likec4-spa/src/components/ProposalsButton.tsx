import { ActionIcon, Indicator, Tooltip } from '@mantine/core'
import { IconGitPullRequest } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useProposals } from '../proposals'

/**
 * Entry point into the Proposals section. Renders nothing when the workspace
 * has no proposal projects, so it stays invisible for plain models.
 *
 * Self-contained, so it survives upstream rebases as a new, non-conflicting file.
 */
export function ProposalsButton() {
  const proposals = useProposals()

  if (proposals.length === 0) {
    return null
  }

  return (
    <Tooltip label={`Proposals (${proposals.length})`} fz="xs" withinPortal>
      <Indicator label={proposals.length} size={14} offset={4} color="teal">
        <ActionIcon
          component={Link}
          to={'/proposals/'}
          variant="subtle"
          color="gray"
          size="md"
          aria-label="Proposals">
          <IconGitPullRequest size={18} />
        </ActionIcon>
      </Indicator>
    </Tooltip>
  )
}
