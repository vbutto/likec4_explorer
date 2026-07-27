import { Box } from '@likec4/styles/jsx'
import { useDocumentTitle } from '@mantine/hooks'
import { createFileRoute } from '@tanstack/react-router'
import { pageTitle } from 'likec4:app-config'
import { lazy } from 'react'

const ProposalsPage = lazy(async () => {
  const { ProposalsPage } = await import('../pages/Proposals')
  return {
    default: ProposalsPage,
  }
})

export const Route = createFileRoute('/proposals')({
  component: RouteComponent,
  wrapInSuspense: true,
})

function RouteComponent() {
  useDocumentTitle(`Proposals - ${pageTitle}`)
  return (
    <Box w={'100%'} h={'100%'} overflow={'auto'}>
      <ProposalsPage />
    </Box>
  )
}
