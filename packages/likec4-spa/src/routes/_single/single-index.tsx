// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import { createFileRoute, Link } from '@tanstack/react-router'

import type { LikeC4ViewModel, LikeC4ViewsFolder } from '@likec4/core/model'
import type { DiagramView } from '@likec4/core/types'
import { RichText } from '@likec4/core/types'
import { compareNatural } from '@likec4/core/utils'
import { StaticLikeC4Diagram, useLikeC4Model } from '@likec4/diagram'
import { Markdown, NavigationPanel } from '@likec4/diagram/custom'
import { css } from '@likec4/styles/css'
import {
  Anchor,
  Box,
  Breadcrumbs,
  Burger,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core'
import { useDocumentTitle, useInViewport } from '@mantine/hooks'
import { IconChevronRight, IconFolderFilled, IconHome, IconLayoutDashboard } from '@tabler/icons-react'
import { pageTitle } from 'likec4:app-config'
import { useEffect, useMemo, useState } from 'react'
import { randomInteger } from 'remeda'
import { AboutButton } from '../../components/AboutModal'
import { ColorSchemeToggle } from '../../components/ColorSchemeToggle'
import { ProposalsButton } from '../../components/ProposalsButton'
import { OverviewSearch } from '../../components/search/OverviewSearch'
import { SidebarDrawerOps, useSidebarPinned } from '../../components/sidebar/state'
import { useCurrentProject, useLikeC4Views } from '../../hooks'
import { visibleInNav } from '../../nav-visibility'
import * as styles from './index.css'

export const Route = createFileRoute('/_single/single-index')({
  validateSearch: (search: Record<string, unknown>): { folder?: string } => ({
    folder: typeof search.folder === 'string' && search.folder.length > 0 ? search.folder : undefined,
  }),
  component: RouteComponent,
})

const PREVIEW_LIMIT = 6

const viewTitle = (vm: LikeC4ViewModel) => vm.title ?? vm.id

/**
 * Core keeps views in declaration order within a folder (it sorts only by folder
 * path, stably — see LikeC4Model constructor). Sort them the same way the sidebar
 * tree does, so both navigations agree.
 */
const sortViews = (views: ReadonlyArray<LikeC4ViewModel>): ReadonlyArray<LikeC4ViewModel> =>
  [...views].sort((a, b) => compareNatural(viewTitle(a), viewTitle(b)))

function RouteComponent() {
  const model = useLikeC4Model()
  const allViews = useLikeC4Views()
  const { title: projectTitle } = useCurrentProject()
  useDocumentTitle(projectTitle ?? pageTitle)

  const [pinned] = useSidebarPinned()
  // Current Explorer folder lives in the URL (?folder=...) so it is shareable,
  // works with browser back/forward, and can be driven from the sidebar.
  const navigate = Route.useNavigate()
  const { folder: folderPath = '' } = Route.useSearch()
  const goToFolder = (path: string) => navigate({ to: '/single-index', search: path ? { folder: path } : {} })

  // Layouted views (with bounds) for previews, keyed by id.
  const viewsById = useMemo(() => new Map(allViews.map((v) => [v.id, v])), [allViews])

  // Current folder of the Explorer (native LikeC4 view folders).
  const folder = useMemo(() => {
    try {
      return folderPath ? model.viewFolder(folderPath) : model.rootViewFolder
    } catch {
      return model.rootViewFolder
    }
  }, [model, folderPath])

  const subFolders = folder.folders
  // Views tagged #hidden are dropped from the Overview (still reachable by URL).
  const folderViews = useMemo(() => sortViews(visibleInNav(folder.views)), [folder])

  return (
    <Container size={'xl'}>
      <div
        className={css({
          containerName: 'likec4-root',
          containerType: 'inline-size',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: 'xs',
          gap: 'xs',
          position: 'sticky',
          top: '0',
          zIndex: '10',
          backgroundColor: 'likec4.panel.bg/85',
          backdropFilter: 'blur(8px)',
        })}
      >
        <NavigationPanel.Root css={{ position: 'relative', width: 'max-content', margin: '0' }}>
          <NavigationPanel.Body>
            <div style={{ width: 0, height: 36 }} aria-hidden />
            {!pinned && <Burger size="sm" onClick={SidebarDrawerOps.open} aria-label="Toggle navigation" />}
            <NavigationPanel.Logo
              css={{ flexShrink: 0 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
            <OverviewSearch />
          </NavigationPanel.Body>
        </NavigationPanel.Root>
        <NavigationPanel.Root panelPosition="right" css={{ position: 'relative', margin: '0' }}>
          <NavigationPanel.Body>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 36 }}>
              <ProposalsButton />
              <AboutButton />
              <ColorSchemeToggle />
            </div>
          </NavigationPanel.Body>
        </NavigationPanel.Root>
      </div>

      <FolderBreadcrumbs folder={folder} onNavigate={goToFolder} />

      <SimpleGrid
        p={{ base: 'md', sm: 'md' }}
        pt={{ base: 'sm', sm: 'sm' }}
        cols={{ base: 1, sm: 2, md: 3, xl: 4 }}
        spacing={{ base: 10, sm: 'xl' }}
        verticalSpacing={{ base: 'md', sm: 'xl' }}
      >
        {subFolders.map((f) => <FolderTile key={f.path} folder={f} onOpen={() => goToFolder(f.path)} />)}
        {folderViews.map((vm) => {
          const view = viewsById.get(vm.id)
          // vm.title is the short title (last segment); view.title is the full folder path.
          return view ? <ViewCard key={vm.id} view={view} title={viewTitle(vm)} /> : null
        })}
      </SimpleGrid>
    </Container>
  )
}

function FolderBreadcrumbs({ folder, onNavigate }: {
  folder: LikeC4ViewsFolder
  onNavigate: (path: string) => void
}) {
  // Build the trail from the path. Avoid folder.breadcrumbs: it throws on the root
  // folder, and the React Compiler may hoist it out of the conditional (eager eval).
  const trail: Array<{ title: string; path: string }> = []
  if (!folder.isRoot) {
    let acc = ''
    for (const seg of folder.path.split('/')) {
      acc = acc ? `${acc}/${seg}` : seg
      trail.push({ title: seg, path: acc })
    }
  }
  return (
    <Breadcrumbs
      separator={<IconChevronRight size={14} opacity={0.5} />}
      px={'md'}
      pt={'sm'}
      styles={{ separator: { marginInline: 6 } }}
    >
      <Anchor component={UnstyledButton} onClick={() => onNavigate('')} c={folder.isRoot ? undefined : 'dimmed'}>
        <Group gap={4} wrap="nowrap">
          <IconHome size={15} />
          <span>Overview</span>
        </Group>
      </Anchor>
      {trail.map((f, i) => {
        const isLast = i === trail.length - 1
        return (
          <Anchor
            key={f.path}
            component={UnstyledButton}
            onClick={() => onNavigate(f.path)}
            c={isLast ? undefined : 'dimmed'}
            fw={isLast ? 600 : undefined}
          >
            {f.title}
          </Anchor>
        )
      })}
    </Breadcrumbs>
  )
}

function FolderTile({ folder, onOpen }: {
  folder: LikeC4ViewsFolder
  onOpen: () => void
}) {
  const childFolders = folder.folders
  const childViews = sortViews(visibleInNav(folder.views))
  const children = [
    ...childFolders.map((f) => ({ kind: 'folder' as const, key: f.path, name: f.title })),
    ...childViews.map((v) => ({ kind: 'view' as const, key: v.id, name: viewTitle(v) })),
  ]
  const preview = children.slice(0, PREVIEW_LIMIT)
  const rest = children.length - preview.length

  return (
    <Card
      shadow="xs"
      padding="lg"
      radius="sm"
      withBorder
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      className={css({
        cursor: 'pointer',
        transition: 'fast',
        _hover: { borderColor: 'likec4.palette.loContrast', transform: 'translateY(-2px)' },
      })}
    >
      <Group gap={'sm'} wrap="nowrap">
        <ThemeIcon size={'lg'} variant="light" color="violet">
          <IconFolderFilled size={22} />
        </ThemeIcon>
        <Box style={{ minWidth: 0 }}>
          <Text fw={600} truncate>{folder.title}</Text>
          <Text size="xs" c="dimmed">
            {childFolders.length > 0 && `${childFolders.length} folder${childFolders.length > 1 ? 's' : ''}`}
            {childFolders.length > 0 && childViews.length > 0 && ' · '}
            {childViews.length > 0 && `${childViews.length} view${childViews.length > 1 ? 's' : ''}`}
          </Text>
        </Box>
      </Group>

      <Stack gap={2} mt="md">
        {preview.map((c) => (
          <Group key={c.key} gap={6} wrap="nowrap" style={{ opacity: 0.85 }}>
            {c.kind === 'folder'
              ? <IconFolderFilled size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
              : <IconLayoutDashboard size={13} style={{ flexShrink: 0, opacity: 0.7 }} />}
            <Text size="sm" truncate>{c.name}</Text>
          </Group>
        ))}
        {rest > 0 && <Text size="xs" c="dimmed" mt={2}>+{rest} more</Text>}
      </Stack>
    </Card>
  )
}

function ViewCard({ view, title }: { view: DiagramView; title?: string }) {
  const [visible, setVisible] = useState(false)
  const { ref, inViewport } = useInViewport()

  // Deferred rendering to avoid initial freeze
  useEffect(() => {
    if (!inViewport || visible) return
    const tm = setTimeout(() => setVisible(true), randomInteger(30, 80))
    return () => clearTimeout(tm)
  }, [inViewport, visible])

  return (
    <Card
      ref={ref}
      shadow="xs"
      padding="lg"
      radius="sm"
      className="group"
      withBorder>
      <Card.Section>
        <Box className={styles.previewBg} style={{ height: 200 }}>
          {visible && (
            <StaticLikeC4Diagram
              background={'transparent'}
              view={view}
              fitView
              fitViewPadding={'4px'}
              reduceGraphics
            />
          )}
        </Box>
      </Card.Section>

      <Group justify="space-between" mt="md">
        <Text fw={500}>{title ?? view.title ?? view.id}</Text>
      </Group>

      <Markdown
        value={RichText.from(view.description)}
        textScale={0.75}
        emptyText="No description"
        className={css({
          lineClamp: 3,
          mt: '1',
          transition: 'fast',
          opacity: {
            base: 0.8,
            _groupHover: 1,
          },
        })}
      />
      <Link to={'/view/$viewId/'} params={{ viewId: view.id }} search className={styles.cardLink}></Link>
    </Card>
  )
}
