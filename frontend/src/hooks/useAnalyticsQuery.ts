import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// --- Zod Schemas to validate the backend response ---

const TrendDataSchema = z.object({
  scan_id: z.string(),
  detected_at: z.string().transform((date) => new Date(date)),
  maintainability_rating: z.number().nullable(),
  cognitive_complexity: z.number().nullable(),
  lines_of_code: z.number().nullable(),
  total_detekt_issues: z.number(),
  total_sonar_issues: z.number(),
  blocker_issues: z.number(),
  critical_issues: z.number(),
  major_issues: z.number(),
});

const RuleBreakdownSchema = z.object({
  rule_name: z.string(),
  issue_count: z.number(),
});

const FileBreakdownSchema = z.object({
  file_name: z.string(),
  issue_count: z.number(),
});

const LatestScanDistributionSchema = z.object({
  bugs: z.number(),
  vulnerabilities: z.number(),
  code_smells: z.number(),
});

const LatestDetektDistributionSchema = z.object({
  errors: z.number(),
  warnings: z.number(),
  infos: z.number(),
});

const AnalyticsResponseSchema = z.object({
  trend_data: z.array(TrendDataSchema).nullable().transform(val => val ?? []),
  latest_scan_data: LatestScanDistributionSchema,
  latest_detekt_distribution: LatestDetektDistributionSchema,
  latest_sonar_rules: z.array(RuleBreakdownSchema).nullable().transform(val => val ?? []),
  latest_detekt_rules: z.array(RuleBreakdownSchema).nullable().transform(val => val ?? []),
  latest_noisy_files: z.array(FileBreakdownSchema).nullable().transform(val => val ?? []),
});

export type AnalyticsData = z.infer<typeof AnalyticsResponseSchema>;

// --- Fetch Function ---

async function fetchAnalyticsData(projectId: string | null): Promise<AnalyticsData | null> {
  if (!projectId) return null;

  const response = await fetch(`http://localhost:4000/api/projects/${projectId}/analytics`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch analytics data (HTTP ${response.status})`);
  }

  const data = await response.json();

  // Validate the data structure against our schema
  const parsed = AnalyticsResponseSchema.safeParse(data);
  if (!parsed.success) {
    console.error("Zod validation failed for analytics data:", parsed.error);
    throw new Error("Invalid analytics data structure received from server.");
  }

  return parsed.data;
}

// --- TanStack Query Hook ---

export function useAnalyticsQuery(projectId: string | null) {
  return useQuery({
    queryKey: ['analytics', projectId],
    queryFn: () => fetchAnalyticsData(projectId),
    enabled: !!projectId, // Only run the query if a projectId is provided
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
  });
}
