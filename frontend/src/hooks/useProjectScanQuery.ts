import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

const scanSchema = z.object({
  id: z.string().uuid({ message: "Invalid scan ID format (must be UUID)" }),
  detectedAt: z.string().datetime({ offset: true, message: "Invalid scan detectedAt date format (ISO 8601 with offset)" }),
});

const scansResponseSchema = z.object({
  scans: z.array(scanSchema)
});

export type Scan = z.infer<typeof scanSchema>;
export type ScansResponse = z.infer<typeof scansResponseSchema>;

const API_BASE_URL = 'http://localhost:4000';

async function fetchScans(projectId: string | null): Promise<ScansResponse> {
  if (!projectId) throw new Error("No project selected.");
  const url = `${API_BASE_URL}/api/project/${projectId}/scans`;

  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  const responseBodyText = await response.text();

  if (!response.ok) {
    let errorMessage = `Failed to fetch scans (HTTP ${response.status})`;
    try {
      const errorData = JSON.parse(responseBodyText);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      errorMessage = `Failed to fetch scans: ${responseBodyText.substring(0, 200)}`;
    }
    if (response.status === 401) {
      throw new Error('401: Not authenticated. Please login.');
    }
    throw new Error(errorMessage);
  }

  try {
    const data = JSON.parse(responseBodyText);
    console.log('[useProjectScanQuery] API Response:', data);
    const parsedData = scansResponseSchema.parse(data);
    console.log('[useProjectScanQuery] Parsed scans:', parsedData.scans.length);
    return parsedData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[useProjectScanQuery] Zod validation failed:', error.issues);
      throw new Error('Invalid scans data structure received from server.');
    }
    throw new Error('Failed to process scans data from server.');
  }
}

export function useProjectScanQuery(projectId: string | null) {
  return useQuery<ScansResponse, Error>({
    queryKey: ['projectScans', projectId],
    queryFn: () => fetchScans(projectId),
    enabled: !!projectId, // Only run if projectId exists
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}
