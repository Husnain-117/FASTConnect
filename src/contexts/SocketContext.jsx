import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config/apiBaseUrl';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {

    // Get userId from user object or localStorage
    const userId = user?._id || user?.id || localStorage.getItem('userId');
    if (!userId) {
      return;
    }

    // Initialize socket connection with HTTPS
    const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : 'https://192.168.1.15:5000';
      
    const newSocket = io(SOCKET_SERVER_URL, {
      query: { userId },
      withCredentials: true,
      secure: true,
      transports: ['websocket'],
    });
    
    setSocket(newSocket);

    // Set up event listeners
    newSocket.on('user_online', ({ userId }) => {
      setOnlineUsers(prev => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
    });

    newSocket.on('user_offline', ({ userId }) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });

    // Clean up on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user]);

  const value = {
    socket,
    onlineUsers,
    isOnline: (userId) => onlineUsers.includes(userId),
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
