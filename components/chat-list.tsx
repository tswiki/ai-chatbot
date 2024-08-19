import { Separator } from '@/components/ui/separator'
import { UIState } from '@/lib/chat/actions'
import { Session } from '@/lib/types'
import Link from 'next/link'

export interface ChatList {
  messages: UIState
  session?: Session
  isShared: boolean
}

export function ChatList({ messages, session, isShared }: ChatList) {
  if (!messages.length) {
    return null
  }

  return (
    <div className="relative mx-auto max-w-2xl px-10">
      {!isShared && !session ? (
        <>
        <div className="group relative mb-4 flex items-center justify-end md:-ml-15">
          <div
          className="flex size-[25px] shrink-0 select-none items-center justify-center">
          <img
            src="/error/favicon.ico"
            className="size-6"
            width={48} // Adjust the width as needed
            height={48} // Adjust the height as needed
          />
        </div>
            <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
              <p className="text-muted-foreground leading-normal">
                Please{' '}
                <Link href="/login" className="underline">
                  Log In
                </Link>{' '}
                or{' '}
                <Link href="/signup" className="underline">
                  Sign Up
                </Link>{' '}
                to save and revisit your chat history!
              </p>
            </div>
          </div>
          <Separator className="my-4" />
        </>
      ) : null}

      {messages.map((message, index) => (
        <div key={message.id}>
          {message.display}
          {index < messages.length - 1 && <Separator className="my-4" />}
        </div>
      ))}
    </div>
  )
}
