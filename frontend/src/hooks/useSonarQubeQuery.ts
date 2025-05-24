import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = 'http://localhost:4000'; // Make sure this is your Go backend URL

// Simplified SonarQube Issue and Data structures. Adapt based on actual SonarQube API response.
export interface SonarQubeIssue {
    key: string;
    rule: string;
    severity: string;
    component: string; // e.g., "projectKey:src/main/java/com/example/MyClass.java"
    project: string;
    line?: number;
    message: string;
    status: string;
    creationDate: string;
    type: string; // e.g., "CODE_SMELL", "BUG", "VULNERABILITY"
    // Add other fields you need from the SonarQube issues API
}

export interface SonarQubePaging {
    pageIndex: number;
    pageSize: number;
    total: number;
}

export interface SonarQubeApiResponse {
    total: number;
    p: number; // page number
    ps: number; // page size
    paging?: SonarQubePaging; // More detailed paging info might be nested
    issues: SonarQubeIssue[];
    // components, rules, users if included in response
}

async function fetchSonarQubeData(detektScanId: string | null): Promise<SonarQubeApiResponse> {
    if (!detektScanId) {
        // This case should be prevented by the `enabled` flag in useQuery
        throw new Error("DetektScanId is null, cannot fetch SonarQube data.");
    }
    const url = `${API_BASE_URL}/api/scan/${detektScanId}/sonarqube`;
    console.log(`[useSonarQubeQuery] Attempting to fetch SonarQube data from: ${url}`);

    const response = await fetch(url, {
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
        },
    });

    const responseBodyText = await response.text(); // Read as text first for better error diagnosis

    if (!response.ok) {
        let errorMessage = `Failed to fetch SonarQube data (HTTP ${response.status}) from ${url}`;
        try {
            const errorData = JSON.parse(responseBodyText);
            errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
            // If parsing errorData as JSON fails, use a snippet of the text
            errorMessage = `Failed to fetch SonarQube data (HTTP ${response.status}) from ${url}: ${responseBodyText.substring(0, 200)}`;
        }
        console.error("[useSonarQubeQuery] Error:", errorMessage);
        if (response.status === 401) {
            throw new Error('401: Not authenticated. Please login.');
        }
        if (response.status === 404) {
            throw new Error('404: SonarQube data not found for this scan.');
        }
        throw new Error(errorMessage);
    }

    try {
        const data = JSON.parse(responseBodyText);
        console.log('[useSonarQubeQuery] Successfully fetched SonarQube data:', data);
        // Add Zod validation here if you want to be stricter about the response structure
        return data as SonarQubeApiResponse;
    } catch (e) {
        console.error('[useSonarQubeQuery] Failed to parse SonarQube JSON response:', e, "Raw text:", responseBodyText);
        throw new Error("Failed to parse SonarQube data from server.");
    }
}

export function useSonarQubeQuery(detektScanId: string | null) {
    return useQuery<SonarQubeApiResponse, Error>({
        queryKey: ['sonarQubeData', detektScanId], // Unique key for this query
        queryFn: () => fetchSonarQubeData(detektScanId),
        enabled: !!detektScanId, // Query will only run if detektScanId is truthy
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    });
}