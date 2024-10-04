
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
import * as React from 'react';

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



async function semanticSearchTool(query: string) {
  console.log('semanticSearchTool: Starting semantic search with query:', query);

  // Encode the query string
  const encodedQuery = encodeURIComponent(query);
  const url = `https://graph-rag-avde.onrender.com/semanticsearch/${encodedQuery}`;
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    // Execute the GET request using axios
    const response = await axios.get(url, { headers });

    if (response.status === 200 && response.data) {
      console.log('semanticSearchTool: Received response:', response.data);
      // Return the raw data to be used by the LLM
      return response.data;
    } else {
      console.error('Error: Received empty response from the server.');
      return 'Error: Received empty response from the server.';
    }
  } catch (error) {
    console.error('Semantic search failed:', error);
    return 'Error: Could not process the semantic search.';
  }
}

async function metadataQueryTool(query: string) {
  console.log('metadataQueryTool: Starting metadata query with query:', query);

  // Encode the query string
  const encodedQuery = encodeURIComponent(query);
  const url = `https://metadata-rag.onrender.com/execute_metadata_query/${encodedQuery}`;
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    // Execute the GET request using axios
    const response = await axios.get(url, { headers });

    if (response.status === 200 && response.data) {
      console.log('metadataQueryTool: Received response:', response.data);
      // Return the raw data to be used by the LLM
      return response.data;
    } else {
      console.error('Error: Received empty response from the server.');
      return 'Error: Received empty response from the server.';
    }
  } catch (error) {
    console.error('Metadata query failed:', error);
    return 'Error: Could not process the metadata query.';
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
      You are "Creators' Library," a creator economy data instrumentation assistant. Your goal is to provide quick, actionable solutions tailored to the user's needs.

      **Primary Goal:**  
      - Use the outputs of tools like 'semanticSearchTool' and 'metadataQueryTool' to generate contextually enriched responses.
      - Do not directly display tool outputs; instead, synthesize them into a user-friendly and actionable message.

      **Handling Tool Outputs:**  
      - After using a tool, integrate its result into a coherent, helpful response for the user.
      - Only display the final LLM-generated response that utilizes the tool's information.

      **User Guidance:**  
      - Break down complex concepts into small, understandable chunks.
      - Notify the user if additional information is required for a more detailed response.
      `,
      messages: [
        ...aiState.get().messages,
        {
          role: 'system',
          content: `
            You have access to the 'semanticSearchTool' and 'metadataQueryTool' to fetch information. Use these tools to generate responses based on their outputs.
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
            const toolOutput = await semanticSearchTool(query);
            // Return the tool output to the LLM for response generation
            return `Semantic search tool result: ${JSON.stringify(toolOutput)}`;
          },
        },
        metadataQueryTool: {
          description: 'Execute a metadata query to fetch detailed creator information using HTTP requests.',
          parameters: z.object({
            query: z.string().describe('The query for executing metadata search.'),
          }),
          generate: async ({ query }: { query: string }) => {
            console.log('submitUserMessage: Using metadataQueryTool with query:', query);
            const toolOutput = await metadataQueryTool(query);
            // Return the tool output to the LLM for response generation
            return `Metadata query tool result: ${JSON.stringify(toolOutput)}`;
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