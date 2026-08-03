import { useLocalStorage } from '@mantine/hooks'
import { useStore } from '@nanostores/react'
import { useMatches } from '@tanstack/react-router'
import { atom, onMount } from 'nanostores'

const drawerOpenedAtom = atom(false)

onMount(drawerOpenedAtom, () => {
  drawerOpenedAtom.set(false)
})

export const useDrawerOpened = () => useStore(drawerOpenedAtom)

export const SidebarDrawerOps = {
  open: () => drawerOpenedAtom.set(true),
  close: () => drawerOpenedAtom.set(false),
}

/**
 * Handler for the diagram's "open navigation" button — but ONLY on routes where a
 * `<SidebarDrawer/>` actually exists.
 *
 * `ViewReact`/`ViewEditor` are shared between the single-project `_single` layout
 * (which mounts the drawer, see `routes/_single/route.tsx`) and the multi-project
 * `/project/$projectId` routes (which do not). Passing `onOpenNavigation` makes the
 * built-in NavigationPanel go inert — the logo/breadcrumbs stop navigating and the
 * `NavPanelButton` becomes the only affordance — so on a route with no drawer it
 * would disable the working navigation and open nothing (this is exactly the bug
 * you hit after opening a Proposal, which lives under `/project/$projectId`).
 *
 * Return the handler only under `_single`; elsewhere return `undefined` so the
 * built-in navigation stays active.
 */
export const useOpenNavigationHandler = (): (() => void) | undefined => {
  const hasSidebar = useMatches({
    select: (matches) => matches.some((m) => m.routeId.startsWith('/_single')),
  })
  return hasSidebar ? SidebarDrawerOps.open : undefined
}

/** Width (px) of the sidebar when docked (pinned). Shared so the page can reserve space. */
export const SIDEBAR_WIDTH = 320

/**
 * Whether the sidebar is pinned (kept docked and always visible) instead of an
 * overlay drawer. Persisted in localStorage; `useLocalStorage` keeps every hook
 * instance in the same tab in sync, so the drawer and the page layout stay
 * consistent without a shared atom.
 *
 * Docked by default: browsing a large model is mostly navigation, and an overlay
 * drawer that has to be reopened for every jump gets in the way. Users who prefer
 * the drawer unpin once and the choice sticks — an existing stored value always
 * wins over this default.
 */
export const useSidebarPinned = () =>
  useLocalStorage<boolean>({
    key: 'likec4-sidebar-pinned',
    defaultValue: true,
    getInitialValueInEffect: false,
  })
