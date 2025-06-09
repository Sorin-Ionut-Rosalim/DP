import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Define the structure for the login request
interface LoginVariables {
    username: string;
    password: string;
}

// Define the expected response schema from the server
const loginResponseSchema = z.object({
    message: z.string(),
});

// The async function that performs the API call
async function loginUser({ username, password }: LoginVariables) {
    const response = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        // If the response is not OK, parse the error message from the body
        const errorData = await response.json();
        // Throw an error that the mutation hook can catch
        throw new Error(errorData.error || 'Login failed due to an unknown error.');
    }

    return loginResponseSchema.parse(await response.json());
}

/**
 * A custom TanStack Query mutation hook for handling user login.
 * On success, it updates the authentication state and navigates to the home page.
 * It also provides loading and error states to the component using it.
 */
export function useLoginMutation() {
    const { setIsAuthenticated } = useAuth();
    const navigate = useNavigate();

    return useMutation<unknown, Error, LoginVariables>({
        mutationFn: loginUser,
        onSuccess: () => {
            // On successful login, update the global auth state and redirect
            setIsAuthenticated(true);
            navigate('/home');
        },
        onError: (error) => {
            // Optional: Log the error for debugging purposes.
            // The component will handle displaying the error message to the user.
            console.error('Error during login mutation:', error);
        }
    });
}