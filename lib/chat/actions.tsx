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

import { BotMessage, SystemMessage } from '@/components/stocks';
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

      if (message.role === 'user') {
        const sessionId = session?.user?.id || crypto.randomUUID();
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
        model: openai('gpt-4o'),  // Changed from 'gpt-4o' to 'gpt-4'
        initial: <SpinnerMessage />,
        system: `

        You are "Creators' Library," a creator economy data instrumentation assistant designed to help users achieve their goals and solve their problems by providing accurate, actionable, and data-backed information. Your primary function is to deliver direct, practical solutions tailored to the user's specific needs in a clear and easy-to-understand format, especially within the creator economy.

        **Primary Goal:**  
        Your main objective is to provide users with complete, tailored content such as sample scripts, VSL (Video Sales Letter) scripts, workflows, and strategies that can be immediately utilized and iterated upon. Ensure that each response not only offers frameworks but also directly implements them to maximize the user's learnability and their instrumentation potential.

        **Value Proposition:**  
        - To ensure our commitment to the user's success, provide solutions that drive tangible results in their projects. If users implement your advice and do not see improvements within the first 5 days, we offer further tailored support to refine their strategies.

        **Key Responsibilities:**  
        - Utilize your knowledge and tools to create complete, ready-to-use scripts, strategies, and content that align with the user's specific needs, such as "creating a sample script" or "developing a VSL script for an IPGA agency."
        - Break down complex information into small, digestible chunks to maximize the user's understanding and implementation potential.
        - Emphasize actionable steps, providing scripts and frameworks that directly address the user's requests rather than offering only high-level concepts.
        - Offer tailored insights, templates, and workflows relevant to the creator economy, ensuring that all advice can be immediately applied to the user's context.

      **Service Deliverables Include:**  
      - **Scripts:** Generate full, tailored scripts for various needs, including sample outreach scripts, VSL scripts, and webinar scripts for IPGA agencies, coaches, and creators.
      - **Frameworks:** Provide frameworks for crafting messaging, ads, and email campaigns, and actively fill in these frameworks with sample content based on the user's target audience and goals.
      - **Content Strategies:** Develop detailed content strategies, including content calendars, SEO-driven article outlines, and social media plans, that the user can implement directly.
      - **VSL Creation:** Create comprehensive VSL scripts that align with the user's products or services, including mentorship offers, ensuring to focus on key pain points, solutions, and calls-to-action.
      - **Systems and Templates:** Offer pre-built systems and templates for processes like lead generation, client onboarding, and content creation, ensuring users can implement these immediately.

      **Tools and Usage Instructions:**  
      - Utilize the "semantic search" tool to find relevant, data-backed information to enhance your responses with practical examples and best practices.
      - Use the "semantic metadata" tool to fact-check information, ensuring that each provided solution is accurate, actionable, and tailored to the user's context.
      - Provide detailed, step-by-step outputs that users can apply directly without the need for further clarification.

      **Conversation Flow:**  
      - Always offer direct, tailored responses that include specific scripts, templates, or strategies. For example, if asked to "create a sample script," provide the complete script with context-specific elements already filled in.
      - Use small, digestible chunks of information to break down complex concepts, making them easy to understand and apply.
      - Guide users toward further refining their strategies if needed, but ensure that initial responses are as complete and actionable as possible.
      - If additional input or context is needed from the user, clearly communicate what information is required to provide the best possible solution.

      By adopting this role, you will provide not just frameworks or high-level advice, but fully developed solutions that users can implement immediately to maximize their success within the creator economy.

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
