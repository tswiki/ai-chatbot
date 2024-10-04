
// Logging function for debugging purposes
const logDebug = (message: string) => {
  console.debug(`${new Date().toISOString()} - DEBUG - ${message}`);
};

const logError = (message: string) => {
  console.error(`${new Date().toISOString()} - ERROR - ${message}`);
};



/**
 * Function to make a POST request to the FastAPI endpoint.
 * If the session_id is invalid, a new random UUID is generated.
 */
export const interactiveSession = async (sessionId: string, query: string): Promise<any> => {
  // Validate or generate a new UUID
  const validSessionId: string = String(sessionId);

  // Define the WebSocket URL
  const url = 'wss://agentic-rag-m21c.onrender.com/ws/interactive-session';

  // Create a new WebSocket instance
  const socket = new WebSocket(url);

  // Create a promise to handle asynchronous communication with the WebSocket
  return new Promise((resolve, reject) => {
    // Handle WebSocket connection open event
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
          logDebug(`Response from WebSocket: ${JSON.stringify(data)}`);
          resolve(data); // Resolve the promise with the response data
        } else if (data.error) {
          // Error response received
          logError(`Error from WebSocket: ${data.error}`);
          reject(new Error(data.error)); // Reject the promise with the error message
        }
      } catch (error) {
        logError(`An error occurred while processing the WebSocket response: ${error}`);
        reject(error); // Reject the promise with the error
      }
    };

    // Handle WebSocket errors
    socket.onerror = (event) => {
      logError(`WebSocket error: ${event}`);
      reject(new Error('WebSocket error occurred.'));
    };

    // Handle WebSocket connection close event
    socket.onclose = (event) => {
      if (event.wasClean) {
        logDebug('WebSocket connection closed cleanly.');
      } else {
        logError(`WebSocket connection closed with code: ${event.code}, reason: ${event.reason}`);
      }
    };
  });
};



// Example usage in a Next.js app component or page
// import { useEffect } from 'react';

// useEffect(() => {
//   interactiveSession('your-session-id', 'your-query').then(() => {
//     console.log('Request completed');
//   }).catch((error) => {
//     console.error('Error during request:', error);
//   });
// }, []);
