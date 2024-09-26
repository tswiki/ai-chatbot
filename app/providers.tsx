// app/providers.js
'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { TooltipProvider } from '@radix-ui/react-tooltip'
import { ReactNode } from 'react'

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? '', {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? '',
    person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
  })
}

interface CSPostHogProviderProps {
  children: ReactNode
}

export function CSPostHogProvider({ children }: CSPostHogProviderProps) {
  return (
    <PostHogProvider client={posthog}>
      <TooltipProvider>
        {children}
      </TooltipProvider>
    </PostHogProvider>
  )
}
