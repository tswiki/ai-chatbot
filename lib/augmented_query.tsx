
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

  // Define the endpoint URL
  const url = 'https://agentic-rag-m21c.onrender.com/interactive-session';

  // Define the payload with the required parameters
  const payload = {
    session_id: validSessionId,  // Use the (validated or newly generated) session ID
    user_query: query,  // Use the provided query
  };

  try {
    // Make the POST request to the FastAPI endpoint
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Check if the request was successful
    if (response.ok) {
      const data = await response.json();
      logDebug(`Response from API: ${JSON.stringify(data)}`);
      return data; // Return the successful response data
    } else {
      const errorText = await response.text();
      logError(`Failed to get response. Status code: ${response.status}, Error: ${errorText}`);
      return null; // Return null or throw an error to indicate failure
    }
  } catch (error) {
    logError(`An error occurred while making the request: ${error}`);
    return null; // Return null or throw an error to indicate an unexpected error
  }
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
