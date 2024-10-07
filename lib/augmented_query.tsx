

import axios from 'axios';

const interactiveSessionTool = async (
  sessionId: string,
  query: string,
  maxRetries: number = 3
): Promise<{ response: string } | { error: string }> => {
  // Define the URL for the Axios request
  const url = 'https://agentic-rag-m21c.onrender.com/interactive-session';

  // Construct the payload for the POST request
  const payload = {
    session_id: sessionId,
    user_query: query,
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Make the POST request using axios
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Log the full response for debugging
      console.log('Full server response:', response.data);

      // Handle the response data
      if (response.data && response.data.response) {
        const output = response.data.response.output; // Access the 'output' field

        // Check for iteration limit in the response
        if (typeof output === 'string' && output.includes('iteration limit')) {
          console.warn(`Agent hit iteration limit. Attempt ${attempt} of ${maxRetries}. Retrying...`);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Delay before retrying
            continue; // Retry the request
          } else {
            return { response: 'Error: Maximum retries reached. Could not process the query.' };
          }
        }

        // Return both the general response and a more detailed response for use in visual format
        return { response: output, detailedResponse: JSON.stringify(response.data, null, 2) };
      } else if (response.data && response.data.error) {
        console.error(`Error from server: ${response.data.error}`);
        return { response: `Error: ${response.data.error}` };
      }

      return { response: 'Unexpected response format from server.' };
    } catch (error: any) {
      console.error(`An error occurred: ${error.message || 'Failed to make the HTTP request.'}`);
      if (attempt === maxRetries) {
        return { response: 'Error: Maximum retries reached. Could not process the query.' };
      }
    }
  }

  // If the loop finishes without a valid response, return an error
  return { response: 'Error: Unexpected failure in processing the query.' };
};

export { interactiveSessionTool };
