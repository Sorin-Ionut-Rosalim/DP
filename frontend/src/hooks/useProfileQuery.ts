import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// Schema matches: { id: string, username: string }
const userResponseSchema = z.object({
  id: z.string(),
  username: z.string(),
});

export type User = z.infer<typeof userResponseSchema>;

async function fetchProfile(): Promise<User> {
  const response = await fetch('http://localhost:4000/api/profile', {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const status = response.status;
    const message = errorData.error || errorData.message || `Failed to fetch profile (HTTP ${status})`;
    
    // Special handling for 401 errors
    if (status === 401) {
      throw new Error('401: Not authenticated');
    }
    throw new Error(message);
  }

  const data = await response.json();
  console.log('Profile API Response:', data); // For debugging
  
  try {
    return userResponseSchema.parse(data);
  } catch (validationError) {
    console.error('Validation failed:', validationError);
    throw new Error('Invalid profile data structure');
  }
}

export function useProfileQuery() {
  return useQuery<User, Error>({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    retry: (failureCount, error) => {
      // Don't retry for 401 errors
      if (error.message.startsWith('401:')) return false;
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
}