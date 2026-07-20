import { css } from '@likec4/styles/css'
import { Badge, Box, Card, Container, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { IconGitPullRequest } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { type Proposal, type ProposalStatus, useProposals } from '../proposals'

const statusColor: Record<ProposalStatus, string> = {
  'draft': 'gray',
  'in-review': 'blue',
  'accepted': 'green',
  'rejected': 'red',
  'superseded': 'orange',
}

const statusLabel: Record<ProposalStatus, string> = {
  'draft': 'Draft',
  'in-review': 'In review',
  'accepted': 'Accepted',
  'rejected': 'Rejected',
  'superseded': 'Superseded',
}

export function ProposalsPage() {
  const proposals = useProposals()

  return (
    <Container size={'xl'} py={'lg'}>
      <Stack gap={4} px={'md'} pb={'md'}>
        <Title order={2}>Proposals</Title>
        <Text size="sm" c="dimmed">
          Sandboxed architecture proposals. Each one is an isolated model — changes here never affect the main model.
        </Text>
      </Stack>

      {proposals.length === 0
        ? <EmptyState />
        : (
          <SimpleGrid
            p={{ base: 'md', sm: 'md' }}
            cols={{ base: 1, sm: 2, md: 3 }}
            spacing={{ base: 10, sm: 'xl' }}
            verticalSpacing={{ base: 'md', sm: 'xl' }}
          >
            {proposals.map((proposal) => <ProposalCard key={proposal.project.id} proposal={proposal} />)}
          </SimpleGrid>
        )}
    </Container>
  )
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const { project, status, baseline, summary } = proposal
  return (
    <Card
      shadow="xs"
      padding="lg"
      radius="sm"
      withBorder
      className={css({
        position: 'relative',
        // Sandboxes are deliberately styled apart from the main hierarchy.
        borderStyle: 'dashed',
        transition: 'fast',
        _hover: { opacity: 0.85 },
      })}
    >
      <Group gap={'sm'} wrap="nowrap" align="flex-start">
        <ThemeIcon size={'lg'} variant="light" color="teal">
          <IconGitPullRequest size={20} />
        </ThemeIcon>
        <Box style={{ minWidth: 0, flex: 1 }}>
          <Text fw={600} truncate>{project.title ?? project.id}</Text>
          <Text size="xs" c="dimmed" truncate>{project.id}</Text>
        </Box>
        <Badge size="sm" variant="light" color={statusColor[status]}>
          {statusLabel[status]}
        </Badge>
      </Group>

      <Text size="sm" mt={'md'} {...(summary ? {} : { c: 'dimmed' })} className={css({ lineClamp: 3 })}>
        {summary ?? 'No summary'}
      </Text>

      {baseline && (
        <Text size="xs" c="dimmed" mt={'sm'}>
          against <Text span fw={600}>{baseline}</Text>
        </Text>
      )}

      <Link
        to={'/project/$projectId/'}
        params={{ projectId: project.id }}
        className={css({
          position: 'absolute',
          inset: '0',
        })}
        aria-label={`Open proposal ${project.title ?? project.id}`}
      >
      </Link>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card padding="xl" radius="sm" withBorder mx={'md'} className={css({ borderStyle: 'dashed' })}>
      <Stack align="center" gap={'xs'}>
        <ThemeIcon size={'xl'} variant="light" color="gray">
          <IconGitPullRequest size={24} />
        </ThemeIcon>
        <Text fw={600}>No proposals yet</Text>
        <Text size="sm" c="dimmed" ta={'center'} maw={520}>
          A proposal is a LikeC4 project that declares itself in its config:{' '}
          <Text span ff={'monospace'} fz={'xs'}>
            {`"metadata": { "proposal": { "status": "draft", "baseline": "<project>" } }`}
          </Text>
        </Text>
      </Stack>
    </Card>
  )
}
