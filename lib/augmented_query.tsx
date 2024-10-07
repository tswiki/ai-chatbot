function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
}

const interactiveSessionTool = async (sessionId: string, query: string): Promise<{ response: string } | { error: string }> => {
  // Retrieve the token from localStorage, sessionStorage, or cookies
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || getCookie('auth_token');

  // Append token as a query parameter in the URL
  const url = `wss://agentic-rag-m21c.onrender.com/ws/interactive-session?token=${token}`;

  return new Promise((resolve, reject) => {
    try {
      // Connect to the WebSocket
      const socket = new WebSocket(url);

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
          resolve({ response: `Final response: ${data.response}` });
        } else if (data.error) {
          console.error(`Error from WebSocket: ${data.error}`);
          reject({ error: data.error });
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject({ error: 'WebSocket encountered an error.' });
      };

      socket.onclose = () => {
        console.log('WebSocket connection closed.');
        // Reject if the connection closes unexpectedly without resolving
        reject({ error: 'WebSocket connection closed unexpectedly.' });
      };
    } catch (error) {
      console.error('An error occurred:', error);
      reject({ error: 'An error occurred while establishing the WebSocket connection.' });
    }
  });
};

export { interactiveSessionTool };
