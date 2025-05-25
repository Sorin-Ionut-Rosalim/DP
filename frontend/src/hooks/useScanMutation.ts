import { useMutation } from '@tanstack/react-query';

interface ScanRequest {
  repoUrl: string;
}

interface ScanResponse {
  scanId: string;
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
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = {};
        }
        throw new Error(errorData.error || 'Scan failed');
      }

      const data = await response.json();
      if (!data.scanId) throw new Error("No scanId returned from scan API");
      return { scanId: data.scanId };
    },
  });
};
