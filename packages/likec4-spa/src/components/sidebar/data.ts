import type { LikeC4ViewModel } from '@likec4/core/model'
import { compareNatural, nonexhaustive } from '@likec4/core/utils'
import { useLikeC4Model } from '@likec4/diagram'
import type { TreeNodeData } from '@mantine/core'
import { useMemo } from 'react'
import { find } from 'remeda'

interface DiagramTreeNodeData {
  label: string
  value: string
  type: 'file' | 'folder' | 'view' | 'deployment-view'
  // Optional on purpose: leaf nodes (views) MUST NOT carry a `children` array.
  // Mantine's <Tree> derives the `hasChildren` flag passed to `renderNode` from
  // `Array.isArray(node.children)` (presence, not length — see @mantine/core v9
  // TreeNode), so a leaf with `children: []` is rendered as an expandable folder
  // and loses its navigation onClick. Container nodes (file/folder) get `[]`.
  children?: DiagramTreeNodeData[]
}

export type GroupBy = 'by-folders' | 'none'

export const isTreeNodeData = (node: TreeNodeData): node is DiagramTreeNodeData =>
  'type' in node && ['file', 'folder', 'view', 'deployment-view'].includes(node.type as any)

function compareTreeNodes(a: DiagramTreeNodeData, b: DiagramTreeNodeData) {
  const aChildren = a.children?.length ?? 0
  const bChildren = b.children?.length ?? 0
  // Containers (folders/files) sort before leaf views.
  if (aChildren === 0 && bChildren > 0) {
    return 1
  }
  if (aChildren > 0 && bChildren === 0) {
    return -1
  }
  return compareNatural(a.label, b.label)
}

function buildDiagramTreeData(views: readonly LikeC4ViewModel[], groupBy: GroupBy): DiagramTreeNodeData[] {
  const root: DiagramTreeNodeData = {
    value: '',
    label: 'Diagrams',
    type: 'folder',
    children: [],
  }

  const findParent = (path: string): DiagramTreeNodeData => {
    let parent = root
    if (path === '') {
      return parent
    }
    const segments = path.split('/')
    const traversed = ['@fs'] as string[]
    while (segments.length) {
      const label = segments.shift() as string
      traversed.push(label)
      const value = traversed.join('/')
      let node = find(parent.children!, n => n.value === value)
      if (!node) {
        node = { label, value, type: 'folder', children: [] }
        parent.children!.push(node)
      }
      parent = node
    }
    return parent
  }

  for (const view of views) {
    let relativePath
    switch (groupBy) {
      case 'by-folders':
        // Native LikeC4 view folder (from `views '<folder>'` blocks / title),
        // not the file path. Authored hierarchy, independent of file layout.
        relativePath = view.folder?.path ?? ''
        break
      case 'none':
        relativePath = ''
        break
      default:
        nonexhaustive(groupBy)
    }
    const parent = findParent(relativePath)
    // Leaf view: no `children` key (see DiagramTreeNodeData) so Mantine treats it
    // as a navigable leaf rather than an expandable folder.
    parent.children!.push({
      value: view.id,
      label: view.title ?? view.id,
      type: view.isDeploymentView() ? 'deployment-view' : 'view',
    })
    if (parent !== root) {
      parent.children!.sort(compareTreeNodes)
    }
  }

  return root.children!.sort(compareTreeNodes)
}

export function useDiagramsTreeData(groupBy: GroupBy = 'by-folders') {
  const model = useLikeC4Model()
  return useMemo(() => buildDiagramTreeData([...model.views()], groupBy), [model, groupBy])
}
