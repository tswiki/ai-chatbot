'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { kv } from '@vercel/kv'

import { auth } from '@/auth'
import { Chat, Message } from '@/lib/types'


export async function getChats(userId?: string | null): Promise<Chat[] | { error: string }> {
  if (!userId) {
    console.log('No userId provided');
    return { error: 'No userId provided' };
  }

  try {
    const pipeline = kv.pipeline();
    const chats: string[] = await kv.zrange(`user:chat:${userId}`, 0, -1, {
      rev: true
    });

    console.log(`Found ${chats.length} chats for user ${userId}`);

    if (chats.length === 0) {
      return [];
    }

    for (const chat of chats) {
      pipeline.hgetall(chat);
    }

    const results = await pipeline.exec();

    if (!results || results.length === 0) {
      console.log('Pipeline execution returned no results');
      return { error: 'No results found' };
    }

    return results.map(chat => {
      if (typeof chat === 'object' && chat !== null) {
        return {
          id: (chat as any).id || '',
          title: (chat as any).title || '',
          createdAt: new Date((chat as any).createdAt || Date.now()),
          userId: (chat as any).userId || '',
          path: (chat as any).path || '',
          messages: Array.isArray((chat as any).messages) ? (chat as any).messages : [],
          sharePath: (chat as any).sharePath
        } as Chat;
      }
      // If chat is not an object, return a default Chat object
      return {
        id: '',
        title: '',
        createdAt: new Date(),
        userId: '',
        path: '',
        messages: [],
        sharePath: undefined
      } as Chat;
    });

  } catch (error) {
    console.error('An error occurred:', error);
    return { error: 'An error occurred while fetching chats' };
  }
}


export async function getChat(id: string, userId: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || (userId && chat.userId !== userId)) {
    return null
  }

  return chat
}

export async function removeChat({ id, path }: { id: string; path: string }) {
  const session = await auth()

  if (!session) {
    return {
      error: 'Unauthorized'
    }
  }

  //Convert uid to string for consistent comparison with session.user.id
  const uid = String(await kv.hget(`chat:${id}`, 'userId'))

  if (uid !== session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  await kv.del(`chat:${id}`)
  await kv.zrem(`user:chat:${session.user.id}`, `chat:${id}`)

  revalidatePath('/')
  return revalidatePath(path)
}

export async function clearChats() {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chats: string[] = await kv.zrange(`user:chat:${session.user.id}`, 0, -1)
  if (!chats.length) {
    return redirect('/')
  }
  const pipeline = kv.pipeline()

  for (const chat of chats) {
    pipeline.del(chat)
    pipeline.zrem(`user:chat:${session.user.id}`, chat)
  }

  await pipeline.exec()

  revalidatePath('/')
  return redirect('/')
}

export async function getSharedChat(id: string) {
  const chat = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chat || !chat.sharePath) {
    return null
  }

  return chat
}

export async function shareChat(id: string) {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      error: 'Unauthorized'
    }
  }

  const chatData = await kv.hgetall<Chat>(`chat:${id}`)

  if (!chatData || chatData.userId !== session.user.id) {
    return {
      error: 'Something went wrong'
    }
  }

  // Convert the chatData to a proper Chat object
  const chat: Chat = {
    ...chatData,
    createdAt: new Date(chatData.createdAt),
    messages: Array.isArray(chatData.messages)
    ? chatData.messages
    : JSON.parse(chatData.messages as unknown as string) as Message[]  }

  const payload = {
    ...chat,
    sharePath: `/share/${chat.id}`
  }

  await kv.hmset(`chat:${chat.id}`, {
    ...payload,
    createdAt: payload.createdAt.toISOString(),
    messages: JSON.stringify(payload.messages)
  })

  return payload
}

function isValidChat(chat: Chat): boolean {
  return chat.id !== undefined && chat.title !== undefined && chat.userId !== undefined && chat.createdAt !== undefined && chat.path !== undefined;
}

export async function saveChat(chat: Chat) {
  const session = await auth()

  if (session && session.user) {
    if (!isValidChat(chat)) {
      console.error('Invalid chat object:', chat);
      return;
    }

    const pipeline = kv.pipeline()
    pipeline.hmset(`chat:${chat.id}`, chat)
    pipeline.zadd(`user:chat:${chat.userId}`, {
      score: Date.now(),
      member: `chat:${chat.id}`
    })
    await pipeline.exec()
  } else {
    return
  }
}


export async function refreshHistory(path: string) {
  redirect(path)
}

export async function getMissingKeys() {
  const keysRequired = ['OPENAI_API_KEY']
  return keysRequired
    .map(key => (process.env[key] ? '' : key))
    .filter(key => key !== '')
}
