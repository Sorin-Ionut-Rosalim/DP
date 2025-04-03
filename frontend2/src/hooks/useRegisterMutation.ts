import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

// 1) Define the request body (variables) and response types
interface RegisterVariables {
    username: string;
    password: string;
  }
  
  
const registerResponseSchema = z.object({
    message: z.string(),
});

// 2) The actual fetch call
async function registerUser({ username, password }: RegisterVariables) {
    const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Registration failed.');
}

// success
return registerResponseSchema.parse(await response.json());
}

// 3) The mutation hook
export function useRegisterMutation(){
    const navigate = useNavigate();
    
    return useMutation({
        mutationFn: registerUser,
        onSuccess: () => {
            navigate('/login');
        },
        onError: (err) => {
            console.error('Register error:', err.message);
        },
    });
}