import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

// Define the structure for the registration request
interface RegisterVariables {
    username: string;
    password: string;
}

// Define the expected response schema from the server
const registerResponseSchema = z.object({
    message: z.string(),
});

// The async function that performs the API call
async function registerUser({ username, password }: RegisterVariables) {
    const response = await fetch('http://localhost:4000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        // Parse the error message from the server's JSON response
        const errorData = await response.json();
        // Throw an error that the mutation hook can catch
        throw new Error(errorData.error || 'Registration failed due to an unknown error.');
    }

    return registerResponseSchema.parse(await response.json());
}

/**
 * A custom TanStack Query mutation hook for handling user registration.
 * On success, it automatically navigates the user to the login page.
 * It provides loading and error states to the component using it.
 */
export function useRegisterMutation() {
    const navigate = useNavigate();

    return useMutation<unknown, Error, RegisterVariables>({
        mutationFn: registerUser,
        onSuccess: () => {
            // On successful registration, redirect to the login page
            navigate('/login');
        },
        onError: (err) => {
            // Log the full error for debugging, but the component will show err.message
            console.error('Register mutation error:', err);
        },
    });
}