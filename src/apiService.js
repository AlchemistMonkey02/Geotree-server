import axios from 'axios';

const API_URL = 'http://localhost:5000/routes'; // Updated to local server

export const getAllRoutes = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data; // Adjust based on the actual response structure
    } catch (error) {
        console.error('Error fetching routes:', error);
        throw error; // Handle error appropriately
    }
}; 