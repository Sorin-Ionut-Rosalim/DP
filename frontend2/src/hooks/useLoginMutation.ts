import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuth } from '../pages/Login';
import { useNavigate } from 'react-router-dom';

interface LoginVariables {
    username: string;
    password: string;
}

const loginResponseSchema = z.object({
    message: z.string(),
});

// type LoginResponse = z.infer<typeof loginResponseSchema>

async function loginUser({ username, password }: LoginVariables) {
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
    }

    return loginResponseSchema.parse(await response.json());
}

export function useLoginMutation() {
    const {setIsAuthenticated} = useAuth();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: loginUser,
        onSuccess: () => {
            setIsAuthenticated(true);
            navigate('/home');
        },
        onError: (error) => {
            console.error('Error during login:', error);
        } 
    });
  }