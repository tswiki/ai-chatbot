

export const interactiveSessionTool = async (sessionId: string, query: string): Promise<{ sessionId: string; response: any; error?: string }> => {
  // Validate the session ID
  const validSessionId: string = String(sessionId);

  // Define the WebSocket URL
  const url = 'wss://agentic-rag-m21c.onrender.com/ws/interactive-session';

  // Create a promise to handle asynchronous communication with the WebSocket
  return new Promise((resolve) => {
    // Create a new WebSocket instance
    const socket = new WebSocket(url);

    // Retry logic variables
    let retries = 0;
    const maxRetries = 3;

    // Define the payload to send to the WebSocket
    const payload = {
      session_id: validSessionId,
      user_query: query,
    };

    // Function to handle incoming WebSocket messages
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        // Handle different types of responses
        if (data.response) {
          resolve({ sessionId: validSessionId, response: data.response }); // Resolve with the response data
          socket.close(); // Close the WebSocket connection after receiving the response
        } else if (data.error) {
          resolve({ sessionId: validSessionId, response: null, error: data.error }); // Resolve with an error
          socket.close(); // Close the WebSocket connection after an error
        }
      } catch (error) {
        resolve({ sessionId: validSessionId, response: null, error: `Processing error: ${error}` }); // Resolve with a processing error
        socket.close(); // Close the WebSocket connection
      }
    };

    // Function to handle WebSocket errors
    const handleError = () => {
      if (retries < maxRetries) {
        retries++;
        setTimeout(attemptConnection, 1000 * retries); // Exponential backoff
      } else {
        resolve({ sessionId: validSessionId, response: null, error: 'WebSocket error occurred. Maximum retries reached.' });
      }
    };

    // Function to handle WebSocket close events
    const handleClose = (event: CloseEvent) => {
      if (!event.wasClean && retries < maxRetries) {
        retries++;
        setTimeout(attemptConnection, 1000 * retries); // Exponential backoff
      } else if (!event.wasClean) {
        resolve({ sessionId: validSessionId, response: null, error: `Unexpected WebSocket closure. Code: ${event.code}, Reason: ${event.reason}` });
      }
    };

    // Attempt to connect to the WebSocket
    const attemptConnection = () => {
      // Set up WebSocket event handlers
      socket.onopen = () => {
        socket.send(JSON.stringify(payload));
      };
      socket.onmessage = handleMessage;
      socket.onerror = handleError;
      socket.onclose = handleClose;
    };

    // Initial connection attempt
    attemptConnection();
  });
};
