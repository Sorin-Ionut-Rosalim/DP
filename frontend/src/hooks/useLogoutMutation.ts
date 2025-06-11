import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const logoutUser = async () => {
  const response = await fetch('http://localhost:4000/api/logout', {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Logout failed');
  }
  return response.json();
};

export const useLogoutMutation = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setIsAuthenticated } = useAuth();

  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      setIsAuthenticated(false);

      queryClient.clear();

      navigate('/login');
    },
    onError: (error) => {
      console.error('Logout error:', error);
      setIsAuthenticated(false);
      queryClient.clear();
      navigate('/login');
    }
  });
};