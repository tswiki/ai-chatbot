import { Message } from 'ai'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { useTheme } from 'next-themes'
import { HTMLAttributes } from 'react';


import { cn } from '@/lib/utils'
import { CodeBlock } from '@/components/ui/codeblock'
import { MemoizedReactMarkdown } from '@/components/markdown'
import { ChatMessageActions } from '@/components/chat-message-actions'

export interface ChatMessageProps {
  message: Message
}

interface CodeProps extends HTMLAttributes<HTMLElement> {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}


export function ChatMessage({ message, ...props }: ChatMessageProps) {
  const { theme } = useTheme()
  
  return (
    <div
      className={cn('group relative mb-4 flex items-start md:-ml-12')}
      {...props}
    >
      <div
        className={cn('flex size-8 shrink-0 select-none items-center justify-center rounded-md border shadow',
          message.role === 'user'
            ? `flex items-center justify-center rounded-full border-2 ${theme === 'dark' ? 'border-white' : 'border-black'} bg-white p-1 shadow-sm`
            : `flex items-center justify-center rounded-full border-2 ${theme === 'dark' ? 'border-black' : 'border-white'} p-1`
        )}
      >
        {message.role === 'user' ? <img
          src="/user/favicon.ico"
          width={25}
          height={25}
          style={{ display: 'block', margin: 'auto'  }}
        /> : <img
            src={theme === 'dark' ? "/inverted/favicon.ico" : "/favicon.ico"}
            className="size-6"
            width={48}
            height={48}
            style={{ display: 'block', margin: 'auto' }}
      />}
      </div>
      <div className="flex-1 px-1 ml-4 space-y-2 overflow-hidden">
        <MemoizedReactMarkdown
          className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
          remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }) {
              return <p className="mb-2 last:mb-0">{children}</p>
            },
            code({inline, className, children, ...props }) {
              if (children.length) {
                if (children[0] == '▍') {
                  return (
                    <span className="mt-1 cursor-default animate-pulse">▍</span>
                  )
                }

                children[0] = (children[0] as string).replace('`▍`', '▍')
              }

              const match = /language-(\w+)/.exec(className || '')

              if (inline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }

              return (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ''}
                  value={String(children).replace(/\n$/, '')}
                  {...props}
                />
              )
            }
          }}
        >
          {message.content}
        </MemoizedReactMarkdown>
        <ChatMessageActions message={message} />
      </div>
    </div>
  )
}