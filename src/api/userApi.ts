import axios from 'axios';
import API_BASE_URL from '../config';

const API_URL = import.meta.env.VITE_API_URL || API_BASE_URL;

export const getOnlineUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/profile/online`);
    return response.data;
  } catch (error) {
    console.error('Error fetching online users:', error);
    throw error;
  }
};