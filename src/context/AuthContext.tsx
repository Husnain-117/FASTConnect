import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

interface ApiResponse {
  type?: string;
  message?: string;
  redirect?: boolean;
  data?: any;
}

interface AuthContextType {
  user: any | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, campus: string, batch: string) => Promise<void>;
  sendOTP: (email: string) => Promise<ApiResponse>;
  verifyAndRegister: (email: string, otp: string, password: string, name: string, campus: string, batch: string) => Promise<ApiResponse>;
  forgotPassword: (email: string) => Promise<ApiResponse>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<ApiResponse>;
  logout: () => void;
  userId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // Fetch user data
      axiosInstance.get('/auth/me')
        .then(response => {
          setUser(response.data.user);
        })
        .catch(error => {
          console.error('Error fetching user data:', error);
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('Attempting login for:', email);
      const response = await axiosInstance.post('/auth/login', { email, password });
      const { token, user } = response.data;
      console.log('Login successful, user ID:', user._id);
      // Store auth data
      localStorage.setItem('token', token);
      if (user && (user._id || user.id)) {
        localStorage.setItem('userId', String(user._id || user.id));
      }
      setToken(token);
      setUser(user);
      // Update connection status
      try {
        console.log('Updating connection status to online...');
        const statusResponse = await axiosInstance.post('/profile/connect', {});
        console.log('Connection status updated:', statusResponse.data);
      } catch (error) {
        console.error('Error updating connection status:', error);
        // Don't fail login if this fails
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, campus: string, batch: string) => {
    try {
      await axiosInstance.post('/auth/send-otp', { email });
      // After OTP is sent, user will need to verify and complete registration
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const sendOTP = async (email: string): Promise<ApiResponse> => {
    try {
      const response = await axiosInstance.post('/auth/send-otp', { email });
      return response.data;
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  };

  const verifyAndRegister = async (email: string, otp: string, password: string, name: string, campus: string, batch: string) => {
    try {
      const response = await axiosInstance.post('/auth/verify-and-register', {
        email,
        otp,
        password,
        name,
        campus,
        batch
      });
      if (response.data.redirect) {
        navigate('/login');
      }
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.message || 'An error occurred during registration');
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const response = await axiosInstance.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'An error occurred while sending OTP');
    }
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    try {
      const response = await axiosInstance.post('/auth/reset-password', {
        email,
        otp,
        newPassword
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'An error occurred while resetting password');
    }
  };

  const logout = async () => {
    const currentToken = token || localStorage.getItem('token');
    console.log('Starting logout process...');
    console.log('Current token exists:', !!currentToken);
    try {
      // First update connection status
      if (currentToken) {
        try {
          console.log('Updating connection status to offline...');
          await axiosInstance.post('/profile/disconnect', {});
          console.log('Successfully updated connection status to offline');
        } catch (error) {
          console.error('Error updating connection status:', error);
          // Continue with logout even if this fails
        }
      }
      // Then call backend logout
      if (currentToken) {
        try {
          console.log('Calling backend logout endpoint...');
          await axiosInstance.post('/auth/logout', {});
        } catch (error) {
          console.error('Error calling backend logout endpoint:', error);
        }
      }
      // Clear local storage and state
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      setToken(null);
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      register,
      sendOTP,
      verifyAndRegister,
      forgotPassword,
      resetPassword,
      logout,
      userId: user?._id
        ? String(user._id)
        : user?.id
          ? String(user.id)
          : (localStorage.getItem('userId') && localStorage.getItem('userId') !== 'undefined'
              ? localStorage.getItem('userId')
              : null)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};