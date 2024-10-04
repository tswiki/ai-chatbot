
// Logging function for debugging purposes
const logDebug = (message: string) => {
  console.debug(`${new Date().toISOString()} - DEBUG - ${message}`);
};

const logError = (message: string) => {
  console.error(`${new Date().toISOString()} - ERROR - ${message}`);
};



export const interactiveSession = async (sessionId: string, query: string): Promise<any> => {
  // Validate or generate a new UUID
  const validSessionId: string = String(sessionId);

  // Define the WebSocket URL
  const url = 'wss://agentic-rag-m21c.onrender.com/ws/interactive-session';

  // Create a promise to handle asynchronous communication with the WebSocket
  return new Promise((resolve, reject) => {
    // Create a new WebSocket instance
    const socket = new WebSocket(url);

    // Set up retry logic
    let retries = 0;
    const maxRetries = 3;

    const attemptConnection = () => {
      retries++;
      socket.onopen = () => {
        // Define the payload to send to the WebSocket
        const payload = {
          session_id: validSessionId,
          user_query: query,
        };
        // Send the payload as a JSON string
        socket.send(JSON.stringify(payload));
      };

      // Handle messages received from the WebSocket
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.response) {
            // Successful response received
            console.log(`Response from WebSocket: ${JSON.stringify(data)}`);
            resolve(data); // Resolve the promise with the response data
          } else if (data.error) {
            // Error response received
            console.error(`Error from WebSocket: ${data.error}`);
            reject(new Error(data.error)); // Reject the promise with the error message
          }
        } catch (error) {
          console.error(`An error occurred while processing the WebSocket response: ${error}`);
          reject(error); // Reject the promise with the error
        }
      };

      // Handle WebSocket errors
      socket.onerror = (event) => {
        console.error(`WebSocket error: ${event}`);
        if (retries < maxRetries) {
          console.log(`Retrying WebSocket connection... Attempt ${retries} of ${maxRetries}`);
          setTimeout(attemptConnection, 1000 * retries); // Exponential backoff
        } else {
          reject(new Error('WebSocket error occurred. Maximum retries reached.'));
        }
      };

      // Handle WebSocket connection close event
      socket.onclose = (event) => {
        if (event.wasClean) {
          console.log('WebSocket connection closed cleanly.');
        } else {
          console.error(`WebSocket connection closed with code: ${event.code}, reason: ${event.reason}`);
          if (retries < maxRetries) {
            console.log(`Retrying WebSocket connection... Attempt ${retries} of ${maxRetries}`);
            setTimeout(attemptConnection, 1000 * retries); // Exponential backoff
          } else {
            reject(new Error('WebSocket connection closed unexpectedly. Maximum retries reached.'));
          }
        }
      };
    };

    // Attempt the initial connection
    attemptConnection();
  });
};
