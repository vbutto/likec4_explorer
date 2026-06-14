import { ActionIcon, Box, Button, Drawer, Group, rem, ScrollArea, SegmentedControl, Tooltip } from '@mantine/core'
import { useLocalStorage } from '@mantine/hooks'
import { IconArrowLeft, IconPin, IconPinnedOff, IconStarFilled } from '@tabler/icons-react'
import { Link, useMatches } from '@tanstack/react-router'
import { memo } from 'react'
import type { GroupBy } from './data'
import { DiagramsTree } from './DiagramsTree'
import { SIDEBAR_WIDTH, SidebarDrawerOps, useDrawerOpened, useSidebarPinned } from './state'

const groupingData = [
  { label: 'By files', value: 'by-files' },
  { label: 'By folders', value: 'by-folders' },
  { label: 'List', value: 'none' },
]

const useGrouping = () =>
  useLocalStorage<GroupBy>({
    key: 'sidebar-drawer-grouping',
    defaultValue: 'by-files',
  })

/** Header controls shared by the overlay drawer and the docked panel. */
function SidebarControls({ grouping, setGrouping, pinned, onTogglePin }: {
  grouping: GroupBy
  setGrouping: (value: GroupBy) => void
  pinned: boolean
  onTogglePin: () => void
}) {
  return (
    <Group gap={'xs'} wrap="wrap">
      <Button
        component={Link}
        to="/"
        leftSection={<IconArrowLeft size={14} />}
        color="dimmed"
        variant="subtle"
        px={rem(5)}
        styles={{ section: { marginInlineEnd: 4 } }}
        size="xs">
        Overview
      </Button>
      <SegmentedControl
        size="xs"
        withItemsBorders={false}
        value={grouping}
        onChange={setGrouping as any}
        data={groupingData}
      />
      <Button
        leftSection={<IconStarFilled size={12} stroke={2} />}
        color="dimmed"
        variant="subtle"
        px={rem(5)}
        styles={{ section: { marginInlineEnd: 4 } }}
        size="xs"
        renderRoot={(props) => (
          <Link
            to="/view/$viewId"
            params={{ viewId: 'index' }}
            {...props}
          />
        )}>
        Open index
      </Button>
      <Tooltip label={pinned ? 'Unpin panel' : 'Pin panel'} fz="xs" withinPortal>
        <ActionIcon
          onClick={onTogglePin}
          variant={pinned ? 'light' : 'subtle'}
          color={pinned ? 'blue' : 'gray'}
          size="md"
          aria-label={pinned ? 'Unpin navigation panel' : 'Pin navigation panel'}>
          {pinned ? <IconPinnedOff size={16} /> : <IconPin size={16} />}
        </ActionIcon>
      </Tooltip>
    </Group>
  )
}

export const SidebarDrawer = memo(() => {
  const opened = useDrawerOpened()
  const [pinned, setPinned] = useSidebarPinned()
  const [grouping, setGrouping] = useGrouping()

  const isSingleProject = useMatches({
    select: (matches) => matches.some((match) => match.routeId === '/_single'),
  })

  const controls = (
    <SidebarControls
      grouping={grouping}
      setGrouping={setGrouping}
      pinned={pinned}
      onTogglePin={() => {
        if (pinned) {
          // Unpin → fall back to a closed overlay drawer (reopen via burger).
          setPinned(false)
          SidebarDrawerOps.close()
        } else {
          setPinned(true)
        }
      }}
    />
  )

  if (pinned) {
    return (
      <Box
        component="aside"
        style={{
          position: 'fixed',
          insetBlockStart: 0,
          insetBlockEnd: 0,
          insetInlineStart: 0,
          width: SIDEBAR_WIDTH,
          zIndex: 101,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--mantine-color-body)',
          borderInlineEnd: '1px solid var(--mantine-color-default-border)',
        }}>
        <Box p="xs" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
          {controls}
        </Box>
        <ScrollArea type="hover" style={{ flex: 1, minHeight: 0 }}>
          <Box p="xs">
            <DiagramsTree groupBy={grouping} showPreview={false} />
          </Box>
        </ScrollArea>
      </Box>
    )
  }

  return (
    <Drawer.Root
      keepMounted={isSingleProject}
      opened={opened}
      scrollAreaComponent={ScrollArea.Autosize}
      onClose={SidebarDrawerOps.close}>
      <Drawer.Overlay blur={2} />
      <Drawer.Content>
        <Drawer.Header>
          {controls}
          <Drawer.CloseButton />
        </Drawer.Header>
        <Drawer.Body>
          <DiagramsTree groupBy={grouping} />
        </Drawer.Body>
      </Drawer.Content>
    </Drawer.Root>
  )
})
