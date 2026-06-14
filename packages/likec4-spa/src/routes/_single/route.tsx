import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'
import { loadModel } from 'likec4:model'
import { ErrorBoundary } from 'react-error-boundary'
import { Fallback } from '../../components/Fallback'
import { SidebarDrawer } from '../../components/sidebar/Drawer'
import { SIDEBAR_WIDTH, useSidebarPinned } from '../../components/sidebar/state'
import { ViewOutlet } from '../../components/ViewOutlet'
import { LikeC4IconRendererContext } from '../../context/LikeC4IconRendererContext'
import { LikeC4ModelContext } from '../../context/LikeC4ModelContext'

export const Route = createFileRoute('/_single')({
  staleTime: Infinity,
  loaderDeps() {
    return []
  },
  loader: async ({ context }) => {
    const projectId = context.projectId
    const data = await loadModel(projectId)
    return {
      $likec4model: data.$likec4model,
      projectId,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { $likec4model, projectId } = Route.useLoaderData()
  const [pinned] = useSidebarPinned()
  // Show the views sidebar only on the interactive pages (overview + diagram),
  // not on export / embed / webcomponent / "view as code" routes.
  const showSidebar = useMatches({
    select: (matches) =>
      matches.some((m) =>
        m.routeId === '/_single/single-index'
        || m.routeId === '/_single/view/$viewId/'
      ),
  })
  return (
    <ViewOutlet>
      <ErrorBoundary FallbackComponent={Fallback}>
        <LikeC4IconRendererContext projectId={projectId}>
          <LikeC4ModelContext likec4model={$likec4model}>
            {showSidebar && <SidebarDrawer />}
            <div
              style={{
                height: '100%',
                marginInlineStart: showSidebar && pinned ? SIDEBAR_WIDTH : 0,
                transition: 'margin-inline-start 150ms ease',
              }}>
              <Outlet />
            </div>
          </LikeC4ModelContext>
        </LikeC4IconRendererContext>
      </ErrorBoundary>
    </ViewOutlet>
  )
}
