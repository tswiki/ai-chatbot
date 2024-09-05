import 'server-only';

import { interactiveSession } from '../augmented_query';

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue,
} from 'ai/rsc';

import { openai } from '@ai-sdk/openai';

import { BotMessage } from '@/components/stocks';
import { z } from 'zod';
import { tool } from 'ai';

import { nanoid } from '@/lib/utils';

import { saveChat } from '@/app/actions';
import { SpinnerMessage, UserMessage } from '@/components/stocks/message';
import { Chat, Message } from '@/lib/types';
import { auth } from '@/auth';


function isChat(obj: any): obj is Chat {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'createdAt' in obj &&
    'userId' in obj &&
    'path' in obj &&
    'messages' in obj &&
    Array.isArray(obj.messages)
  );
}

async function processMessage(session_id: string, content: string): Promise<string | undefined> {
  
  try {
    
    const index = await interactiveSession(session_id, content);

    // If index is an object, convert it to a string format that makes sense.
    let indexString = '';
    if (typeof index === 'object') {
      indexString = JSON.stringify(index, null, 2); // Convert object to a pretty-printed string
    } else {
      indexString = String(index); // Ensure index is a string
    }

    const text = `Answer this query: '${content}' using this information: '${indexString}' as the only source of context and knowledge. Do not generate any additional information if provided context is inadequate; instead, return a friendly message explaining that the user's request cannot currently be processed due to limited or insufficient training or contextual information available. Please provide more specific information or try a different query.`;

    return text;
  } catch (error) {
    console.error('Failed to augment content:', error);
    return undefined;
  }
}

async function submitUserMessage(content: string) {
  'use server';

  const aiState = getMutableAIState<typeof AI>();

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content,
      },
    ],
  });

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>;
  let textNode: undefined | React.ReactNode;

  // Process messages before passing them to streamUI
  const processedMessages = await Promise.all(
    aiState.get().messages.map(async (message: any) => {
      
      let processedContent = message.content;
      const session = await auth();

      if (message.role === 'user' && session?.user?.id) {
        const result = await processMessage(session.user.id, message.content);
        processedContent = result //|| message.content; // Fallback to original content if processing fails
      }

      if (message.role === 'user' && !session?.user?.id) {
        const result = await processMessage(crypto.randomUUID(), message.content);
        processedContent = result //|| message.content; // Fallback to original content if processing fails
      }

      // Ensure that any object content is stringified properly
      if (typeof processedContent === 'object') {
        processedContent = JSON.stringify(processedContent, null, 2);
      }

      return {
        role: message.role,
        content: processedContent,
        name: message.name,
      };
    })
  );

  const result = await streamUI({
    model: openai('gpt-4o'),
    initial: <SpinnerMessage />,
    system: `
    You are a creator economy data instrumentation assistant that has the primary
    function of helping users achieve their goals and solve their problems by providing concise, accurate, 
    and data-backed information that is provided in an easy-to-understand and iterate-on format.
    Any information generated should be limited to a maximum of 5 distinct (actionable) points (insights)
    to prevent analysis paralysis and ensure that the information is provided in efficient, understandable, 
    and digestible chunks to maximize the user's learnability and instrumentation potential.
    `,
    messages: processedMessages,
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('');
        textNode = <BotMessage content={textStream.value} />;
      }

      if (done) {
        textStream.done();
        aiState.update({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content,
            },
          ],
        });
      } else {
        textStream.update(delta);
      }

      return textNode;
    },
  });

  return {
    id: nanoid(),
    display: result.value,
  };
}


export type AIState = {
  chatId: string;
  messages: Message[];
};

export type UIState = {
  id: string;
  display: React.ReactNode;
}[];

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  
  
  onGetUIState: async () => {
    'use server';

    const session = await auth();

    if (session && session.user) {
      const aiState = getAIState() as Chat;

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState);
        return uiState;
      }
    } else {
      return;
    }
  },
  onSetAIState: async ({ state }) => {
    'use server';

    const session = await auth();

    if (session && session.user) {
      const { chatId, messages } = state;

      const createdAt = new Date();
      const userId = session.user.id as string;
      const path = `/chat/${chatId}`;

      const firstMessageContent = messages[0].content as string;
      const title = firstMessageContent.substring(0, 100);

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path,
      };

      await saveChat(chat);
    } else {
      return;
    }
  },
});

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter((message) => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' && typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null,
    }));
};
