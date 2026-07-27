import type { LikeC4ViewModel } from '@likec4/core/model'

/**
 * As-code navigation visibility.
 *
 * A view tagged with `#hidden` is dropped from the explorer's navigation
 * surfaces (sidebar tree, Overview grid). It stays fully reachable by direct
 * URL — this only removes it from browsing.
 *
 * Authored in the model (declare `tag hidden` in the specification, then add
 * `#hidden` to a view's body). Intended to keep draft / work-in-progress views
 * out of the navigation when publishing the model to others. There is no
 * runtime toggle: visibility is a property of the model, versioned in git.
 */
export const HIDDEN_FROM_NAV_TAG = 'hidden'

export function isHiddenFromNav(view: LikeC4ViewModel): boolean {
  return view.tags.includes(HIDDEN_FROM_NAV_TAG as never)
}

export function visibleInNav(views: readonly LikeC4ViewModel[]): LikeC4ViewModel[] {
  return views.filter(v => !isHiddenFromNav(v))
}
