import 'server-only';

import { interactiveSession } from '../augmented_query';
import { createAI, createStreamableUI, getMutableAIState, getAIState, streamUI, createStreamableValue } from 'ai/rsc';
import { openai } from '@ai-sdk/openai';
import { BotMessage, SystemMessage } from '@/components/stocks';
import { z } from 'zod';
import { nanoid } from '@/lib/utils';
import { saveChat } from '@/app/actions';
import { SpinnerMessage, UserMessage } from '@/components/stocks/message';
import { Chat, Message } from '@/lib/types';
import { auth } from '@/auth';

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

// Define the new tools
async function semanticSearchTool(query: string) {
  // Call the semantic search function
  try {
    const response = await fetch(`https://graph-rag-avde.onrender.com/semanticsearch/${encodeURIComponent(query)}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await response.json();
    return <BotMessage content={`Semantic Search Results: ${JSON.stringify(result)}`} />;
  } catch (error) {
    console.error('Semantic search failed:', error);
    return <SystemMessage>Error: Could not process the semantic search.</SystemMessage>;
  }
}

async function executeMetadataQueryTool(query: string) {
  // Call the metadata query function
  try {
    const response = await fetch(`https://metadata-rag.onrender.com/execute_metadata_query/${encodeURIComponent(query)}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await response.json();
    return <BotMessage content={`Metadata Query Results: ${JSON.stringify(result)}`} />;
  } catch (error) {
    console.error('Metadata query failed:', error);
    return <SystemMessage>Error: Could not process the metadata query.</SystemMessage>;
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

  const session = await auth();
  const sessionId = session?.user?.id || crypto.randomUUID();

  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const result = await streamUI({
        model: openai('gpt-4o'), // Adjust the model if needed
        initial: <SpinnerMessage />,
        system: `
        You are "Creators' Library," a triager for revitalise.io, an IPGA growth partner helping users achieve a comprehensive understanding of their audience's intent. Your job is to process user queries quickly and efficiently, returning initial key insights immediately and following up with detailed information as needed.

        **Primary Goal:**  
        - Provide users with an immediate summary or actionable insights relevant to their query.
        - Break down complex information into smaller, digestible chunks to process responses quickly, ensuring users receive an overview first and detailed follow-ups asynchronously.

        **Asynchronous Processing:**  
        - For larger tasks, return a brief overview or an initial response within 5 seconds. After the initial response, continue processing more detailed information in the background.
        - Use markers like "[Processing detailed response...]" to indicate that further processing is occurring.

        **Tools and Usage Instructions:**  
        - Available tools: {tools}
        - You can use any of the following tools by their names: {tool_names}
        - Utilize the "semantic search" tool to quickly find relevant information to generate an overview response.
        - Use the "metadata query" tool for detailed creator metadata and context extraction.
        - For long-running tasks (e.g., detailed script creation), keep the user updated on progress and estimated completion time.

        **Conversation Flow:**  
        - Always start with an immediate, concise response to the user's input.
        - Use placeholders to indicate when more detailed information is being processed asynchronously.
        - Ensure clear communication to the user about the processing status and expected delivery of detailed results.
        `,
        messages: [
          ...aiState.get().messages,
          {
            role: 'system',
            content: `
              You have access to the tools 'interactiveSessionTool', 'semanticSearchTool', and 'metadataQueryTool' to fetch information. 
              Use them to generate responses based on real-time data from the backend.
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
            generate: async ({ session_id, query }: { session_id: string; query: string }) => {
              try {
                const result = await interactiveSession(session_id, query);
                return <BotMessage content={`Response: ${JSON.stringify(result)}`} />;
              } catch (error) {
                console.error('WebSocket interaction failed:', error);
                return <SystemMessage>Error: Could not process the WebSocket request.</SystemMessage>;
              }
            },
          },
          semanticSearchTool: {
            description: 'Perform a semantic search to augment content with relevant information.',
            parameters: z.object({
              query: z.string().describe('The user query to perform semantic search.'),
            }),
            generate: async ({ query }: { query: string }) => {
              return semanticSearchTool(query);
            },
          },
          metadataQueryTool: {
            description: 'Execute a metadata query to fetch detailed creator information.',
            parameters: z.object({
              query: z.string().describe('The query for executing metadata search.'),
            }),
            generate: async ({ query }: { query: string }) => {
              return executeMetadataQueryTool(query);
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
      generate: async ({ session_id, query }: { session_id: string; query: string }) => {
        try {
          const result = await interactiveSession(session_id, query);
          return <BotMessage content={`Response: ${JSON.stringify(result)}`} />;
        } catch (error) {
          console.error('WebSocket interaction failed:', error);
          return <SystemMessage>Error: Could not process the WebSocket request.</SystemMessage>;
        }
      },
    },
    semanticSearchTool: {
      description: 'Perform a semantic search to augment content with relevant information.',
      parameters: z.object({
        query: z.string().describe('The user query to perform semantic search.'),
      }),
      generate: async ({ query }: { query: string }) => {
        return semanticSearchTool(query);
      },
    },
    metadataQueryTool: {
      description: 'Execute a metadata query to fetch detailed creator information.',
      parameters: z.object({
        query: z.string().describe('The query for executing metadata search.'),
      }),
      generate: async ({ query }: { query: string }) => {
        return executeMetadataQueryTool(query);
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
