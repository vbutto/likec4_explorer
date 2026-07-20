import { LikeC4ProjectsProvider } from '@likec4/diagram'
import { useCallbackRef } from '@mantine/hooks'
import { useNavigate } from '@tanstack/react-router'
import { useLikeC4Projects } from 'likec4:projects'
import type { PropsWithChildren } from 'react'
import { mainProjects } from '../proposals'

export function LikeC4ProjectsContext({ children }: PropsWithChildren) {
  // Proposals have their own section and must not appear in the project switcher.
  const projects = mainProjects(useLikeC4Projects())
  const navigate = useNavigate()
  const onProjectChange = useCallbackRef((projectId: string) => {
    navigate({ to: '/project/$projectId/', params: { projectId } }).catch(console.error)
  })
  return (
    <LikeC4ProjectsProvider
      projects={projects}
      onProjectChange={onProjectChange}
    >
      {children}
    </LikeC4ProjectsProvider>
  )
}
