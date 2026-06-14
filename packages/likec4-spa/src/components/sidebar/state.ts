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
 */
export const useSidebarPinned = () =>
  useLocalStorage<boolean>({
    key: 'likec4-sidebar-pinned',
    defaultValue: false,
    getInitialValueInEffect: false,
  })
