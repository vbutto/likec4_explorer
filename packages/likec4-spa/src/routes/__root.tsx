// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2025 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type { ProjectId } from '@likec4/core/types'
import { DefaultMantineProvider, FramerMotionConfig } from '@likec4/diagram'
import { createRootRouteWithContext, Outlet, stripSearchParams } from '@tanstack/react-router'
import { defaultTheme } from 'likec4:app-config'
import { projects } from 'likec4:projects'
import { map } from 'remeda'
import { mainProjects } from '../proposals'
import { resolveForceColorScheme, searchParamsSchema } from '../searchParams'

export type Context = {
  /**
   * Default (current) project
   */
  projectId: ProjectId

  /**
   * All projects
   */
  projects: readonly [ProjectId, ...ProjectId[]]
}

export const Route = createRootRouteWithContext<Context>()({
  validateSearch: searchParamsSchema,
  search: {
    middlewares: [
      stripSearchParams({
        padding: 20,
        theme: undefined,
        dynamic: 'diagram',
        relationships: undefined,
        focusOnElement: undefined,
      }),
    ],
  },
  beforeLoad: (): Context => {
    // Proposals are sandboxes surfaced in their own section — they must not
    // count towards the single-vs-multi project decision, otherwise the first
    // proposal would bounce the user off the baseline views to the projects page.
    const _projects = map(mainProjects(projects), p => p.id)
    return {
      projects: _projects,
      projectId: _projects[0],
    }
  },
  component: RootComponent,
})

function RootComponent() {
  const { theme } = Route.useSearch()
  // When ?theme= is explicitly set in URL, force that color scheme without
  // writing to localStorage. This preserves the user's manual preference
  // while allowing embeds to override the appearance via URL.
  const forceColorScheme = resolveForceColorScheme(theme)
  // When ?theme=auto is explicitly set, restore system preference even if
  // the build default is light or dark.
  const defaultColorScheme = theme === 'auto' ? 'auto' : defaultTheme
  return (
    <DefaultMantineProvider
      defaultColorScheme={defaultColorScheme}
      {...(forceColorScheme && { forceColorScheme })}
    >
      <FramerMotionConfig>
        <Outlet />
      </FramerMotionConfig>
    </DefaultMantineProvider>
  )
}
