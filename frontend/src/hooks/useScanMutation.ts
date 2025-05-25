import { useMutation } from '@tanstack/react-query';

interface ScanRequest {
  repoUrl: string;
}

interface ScanResponse {
  message: string;
  path?: string;
  error?: string;
}

export const useScanMutation = () => {
  return useMutation<ScanResponse, Error, ScanRequest>({
    mutationFn: async ({ repoUrl }) => {
      const response = await fetch('http://localhost:4000/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ repoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Scan failed');
      }

      const xml = await response.text();
      return { message: xml };
    },
  });
};