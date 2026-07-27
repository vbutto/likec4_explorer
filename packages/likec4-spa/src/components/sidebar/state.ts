import { useLocalStorage } from '@mantine/hooks'
import { useStore } from '@nanostores/react'
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
