import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

const logoutUser = async () => {
  const response = await fetch('/api/logout', {
    method: 'POST',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Logout failed');
  }
  return response.json();
};

export const useLogoutMutation = () => {
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      navigate('/login');
    },
    onError: (error) => {
      console.error('Logout error:', error);
    }
  });
};