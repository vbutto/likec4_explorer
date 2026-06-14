import { IconMenu2 } from '@tabler/icons-react'
import { useDiagramEventHandlers } from '../../context/DiagramEventHandlers'
import { PanelActionIcon, Tooltip } from '../_common'

/**
 * Explicit "open navigation" button. Only rendered when the host app provides an
 * `onOpenNavigation` handler — in that mode the host owns navigation (e.g. the SPA
 * sidebar), the built-in dropdown is disabled and the logo is inert, so this is the
 * single, clearly-readable affordance for opening the navigation panel.
 */
export const NavPanelButton = () => {
  const { onOpenNavigation } = useDiagramEventHandlers()

  if (!onOpenNavigation) {
    return null
  }

  return (
    <Tooltip label="Open navigation">
      <PanelActionIcon
        onClick={e => {
          e.stopPropagation()
          onOpenNavigation()
        }}
        children={<IconMenu2 style={{ width: '60%', height: '60%' }} />}
      />
    </Tooltip>
  )
}
