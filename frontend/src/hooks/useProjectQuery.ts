import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

const projectSchema = z.object({
  id: z.string().uuid({ message: "Invalid project ID format (must be a UUID)" }),
  lastScan: z.string().datetime({ offset: true, message: "Invalid lastScan date format (must be ISO 8601 with offset)" }).nullable(),
  name: z.string().min(1, "Project name cannot be empty"),
  url: z.string().url({ message: "Invalid project URL format" }),
  user_id: z.string().uuid({ message: "Invalid user_id format (must be a UUID)" }),
});

const projectsResponseSchema = z.object({
  projects: z.array(projectSchema).nullable().transform(p => p ?? []),
  totalScans: z.number().int().nonnegative()
});

export type Project = z.infer<typeof projectSchema>;
export type ProjectsResponse = z.infer<typeof projectsResponseSchema>;
// --- End of Zod Schemas and Types ---

async function fetchProjects(): Promise<ProjectsResponse> {
  const projectsApiUrl = `http://localhost:4000/api/projects`;
  console.log(`[useProjectQuery] Attempting to fetch ${projectsApiUrl}...`);

  const response = await fetch(projectsApiUrl, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  const responseBodyText = await response.text();

  if (!response.ok) {
    let errorMessage = `Failed to fetch projects from ${projectsApiUrl} (HTTP ${response.status})`;
    try {
      const errorData = JSON.parse(responseBodyText);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (e) {
      errorMessage = `Failed to fetch projects from ${projectsApiUrl} (HTTP ${response.status}): ${responseBodyText.substring(0, 200)}`;
    }
    console.error("[useProjectQuery] Error fetching projects:", errorMessage, { status: response.status });
    if (response.status === 401) {
      throw new Error(`401: Not authenticated at ${projectsApiUrl}. Please ensure you are logged in.`);
    }
    // Handle potential CORS errors more explicitly if they occur
    if (response.status === 0 || (response.type === 'opaque' || response.type === 'opaqueredirect')) {
      console.error(`[useProjectQuery] Network Error or CORS issue trying to reach ${projectsApiUrl}. Ensure backend CORS is configured if domains/ports differ.`);
      throw new Error(`Network Error or CORS issue when fetching projects. Backend at ${projectsApiUrl} might not be reachable or CORS is misconfigured.`);
    }
    throw new Error(errorMessage);
  }

  try {
    const data = JSON.parse(responseBodyText);
    console.log(`[useProjectQuery] Raw API Response from ${projectsApiUrl} (before Zod parsing):`, data);

    const parsedData = projectsResponseSchema.parse(data);
    console.log('[useProjectQuery] Successfully parsed projects data:', parsedData.projects.length, "projects found.");
    return parsedData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[useProjectQuery] Zod Validation failed for data from ${projectsApiUrl}:`, error.issues);
      try {
        console.error('[useProjectQuery] Data that failed Zod validation:', JSON.parse(responseBodyText));
      } catch {
        console.error('[useProjectQuery] Data that failed Zod validation (raw text):', responseBodyText);
      }
      throw new Error('Invalid projects data structure received from server. Check console for Zod error details.');
    }
    console.error('[useProjectQuery] Error parsing projects JSON or other unexpected error:', error);
    throw new Error('Failed to process projects data from server.');
  }
}

export function useProjectQuery() {
  return useQuery<ProjectsResponse, Error>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    retry: (failureCount, error) => {
      if (error.message.startsWith('401:') || error.message.includes("CORS")) return false;
      return failureCount < 2;
    },
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });
}