import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = 'http://localhost:4000';

async function fetchScanXML(scanId: string | null): Promise<string> {
  if (!scanId) throw new Error("No scan selected.");
  const url = `${API_BASE_URL}/api/scan/${scanId}`;

  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Accept': 'application/xml',
    },
  });

  if (!response.ok) {
    let errorText = await response.text();
    let message = `Failed to fetch Detekt XML (HTTP ${response.status})`;
    try {
      // Try to extract error from JSON if possible
      const errorData = JSON.parse(errorText);
      message = errorData.error || errorData.message || message;
    } catch {
      message = errorText.substring(0, 200) || message;
    }
    if (response.status === 401) {
      throw new Error('401: Not authenticated. Please login.');
    }
    throw new Error(message);
  }

  const xmlText = await response.text();
  console.log('[useScanXMLQuery] Fetched XML length:', xmlText.length);
  return xmlText;
}

export function useScanXMLQuery(scanId: string | null) {
  return useQuery<string, Error>({
    queryKey: ['scanXML', scanId],
    queryFn: () => fetchScanXML(scanId),
    enabled: !!scanId,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}
