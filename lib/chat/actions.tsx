
import 'server-only';

import { interactiveSessionTool } from '../augmented_query';
import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue,
} from 'ai/rsc';

import { openai } from '@ai-sdk/openai';
import { BotMessage, SystemMessage } from '@/components/stocks';
import { z } from 'zod';
import { tool } from 'ai';

import { nanoid } from '@/lib/utils';
import { saveChat } from '@/app/actions';
import { SpinnerMessage, UserMessage } from '@/components/stocks/message';
import { Chat, Message } from '@/lib/types';
import { auth } from '@/auth';



// Helper function to check if an object is a Chat
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


export const getSessionId = async (): Promise<string> => {
  // Attempt to get the current authenticated session
  const session = await auth();

  // Check if a session ID is already stored in local storage
  let sessionId = String(localStorage.getItem('sessionId'));

  if (session?.user?.id) {
    // If the user is authenticated, use their user ID as the session ID
    sessionId = String(session?.user?.id);
    localStorage.setItem('sessionId', sessionId);
  } else if (!sessionId) {
    // If no session ID is stored, generate a new one
    sessionId = nanoid();
    localStorage.setItem('sessionId', sessionId);
  }

  return sessionId;
};


// Process user message using the session tool
async function processMessage(
  session_id: string,
  content: string
): Promise<string | undefined> {
  try {

    session_id = String(getSessionId);

    const result = await interactiveSessionTool(session_id, content);

    if (result && 'response' in result) {
      return result.response;
    } else if (result && 'error' in result) {
      console.error('Error from interactiveSessionTool:', result.error);
      return undefined;
    } else {
      console.error('Unexpected result from interactiveSessionTool:', result);
      return undefined;
    }
  } catch (error) {
    console.error('Failed to process message:', error);
    return undefined;
  }
}

// Submits user message for processing
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

  // Obtain the session ID once
  const session = await auth();
  const sessionId = String(session?.user?.id || crypto.randomUUID());

  // Process messages before passing to streamUI
  const processedMessages = await Promise.all(
    aiState.get().messages.map(async (message: any) => {
      let processedContent = message.content;

      if (message.role === 'user') {
        const result = await processMessage(sessionId, message.content);
        processedContent = result || message.content;
      }

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

  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const result = await streamUI({
        model: openai('gpt-4o'),
        initial: <SpinnerMessage />,
        system: `
        You are "Creators' Library," a creator economy data instrumentation assistant. Your primary function is to help users achieve their goals and solve their problems by providing concise, accurate, and data-backed information in an easy-to-understand, actionable format.

        Primary Goal:
        Quickly display key insights from the backend's initial response.
        Use tools, especially the 'interactiveSessionTool,' to gather additional context and data for more complex queries.
        Provide a final, contextualized response that directly addresses the user's query with clear, actionable insights.

        User Guidance:
        Proactively break down complex ideas into manageable steps.
        Notify the user if additional information is needed for a more detailed response.
        For long-running tasks, keep the user updated with progress indicators and estimated completion times.
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
    } catch (error: any) {
      console.error(`Attempt ${retries + 1} failed:`, error);
      retries++;
      if (retries === maxRetries) {
        console.error('Max retries reached. Returning error message.');
        let errorMessage = 'An error occurred. Please try again later.';
        if (error.message && error.message.includes('Pipeline is empty')) {
          errorMessage =
            'The AI system is currently unavailable. Please try again in a few minutes.';
        } else if (error.name === 'NetworkError' || !navigator.onLine) {
          errorMessage =
            'Network error. Please check your internet connection and try again.';
        }
        return {
          id: nanoid(),
          display: <SystemMessage>{errorMessage}</SystemMessage>,
        };
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * retries)); // Exponential backoff
    }
  }
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
