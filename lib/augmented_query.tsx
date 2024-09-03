
import axios from 'axios';


export const semantic_search = async (query: string ) => {
    
    // Logger for structured logging
    const logger = {
        debug: (message: string, ...args: any[]) => console.log(`[DEBUG] ${message}`, ...args),
        error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
    };

    // Encode the query string
    const encodedQuery = encodeURIComponent(query);

    // Construct the URL
    const url = f"https://graph-rag.onrender.com//semanticsearch/{encoded_query}";


    // Set the headers
    const headers = {
        'Content-Type': 'application/json',
    };

    try {
        // Execute the GET request
        const response = await axios.get(url, { headers });

        // Check if the request was successful
        if (response.status === 200) {
            if (response.data) {
                logger.debug('Response:', response.data);
                return {
                    query,
                    data: response.data,
                };
            } else {
                logger.error('Error: Received empty response from the server.');
                return {
                    query,
                    error: 'Received empty response',
                };
            }
        } else {
            logger.error(`Error: Received status code ${response.status}`);
            logger.debug('Response content:', response.data);
            return {
                query,
                error: `Received status code ${response.status}`,
                responseContent: response.data,
            };
        }
    } catch (error) {
        logger.error('An error occurred:', error);
        return {
            query,
            error: 'An error occurred during the request',
        };
    }
};


export const upload_creator_endpoint = async (creator: string ) => {
    
    // Logger for structured logging
    const logger = {
        debug: (message: string, ...args: any[]) => console.log(`[DEBUG] ${message}`, ...args),
        error: (message: string, ...args: any[]) => console.error(`[ERROR] ${message}`, ...args),
    };

    // Encode the query string

    // Construct the URL
    const url = `http://backend:8000/api/data/`;

    // Set the headers
    const headers = {
        'Content-Type': 'application/json',
    };

    try {
        // Execute the GET request
        const response = await axios.get(url, { headers });

        // Check if the request was successful
        if (response.status === 200) {
            if (response.data) {
                logger.debug('Response:', response.data);
                return {
                    creator,
                    data: response.data,
                };
            } else {
                logger.error('Error: Received empty response from the server.');
                return {
                    creator,
                    error: 'Received empty response',
                };
            }
        } else {
            logger.error(`Error: Received status code ${response.status}`);
            logger.debug('Response content:', response.data);
            return {
                creator,
                error: `Received status code ${response.status}`,
                responseContent: response.data,
            };
        }
    } catch (error) {
        logger.error('An error occurred:', error);
        return {
            creator,
            error: 'An error occurred during the request',
        };
    }
};