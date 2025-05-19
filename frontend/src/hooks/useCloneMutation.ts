import { useMutation } from '@tanstack/react-query';

interface CloneRequest {
  repoUrl: string;
}

interface CloneResponse {
  message: string;
  path?: string;
  error?: string;
}

export const useCloneMutation = () => {
  return useMutation<CloneResponse, Error, CloneRequest>({
    mutationFn: async ({ repoUrl }) => {
      const response = await fetch('http://localhost:4000/api/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ repoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Clone failed');
      }

      const xml = await response.text();
      return { message: xml };
    },
  });
};