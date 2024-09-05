
import { v4 as uuidv4, validate as uuidValidate, version as uuidVersion } from 'uuid';

// Logging function for debugging purposes
const logDebug = (message: string) => {
  console.debug(`${new Date().toISOString()} - DEBUG - ${message}`);
};

const logError = (message: string) => {
  console.error(`${new Date().toISOString()} - ERROR - ${message}`);
};

/**
 * Function to check if a given value is a valid UUID.
 * If the value is invalid, a new random UUID is generated and returned.
 */
const isValidUUID = (value: string): string => {
  try {
    // Ensure the value is a string before attempting to validate it
    if (typeof value !== 'string') {
      value = String(value);
    }

    // Validate the UUID and check its version
    if (uuidValidate(value) && uuidVersion(value) === 4) {
      logDebug(`Valid UUID provided: ${value}`);
      return value;  // Return the valid UUID as a string
    } else {
      throw new Error('Invalid UUID');
    }
  } catch (error) {
    // If an error is raised, it means the value is not a valid UUID
    const newUUID = uuidv4();  // Generate a new random UUID
    logDebug(`Invalid UUID detected. Generated new UUID: ${newUUID}`);
    return newUUID;  // Return the new UUID as a string
  }
};

/**
 * Function to make a POST request to the FastAPI endpoint.
 * If the session_id is invalid, a new random UUID is generated.
 */
export const interactiveSession = async (sessionId: string, query: string): Promise<void> => {
  // Validate or generate a new UUID
  const validSessionId = isValidUUID(sessionId);

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
    } else {
      const errorText = await response.text();
      logError(`Failed to get response. Status code: ${response.status}, Error: ${errorText}`);
    }
  } catch (error) {
    logError(`An error occurred while making the request: ${error}`);
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
