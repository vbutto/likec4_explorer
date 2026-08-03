// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { DiagramView } from '@likec4/core/types'
import { StaticLikeC4Diagram, useLikeC4Model, useUpdateEffect } from '@likec4/diagram'
import { Box } from '@likec4/styles/jsx'
import {
  type TreeNodeData,
  Button,
  HoverCard,
  HoverCardDropdown,
  HoverCardTarget,
  ThemeIcon,
  Tree,
  useComputedColorScheme,
  useTree,
} from '@mantine/core'
import {
  IconFileCode,
  IconFolderFilled,
  IconFolderOpen,
  IconLayoutDashboard,
  IconStack2,
} from '@tabler/icons-react'
import { useLocation, useMatches, useNavigate, useParams } from '@tanstack/react-router'
import { type PropsWithChildren, memo, useEffect } from 'react'
import { useCurrentView, useLikeC4Views } from '../../hooks'
import { type GroupBy, isTreeNodeData, useDiagramsTreeData } from './data'
import { SidebarDrawerOps } from './state'

const isFile = (node: TreeNodeData) => isTreeNodeData(node) && node.type === 'file'

const FolderIcon = ({ node, expanded }: { node: TreeNodeData; expanded: boolean }) => {
  if (isFile(node)) {
    return (
      <ThemeIcon size={'sm'} variant="transparent" color="indigo">
        <IconFileCode size={16} />
      </ThemeIcon>
    )
  }
  return (
    <ThemeIcon size={'sm'} variant="transparent" color="violet">
      {expanded ? <IconFolderOpen size={16} /> : <IconFolderFilled size={16} />}
    </ThemeIcon>
  )
}

