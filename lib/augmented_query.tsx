

function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
}

const interactiveSessionTool = async (sessionId: string, query: string) => {
  let token: string | undefined;

  // Check if running on the client side
  if (typeof window !== 'undefined') {
    // Retrieve the token from localStorage, sessionStorage, or cookies
    token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || getCookie('auth_token');
  }

  // Append token as a query parameter in the URL if it exists
  const url = token ? `wss://agentic-rag-m21c.onrender.com/ws/interactive-session?token=${token}` : 'wss://agentic-rag-m21c.onrender.com/ws/interactive-session';

  try {
    // Connect to the WebSocket
    const socket = new WebSocket(url);

    return new Promise((resolve, reject) => {
      socket.onopen = () => {
        // Construct the payload
        const payload = {
          session_id: sessionId,
          user_query: query,
        };

        console.log('Sending payload to WebSocket:', payload);
        socket.send(JSON.stringify(payload));
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.response) {
          resolve({ response: data.response });
        } else if (data.error) {
          console.error(`Error from WebSocket: ${data.error}`);
          reject(`Error: ${data.error}`);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject('WebSocket error occurred.');
      };

      socket.onclose = (event) => {
        console.log('WebSocket connection closed.', event);
      };
    });
  } catch (error) {
    console.error('An error occurred:', error);
    throw new Error('Failed to initiate WebSocket interaction.');
  }
};


export { interactiveSessionTool };
