import * as React from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { auth } from '@/auth'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  IconSeparator,
} from '@/components/ui/icons'
import { UserMenu } from '@/components/user-menu'
import { SidebarMobile } from './sidebar-mobile'
import { SidebarToggle } from './sidebar-toggle'
import { ChatHistory } from './chat-history'
import { Session } from '@/lib/types'
import { CollectionsPopover } from '@/components/collections-popover'

async function UserOrLogin() {
  const session = (await auth()) as Session
  return (
    <>
      {session?.user ? (
        <>
          <SidebarMobile>
            <ChatHistory userId={session.user.id} />
          </SidebarMobile>
          <SidebarToggle />
        </>
      ) : (
  <img
    src="/inverted/favicon.ico"
    className="hidden size-6 mr-2 dark:block"
    width={48} // Adjust the width as needed
    height={48} // Adjust the height as needed
  />
      )}
      <div className="flex items-center">
        <IconSeparator className="size-6 text-muted-foreground/50" />
        {session?.user ? (
          <UserMenu user={session.user} />
        ) : (
          <Button variant="link" asChild className="-ml-2">
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </>
  )
}



export async function Header() {

  //const session = (await auth()) as Session

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center">
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <UserOrLogin />
        </React.Suspense>
      </div>
      <div className="flex items-center justify-end">
      
      <CollectionsPopover className={cn(buttonVariants({ variant: 'ghost' }), 'pr-6')}>
      <span className="flex items-center">Collections</span>
      </CollectionsPopover>

        <a
          href="https://l0ni6p6jl0x.typeform.com/to/KsVsWulI"
          target="_blank"
          className={cn(buttonVariants())}
        >
          <span className="hidden sm:block">Waiting list</span>
          <span className="sm:hidden"><img
          src="/favicon.ico"
          className="hidden size-6 mr- dark:block"
          />
          </span>
        </a>
      </div>
    </header>
  )
}
