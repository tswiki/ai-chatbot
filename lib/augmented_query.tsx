import axios from 'axios';

const interactiveSessionTool = async (
  sessionId: string,
  query: string,
  maxRetries: number = 3
): Promise<{ response: string; detailedResponse?: string } | { error: string }> => {
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

      // Check if the response status is 200 (OK)
      if (response.status === 200) {
        // Log the full response for debugging
        console.log('Full server response:', response.data);

        // Parse the response data
        const responseData = response.data;

        // Check if 'response' exists in responseData
        if (responseData && responseData.response) {
          const output = responseData.response.output; // Access the 'output' field

          // Check for iteration limit in the output
          if (typeof output === 'string' && output.includes('iteration limit')) {
            console.warn(
              `Agent hit iteration limit. Attempt ${attempt} of ${maxRetries}. Retrying...`
            );
            if (attempt < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 1000)); // Delay before retrying
              continue; // Retry the request
            } else {
              return { response: 'Error: Maximum retries reached. Could not process the query.' };
            }
          }

          // Return the output and the detailed response
          return {
            response: output,
            detailedResponse: JSON.stringify(responseData, null, 2),
          };
        } else if (responseData && responseData.error) {
          console.error(`Error from server: ${responseData.error}`);
          return { response: `Error: ${responseData.error}` };
        } else {
          // Handle unexpected response format
          console.error('Unexpected response format from server:', responseData);
          return { response: 'Unexpected response format from server.' };
        }
      } else {
        // If the server returned an error status code
        console.error(`Error: Received status code ${response.status}`);
        return { response: `Error: Server returned status code ${response.status}` };
      }
    } catch (error: any) {
      console.error(
        `An error occurred: ${error.message || 'Failed to make the HTTP request.'}`
      );
      if (attempt === maxRetries) {
        return { response: 'Error: Maximum retries reached. Could not process the query.' };
      }
    }
  }

  // If the loop finishes without a valid response, return an error
  return { response: 'Error: Unexpected failure in processing the query.' };
};

export { interactiveSessionTool };