export const DiagramsTree = /* @__PURE__ */ memo(({ groupBy, showPreview = true }: {
  groupBy: GroupBy | undefined
  // Hover preview of the diagram. Disabled when the panel is docked (pinned):
  // clicking a leaf navigates while the panel stays mounted, which leaves the
  // Mantine HoverCard orphaned (a stuck white rectangle). In the overlay drawer
  // the click closes the whole drawer, so the preview unmounts cleanly.
  showPreview?: boolean
}) => {
  const views = useLikeC4Views()
  const data = useDiagramsTreeData(groupBy)
  const navigate = useNavigate()
  // On multi-project routes the tree lives under `/project/$projectId`; on the
  // single-project layout there is no projectId. Navigation targets differ.
  const projectId = useParams({
    strict: false,
    select: (p) => (p as { projectId?: string }).projectId,
  })
  const navigateTo = (viewId: string) => {
    SidebarDrawerOps.close()
    if (projectId) {
      void navigate({
        to: '/project/$projectId/view/$viewId/',
        viewTransition: false,
        params: { projectId, viewId },
      })
    } else {
      void navigate({
        to: '/view/$viewId/',
        viewTransition: false,
        params: { viewId },
      })
    }
  }
  // Clicking a folder shows that hierarchy level in the Overview (main area).
  // Folder node values are prefixed with '@fs/' (see buildDiagramTreeData).
  // Only single-project mode has a folder-explorer Overview; in project mode a
  // folder click just expands/collapses the branch (see onClick below).
  const navigateToFolder = (nodeValue: string) => {
    const path = nodeValue.startsWith('@fs/') ? nodeValue.slice(4) : ''
    SidebarDrawerOps.close()
    void navigate({
      to: '/single-index',
      viewTransition: false,
      search: path ? { folder: path } : {},
    })
  }
  const model = useLikeC4Model()
  const [diagram] = useCurrentView()
  const viewId = diagram?.id ?? null

  // On the Overview page, sync to its ?folder= level instead of a view.
  const isOverview = useMatches({
    select: (matches) => matches.some((m) => m.routeId === '/_single/single-index'),
  })
  // Read the full URL search (DiagramsTree lives in the parent `_single` layout,
  // so useSearch scoped to a route wouldn't see the child's `folder` param).
  const location = useLocation()
  const folderParam = typeof (location.search as { folder?: string }).folder === 'string'
    ? (location.search as { folder?: string }).folder!
    : ''
  const overviewFolder = isOverview ? folderParam : ''

  // Node to highlight, and the folder branch to expand (folder values are '@fs/'-prefixed).
  const selectedValue = isOverview
    ? (overviewFolder ? `@fs/${overviewFolder}` : null)
    : viewId
  const expandFolderPath = isOverview
    ? overviewFolder
    : (viewId ? (model.findView(viewId)?.folder?.path ?? '') : '')

  const ancestorsExpandedState = (folderPath: string): Record<string, boolean> => {
    const state: Record<string, boolean> = {}
    if (folderPath) {
      let path = '@fs'
      for (const segment of folderPath.split('/')) {
        path += `/${segment}`
        state[path] = true
      }
    }
    return state
  }

  // Initial state is set at tree creation: an imperative tree.expand() in an
  // effect runs before Mantine initialises the tree, so it would be ignored on
  // first mount (e.g. a deep link). The effects below handle later navigation.
  const tree = useTree({
    multiple: false,
    initialExpandedState: ancestorsExpandedState(expandFolderPath),
    initialSelectedState: selectedValue ? [selectedValue] : [],
  })

  useUpdateEffect(() => {
    tree.collapseAllNodes()
  }, [groupBy])

  useEffect(() => {
    for (const value of Object.keys(ancestorsExpandedState(expandFolderPath))) {
      tree.expand(value)
    }
  }, [expandFolderPath, groupBy])

  useEffect(() => {
    if (selectedValue) {
      tree.select(selectedValue)
    } else {
      tree.clearSelected()
    }
  }, [selectedValue])

  const theme = useComputedColorScheme()

  return (
    <Box>
      <Tree
        allowRangeSelection={false}
        tree={tree}
        data={data}
        styles={{
          node: {
            marginTop: 2,
            marginBottom: 2,
          },
        }}
        levelOffset={'md'}
        renderNode={({ node, selected, expanded, elementProps, hasChildren }) => (
          <DiagramPreviewHoverCard
            diagram={!hasChildren && showPreview ? views.find((v) => v.id === node.value) : undefined}>
            <Button
              fullWidth
              color={theme === 'light' ? 'dark' : 'gray'}
              // color={theme === 'light' ? 'dark' : 'gray'}
              variant={selected ? 'transparent' : 'subtle'}
              size="sm"
              fz={'sm'}
              fw={hasChildren ? '600' : '500'}
              justify="flex-start"
              styles={{
                section: {
                  opacity: 0.5,
                },
              }}
              leftSection={
                <>
                  {!hasChildren && isTreeNodeData(node) && (
                    <>
                      {node.type === 'deployment-view' && <IconStack2 size={14} />}
                      {node.type === 'view' && <IconLayoutDashboard size={14} />}
                    </>
                  )}
                  {hasChildren && <FolderIcon node={node} expanded={expanded} />}
                </>
              }
              {...elementProps}
              onClick={(e) => {
                e.stopPropagation()
                if (hasChildren) {
                  // Folder: expand/collapse; in single-project mode also show its
                  // level in the Overview (project mode has no folder Overview).
                  tree.toggleExpanded(node.value)
                  if (!projectId) {
                    navigateToFolder(node.value)
                  }
                } else {
                  navigateTo(node.value)
                }
              }}
            >
              {node.label}
            </Button>
          </DiagramPreviewHoverCard>
        )}
      />
    </Box>
  )
}, (prev, next) => prev.groupBy === next.groupBy && prev.showPreview === next.showPreview)

function DiagramPreviewHoverCard({ diagram, children }: PropsWithChildren<{ diagram: DiagramView | undefined }>) {
  const ratio = diagram ? Math.max(diagram.bounds.width / 400, diagram.bounds.height / 300) : 1

  const width = diagram ? Math.round(diagram.bounds.width / ratio) : 0
  const height = diagram ? Math.round(diagram.bounds.height / ratio) : 0

  return (
    <>
      {diagram && (
        <HoverCard position="right-start" openDelay={400} closeDelay={100} keepMounted={false} shadow="lg">
          <HoverCardTarget>
            {children}
          </HoverCardTarget>
          <HoverCardDropdown style={{ width, height }} p={'xs'}>
            <DiagramPreview diagram={diagram} />
          </HoverCardDropdown>
        </HoverCard>
      )}
      {!diagram && children}
    </>
  )
}

const DiagramPreview = memo<{
  diagram: DiagramView
}>(({ diagram }) => {
  const ratio = Math.max(diagram.bounds.width / 400, diagram.bounds.height / 300)

  const width = Math.round(diagram.bounds.width / ratio)
  const height = Math.round(diagram.bounds.height / ratio)

  return (
    <StaticLikeC4Diagram
      view={diagram}
      fitView
      fitViewPadding={'4px'}
      enableElementDetails={false}
      reduceGraphics
      initialWidth={width}
      initialHeight={height}
    />
  )
}, (prev, next) => prev.diagram.id === next.diagram.id)
