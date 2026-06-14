import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (context.projects.length > 1) {
      throw redirect({
        to: '/projects/',
        mask: {
          to: '/',
          unmaskOnReload: true,
        },
      })
    }

    // Single project always lands on the Overview (folder explorer).
    throw redirect({
      to: '/single-index/',
      mask: {
        to: '/',
        unmaskOnReload: true,
      },
    })
  },
})
