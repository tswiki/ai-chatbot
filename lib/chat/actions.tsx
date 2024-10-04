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

interface CreateAIOptions<AIStateType, UIStateType> {
  actions: {
    submitUserMessage: (content: string) => Promise<{ id: string; display: React.ReactNode }>;
  };
  initialAIState: AIStateType;
  initialUIState: UIStateType;
  onGetUIState: () => Promise<UIStateType | undefined>;
  onSetAIState: ({ state }: { state: AIStateType }) => Promise<void>;
  tools?: Record<string, any>;
}

async function semanticSearchTool(query: string) {
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

// Establish WebSocket communication for long-running tasks
async function useWebSocketForProcessing(sessionId: string, content: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket('wss://your-websocket-endpoint.com/ws/interactive-session');

    socket.onopen = () => {
      socket.send(JSON.stringify({ session_id: sessionId, user_query: content }));
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
  let streamClosed = false;

  const session = await auth();
  const sessionId = session?.user?.id || crypto.randomUUID();

  try {
    // Use WebSocket for processing long-running tasks
    const responseContent = await useWebSocketForProcessing(sessionId, content);

    if (!textStream) {
      textStream = createStreamableValue('');
      textNode = <BotMessage content={textStream.value} />;
    }

    textStream.update(responseContent);
    textStream.done();
    streamClosed = true;
    aiState.update({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'assistant',
          content: responseContent,
        },
      ],
    });

    return {
      id: nanoid(),
      display: textNode,
    };
  } catch (error) {
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
} as CreateAIOptions<AIState, UIState>);

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
