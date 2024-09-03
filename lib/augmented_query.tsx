


import axios, { AxiosResponse } from 'axios';

// Logger utility
const logger = {
  debug: (message: string, ...args: any[]) => console.log(`[DEBUG] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
};

// Define the semantic search function
export const semanticSearch = async (query: string): Promise<any> => {
  // Encode the query string
  const encodedQuery = encodeURIComponent(query);

  // Construct the URL
  const url = `https://graph-rag.onrender.com/semanticsearch/${encodedQuery}`;
  // Alternative URLs for different environments
  // const url = `https://serverless-v1.vercel.app/semanticsearch/${encodedQuery}`;
  // const url = `http://localhost:8080/semanticsearch/${encodedQuery}`;

  // Set the headers
  const headers = {
    'Content-Type': 'application/json'
  };

  try {
    // Execute the GET request
    const response: AxiosResponse<any> = await axios.get(url, { headers });

    // Check if the request was successful
    if (response.status === 200) {
      if (response.data) {
        logger.debug('Response:', response.data);
        return response.data;
      } else {
        logger.error('Error: Received empty response from the server.');
        return null;
      }
    } else {
      logger.error(`Error: Received status code ${response.status}`);
      logger.debug('Response content:', response.data);
      return null;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error('Axios error occurred:', error.message);
    } else {
      logger.error('An unexpected error occurred:', error);
    }
    return null;
  }
};
