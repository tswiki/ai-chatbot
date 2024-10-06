
import 'server-only';

import { interactiveSessionTool } from '../augmented_query'; // Use interactiveSessionTool as defined earlier

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

// Extend the type of createAI to include tools
interface CreateAIOptions {
  actions: {
    submitUserMessage: (content: string) => Promise<{ id: string; display: React.ReactNode }>;
  };
  initialAIState: AIState;
  initialUIState: UIState;
  onGetUIState: () => Promise<UIState | undefined>;
  onSetAIState: ({ state }: { state: AIState }) => Promise<void>;
  tools?: Record<string, any>; // Add the optional tools property
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
  
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const result = await streamUI({
        model: openai('gpt-4o'), // Adjust the model if needed
        initial: <SpinnerMessage />,
        system: `
        You are "Creators' Library," a creator economy data instrumentation assistant. Your goal is to provide quick, actionable solutions tailored to the user's needs, ensuring a seamless interaction.

        **Primary Goal:**  
        - Quickly display key insights from the backend's initial response.
        - Use tools to gather additional context and data if required.
        - Show loading states or progress indicators while waiting for the backend to process detailed responses.

        **Handling Asynchronous Data:**  
        - When receiving partial data, display it immediately to the user.
        - Show a "Processing..." indicator or a loading animation for sections that are still being generated by the backend.
        - Continuously poll or use WebSockets to stream data as the backend completes further processing.

        **User Guidance:**  
        - Break down complex concepts into small, understandable chunks.
        - Notify the user if additional information is required for a more detailed response.
        - For long-running tasks (e.g., detailed script creation), keep the user updated on progress and estimated completion time.
        `,
        messages: [
          ...aiState.get().messages,
          {
            role: 'system',
            content: `
              You have access to the tool 'interactiveSessionTool' to fetch information. 
              Use it to generate responses based on real-time data from the backend.
            `,
          },
        ],
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
        tools: {
          interactiveSessionTool: {
            description: 'Interact with the WebSocket endpoint for complex data queries.',
            parameters: z.object({
              session_id: z.string().describe('The session ID for the WebSocket connection.'),
              query: z.string().describe('The user query to send to the WebSocket endpoint.'),
            }),
            // Define parameter types for the function
            generate: async ({ session_id, query }: { session_id: string; query: string }) => {
              try {
                const result = await interactiveSessionTool(session_id, query); // Use the interactiveSessionTool here
                return <BotMessage content={`Response: ${JSON.stringify(result.response)}`} />;
              } catch (error) {
                console.error('WebSocket interaction failed:', error);
                return <SystemMessage>Error: Could not process the WebSocket request.</SystemMessage>;
              }
            },
          },
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
          errorMessage = 'The AI system is currently unavailable. Please try again in a few minutes.';
        } else if (error.name === 'NetworkError' || !navigator.onLine) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        }
        return {
          id: nanoid(),
          display: <SystemMessage>{errorMessage}</SystemMessage>,
        };
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
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
  initialAIState: { chatId: nanoid(), messages: [] },
  initialUIState: [],
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
  tools: {
    interactiveSessionTool: {
      description: 'Interact with the WebSocket endpoint for complex data queries.',
      parameters: z.object({
        session_id: z.string().describe('The session ID for the WebSocket connection.'),
        query: z.string().describe('The user query to send to the WebSocket endpoint.'),
      }),
      // Define parameter types for the function
      generate: async ({ session_id, query }: { session_id: string; query: string }) => {
        try {
          const result = await interactiveSessionTool(session_id, query); // Use the interactiveSessionTool here
          return <BotMessage content={`Response: ${JSON.stringify(result.response)}`} />;
        } catch (error) {
          console.error('WebSocket interaction failed:', error);
          return <SystemMessage>Error: Could not process the WebSocket request.</SystemMessage>;
        }
      },
    },
  },
} as CreateAIOptions);

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
