import {
  createBrowserHistory,
  createHashHistory,
  createRouter as createTanstackRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { basepath, useHashHistory } from 'likec4:app-config'
import { projects } from 'likec4:projects'
import { map } from 'remeda'
import { Fallback } from './components/Fallback'
import { NotFound } from './components/NotFound'
import { LikeC4ProjectsContext } from './context/LikeC4ProjectsContext'
import { mainProjects } from './proposals'
import { routeTree } from './routeTree.gen'

type RouteTree = typeof routeTree

// Keep the initial context in sync with __root's beforeLoad, which is the
// authoritative one — proposals must not count as ordinary projects.
const initialProjects = mainProjects(projects)

const router = createTanstackRouter<RouteTree, 'always', true>({
  routeTree,
  context: {
    projectId: initialProjects[0].id,
    projects: map(initialProjects, p => p.id),
  },
  InnerWrap: LikeC4ProjectsContext,
  basepath,
  trailingSlash: 'always',
  defaultViewTransition: false,
  history: useHashHistory ? createHashHistory() : createBrowserHistory(),
  defaultStaleTime: Infinity,
  defaultNotFoundComponent: () => {
    return <NotFound />
  },
  defaultErrorComponent: ({ error, reset }) => {
    return <Fallback error={error} resetErrorBoundary={reset} />
  },
})

declare module '@tanstack/react-router' {
  export interface Register {
    router: typeof router
  }
}

export function Routes() {
  return <RouterProvider router={router} />
}
