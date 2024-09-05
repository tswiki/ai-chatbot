'use client'

import * as React from 'react'

import { useSidebar } from '@/lib/hooks/use-sidebar'
import { cn } from '@/lib/utils'

// Remove the empty SidebarProps interface and use React.ComponentProps<'div'> directly
export function Sidebar({
  className,
  children,
  ...rest
}: React.ComponentProps<'div'>) {
  const { isSidebarOpen, isLoading } = useSidebar()

  return (
    <div
      data-state={isSidebarOpen && !isLoading ? 'open' : 'closed'}
      className={cn(className, 'h-full flex-col dark:bg-zinc-950')}
      {...rest} // Spread the rest of the props to the div element
    >
      {children}
    </div>
  )
}
