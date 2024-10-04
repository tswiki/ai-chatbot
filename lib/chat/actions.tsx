import 'server-only';

import { createAI, createStreamableUI, getMutableAIState, getAIState, streamUI, createStreamableValue } from 'ai/rsc';
import { openai } from '@ai-sdk/openai';
import { BotMessage, SystemMessage } from '@/components/stocks';
import { z } from 'zod';
import { nanoid } from '@/lib/utils';
import { saveChat } from '@/app/actions';
import { SpinnerMessage, UserMessage } from '@/components/stocks/message';
import { Chat, Message } from '@/lib/types';
import { auth } from '@/auth';

// Define WebSocket-based function for socket-based API request
async function useSocketApiRequest(endpoint: string, payload: object): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(endpoint);

    socket.onopen = () => {
      socket.send(JSON.stringify(payload));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.response) {
          resolve(data.response);
        } else if (data.error) {
          reject(new Error(data.error));
        }
      } catch (error) {
        reject(new Error('Failed to process WebSocket response.'));
      }
    };

    socket.onerror = (error) => {
      reject(new Error('WebSocket error occurred.'));
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed.');
    };
  });
}

// Semantic Search Tool using WebSocket
async function semanticSearchTool(query: string) {
  try {
    const response = await useSocketApiRequest('wss://your-websocket-endpoint.com/ws/semantic-search', { query });
    return <BotMessage content={`Semantic Search Results: ${response}`} />;
  } catch (error) {
    console.error('Semantic search failed:', error);
    return <SystemMessage>Error: Could not process the semantic search.</SystemMessage>;
  }
}

// Metadata Query Tool using WebSocket
async function metadataQueryTool(query: string) {
  try {
    const response = await useSocketApiRequest('wss://your-websocket-endpoint.com/ws/metadata-query', { query });
    return <BotMessage content={`Metadata Query Results: ${response}`} />;
  } catch (error) {
    console.error('Metadata query failed:', error);
    return <SystemMessage>Error: Could not process the metadata query.</SystemMessage>;
  }
}

// Explicitly define parameter types for the generate function
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

  const session = await auth();
  const sessionId = session?.user?.id || crypto.randomUUID();

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
            You have access to the 'semanticSearchTool' and 'metadataQueryTool' to fetch information. Use them to generate responses based on real-time data from the backend.
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
        semanticSearchTool: {
          description: 'Perform a semantic search to augment content with relevant information using WebSocket-based requests.',
          parameters: z.object({
            query: z.string().describe('The user query to perform semantic search.'),
          }),
          generate: async ({ query }: { query: string }) => {
            return semanticSearchTool(query);
          },
        },
        metadataQueryTool: {
          description: 'Execute a metadata query to fetch detailed creator information using WebSocket-based requests.',
          parameters: z.object({
            query: z.string().describe('The query for executing metadata search.'),
          }),
          generate: async ({ query }: { query: string }) => {
            return metadataQueryTool(query);
          },
        },
      },
    });

    return {
      id: nanoid(),
      display: result.value,
    };
  } catch (error: any) {
    console.error('Failed to process user message:', error);
    return {
      id: nanoid(),
      display: <SystemMessage>Error: Could not process the request.</SystemMessage>,
    };
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

interface CustomAIConfig {
  actions: {
    submitUserMessage: (content: string) => Promise<{ id: string; display: React.ReactNode }>;
  };
  tools: Record<string, any>;
  initialAIState: AIState;
  initialUIState: UIState;
  onGetUIState: () => Promise<UIState | undefined>;
  onSetAIState: ({ state }: { state: AIState }) => Promise<void>;
}

export const AI = createAI<AIState, UIState, CustomAIConfig>({
  actions: {
    submitUserMessage,
  },
  tools: {
    semanticSearchTool: {
      description: 'Perform a semantic search to augment content with relevant information using WebSocket-based requests.',
      parameters: z.object({
        query: z.string().describe('The user query to perform semantic search.'),
      }),
      generate: async ({ query }: { query: string }) => {
        return semanticSearchTool(query);
      },
    },
    metadataQueryTool: {
      description: 'Execute a metadata query to fetch detailed creator information using WebSocket-based requests.',
      parameters: z.object({
        query: z.string().describe('The query for executing metadata search.'),
      }),
      generate: async ({ query }: { query: string }) => {
        return metadataQueryTool(query);
      },
    },
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
} as CustomAIConfig);

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
