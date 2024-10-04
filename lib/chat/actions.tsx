
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
import axios from 'axios';

// Define a generic action interface to satisfy the createAI constraint
interface AIActions<AIStateType, UIStateType> {
  actions: {
    submitUserMessage: (content: string) => Promise<{ id: string; display: React.ReactNode }>;
  };
  tools: {
    [key: string]: {
      description: string;
      parameters: z.ZodObject<any>;
      generate: (args: any) => Promise<React.ReactNode>;
    };
  };
  initialAIState: AIStateType;
  initialUIState: UIStateType;
  onGetUIState: () => Promise<UIStateType | undefined>;
  onSetAIState: ({ state }: { state: AIStateType }) => Promise<void>;
}

// Define CustomAIConfig interface that extends AIActions
type CustomAIConfig = AIActions<AIState, UIState>;

// Function to handle HTTP-based API requests with retry mechanism
async function httpApiRequest(endpoint: string, payload: object, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Attempt ${attempt}: Sending request to ${endpoint} with payload:`, payload);
      const response = await axios.post(endpoint, payload, { timeout: 10000 }); // 10-second timeout
      console.log(`Attempt ${attempt}: Received response:`, response.data);
      if (response.data.response) {
        return response.data.response;
      } else if (response.data.error) {
        throw new Error(response.data.error);
      }
      throw new Error('Unexpected response format');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`Attempt ${attempt} failed: ${error.message}`);
        if (attempt === retries) {
          throw new Error(`HTTP request failed after ${retries} attempts: ${error.message}`);
        }
      } else {
        console.error(`Attempt ${attempt} failed with an unknown error`);
        if (attempt === retries) {
          throw new Error('HTTP request failed with an unknown error after maximum retries');
        }
      }
    }
  }
  throw new Error('HTTP request failed after maximum retries');
}

// Semantic Search Tool using HTTP request
async function semanticSearchTool(query: string) {
  console.log('semanticSearchTool: Starting semantic search with query:', query);
  try {
    const response = await httpApiRequest('https://your-http-endpoint.com/api/semantic-search', { query });
    console.log('semanticSearchTool: Received response:', response);
    return <BotMessage content={`Semantic Search Results: ${response}`} />;
  } catch (error) {
    console.error('Semantic search failed:', error);
    return <SystemMessage>Error: Could not process the semantic search.</SystemMessage>;
  }
}

// Metadata Query Tool using HTTP request
async function metadataQueryTool(query: string) {
  console.log('metadataQueryTool: Starting metadata query with query:', query);
  try {
    const response = await httpApiRequest('https://your-http-endpoint.com/api/metadata-query', { query });
    console.log('metadataQueryTool: Received response:', response);
    return <BotMessage content={`Metadata Query Results: ${response}`} />;
  } catch (error) {
    console.error('Metadata query failed:', error);
    return <SystemMessage>Error: Could not process the metadata query.</SystemMessage>;
  }
}

// Explicitly define parameter types for the generate function
async function submitUserMessage(content: string) {
  'use server';

  console.log('submitUserMessage: Received user message:', content);
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

  try {
    console.log('submitUserMessage: Streaming UI with user message.');
    const result = await streamUI({
      model: openai('gpt-4o'),
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
          console.log('submitUserMessage: Initializing text stream.');
          textStream = createStreamableValue('');
          textNode = <BotMessage content={textStream.value} />;
        }

        if (done) {
          console.log('submitUserMessage: Stream done. Final content:', content);
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
          console.log('submitUserMessage: Updating text stream with delta:', delta);
          textStream.update(delta);
        }

        return textNode;
      },
      tools: {
        semanticSearchTool: {
          description: 'Perform a semantic search to augment content with relevant information using HTTP requests.',
          parameters: z.object({
            query: z.string().describe('The user query to perform semantic search.'),
          }),
          generate: async ({ query }: { query: string }) => {
            console.log('submitUserMessage: Using semanticSearchTool with query:', query);
            return semanticSearchTool(query);
          },
        },
        metadataQueryTool: {
          description: 'Execute a metadata query to fetch detailed creator information using HTTP requests.',
          parameters: z.object({
            query: z.string().describe('The query for executing metadata search.'),
          }),
          generate: async ({ query }: { query: string }) => {
            console.log('submitUserMessage: Using metadataQueryTool with query:', query);
            return metadataQueryTool(query);
          },
        },
      },
    });

    console.log('submitUserMessage: Successfully processed user message.');
    return {
      id: nanoid(),
      display: result.value,
    };
  } catch (error: unknown) {
    let errorMessage = 'Error: Could not process the request.';
    if (error instanceof Error) {
      errorMessage = `Error: ${error.message}`;
    }

    console.error('Failed to process user message:', errorMessage);
    return {
      id: nanoid(),
      display: <SystemMessage>{errorMessage}</SystemMessage>,
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

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
  },
  tools: {
    semanticSearchTool: {
      description: 'Perform a semantic search to find relevant information to support and enhance responses.',
      parameters: z.object({
        query: z.string().describe('The user query to perform semantic search.'),
      }),
      generate: async ({ query }: { query: string }) => {
        console.log('AI: Using semanticSearchTool with query:', query);
        return semanticSearchTool(query);
      },
    },
    metadataQueryTool: {
      description: 'Execute a metadata query to fetch detailed creator information and context for enhanced responses.',
      parameters: z.object({
        query: z.string().describe('The query for executing metadata search.'),
      }),
      generate: async ({ query }: { query: string }) => {
        console.log('AI: Using metadataQueryTool with query:', query);
        return metadataQueryTool(query);
      },
    },
  },
  initialAIState: { chatId: nanoid(), messages: [] },
  initialUIState: [],

  onGetUIState: async () => {
    'use server';

    console.log('onGetUIState: Fetching UI state.');
    const session = await auth();

    if (session && session.user) {
      const aiState = getAIState() as Chat;
      console.log('onGetUIState: Found AI state:', aiState);

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState);
        console.log('onGetUIState: Generated UI state:', uiState);
        return uiState;
      }
    }
  },

  onSetAIState: async ({ state }) => {
    'use server';

    console.log('onSetAIState: Setting AI state with state:', state);
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

      console.log('onSetAIState: Saving chat with details:', chat);
      await saveChat(chat);
    }
  },
} as CustomAIConfig);

export const getUIStateFromAIState = (aiState: Chat) => {
  console.log('getUIStateFromAIState: Converting AI state to UI state for AI state:', aiState);
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