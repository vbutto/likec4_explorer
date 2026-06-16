import { ActionIcon, Anchor, Divider, Group, Modal, Stack, Text, Tooltip } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconInfoCircle } from '@tabler/icons-react'

// `__LIKEC4_VERSION__` (upstream LikeC4 release) and `__EXPLORER_VERSION__` (this fork's
// own version, package.json "explorerVersion") are replaced at build time (see
// vite.config.ts / start-dev.ts define). Both are declared as ambient globals in global.d.ts.

/**
 * "About" button + modal. Reusable: dropped into the Overview header and the sidebar
 * controls. Self-contained, so it survives upstream rebases as a new, non-conflicting file.
 */
export function AboutButton() {
  const [opened, { open, close }] = useDisclosure(false)

  return (
    <>
      <Tooltip label="About" fz="xs" withinPortal>
        <ActionIcon
          onClick={open}
          variant="subtle"
          color="gray"
          size="md"
          aria-label="About">
          <IconInfoCircle size={18} />
        </ActionIcon>
      </Tooltip>

      <Modal
        opened={opened}
        onClose={close}
        title={<Text fw={600}>About</Text>}
        size="sm"
        centered
        overlayProps={{ blur: 2 }}>
        <Stack gap="sm">
          <Text size="sm" c="dimmed">
            An interactive viewer for LikeC4 architecture diagrams with enhanced navigation — a hierarchical overview, a
            folder-tree sidebar, deep-linkable folders, and in-diagram drill-down.
          </Text>

          <Divider />

          <Group justify="space-between" align="flex-end" gap="xs">
            <Stack gap={0}>
              <Text size="xs" c="dimmed">LikeC4 {__LIKEC4_VERSION__}</Text>
              <Text size="xs" c="dimmed">Explorer {__EXPLORER_VERSION__}</Text>
            </Stack>
            <Anchor href="https://likec4.dev" target="_blank" rel="noreferrer" size="xs">
              likec4.dev
            </Anchor>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
