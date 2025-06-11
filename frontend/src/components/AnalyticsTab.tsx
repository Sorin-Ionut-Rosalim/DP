import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAnalyticsQuery } from "../hooks/useAnalyticsQuery";
import "./AnalyticsTab.css";

interface AnalyticsTabProps {
  projectId: string;
}

// --- Helper Components & Constants ---

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{`${label}`}</p>
        {payload.map((pld: any, index: number) => (
          <p
            key={index}
            style={{ color: pld.color }}
          >{`${pld.name}: ${pld.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

const NoDataMessage = ({ message }: { message: string }) => (
  <div className="no-data-msg">{message}</div>
);

const TYPE_COLORS = ["#d9534f", "#f0ad4e", "#5cb85c"]; 

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ projectId }) => {
  const { data, isLoading, error } = useAnalyticsQuery(projectId);

  if (isLoading)
    return <div className="analytics-status">Loading analytics data...</div>;
  if (error)
    return <div className="analytics-status error">Error: {error.message}</div>;
  if (!data || !data.trend_data || data.trend_data.length === 0) {
    return (
      <div className="analytics-status">
        No scan data available for this project.
      </div>
    );
  }

  const {
    trend_data,
    latest_scan_data,
    latest_sonar_rules,
    latest_detekt_rules,
    latest_noisy_files,
  } = data;

  // --- Prepare Data for Charts ---
  const issueNumberTrendData = trend_data.map((d, i) => ({
    name: `Scan ${i + 1}`,
    "SonarQube Issues": d.total_sonar_issues,
    "Detekt Issues": d.total_detekt_issues,
  }));

  const severityTrendData = trend_data.map((d, i) => ({
    name: `Scan ${i + 1}`,
    Blocker: d.blocker_issues,
    Critical: d.critical_issues,
    Major: d.major_issues,
  }));

  const issueTypeData = [
    { name: "Bugs", value: latest_scan_data.bugs },
    { name: "Vulnerabilities", value: latest_scan_data.vulnerabilities },
    { name: "Code Smells", value: latest_scan_data.code_smells },
  ].filter((d) => d.value > 0);

  return (
    <div className="analytics-container">
      <div className="analytics-grid">
        <div className="analytics-card full-width">
          <h3 className="analytics-title">Issue Number Trend</h3>
          {trend_data.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={issueNumberTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="SonarQube Issues"
                  stroke="#82ca9d"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="Detekt Issues"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <NoDataMessage message="At least two scans are required to show trend data." />
          )}
        </div>

        <div className="analytics-card full-width">
          <h3 className="analytics-title">SonarQube Issue Composition Trend</h3>
          {trend_data.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={severityTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Blocker" stackId="a" fill="#b91c1c" />
                <Bar dataKey="Critical" stackId="a" fill="#d9534f" />
                <Bar dataKey="Major" stackId="a" fill="#f0ad4e" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoDataMessage message="At least two scans are required to show trend data." />
          )}
        </div>

        <div className="analytics-card">
          <h3 className="analytics-title">Top 5 Violated SonarQube Rules</h3>
          {latest_sonar_rules.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={latest_sonar_rules}
                layout="vertical"
                margin={{ left: 150 }}
              >
                <XAxis type="number" />
                <YAxis
                  dataKey="rule_name"
                  type="category"
                  width={150}
                  tick={{ fontSize: 12 }}
                  interval={0}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="issue_count" name="Violations" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoDataMessage message="No SonarQube rules data for this scan." />
          )}
        </div>

        <div className="analytics-card">
          <h3 className="analytics-title">Top 5 Violated Detekt Rules</h3>
          {latest_detekt_rules.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={latest_detekt_rules}
                layout="vertical"
                margin={{ left: 150 }}
              >
                <XAxis type="number" />
                <YAxis
                  dataKey="rule_name"
                  type="category"
                  width={150}
                  tick={{ fontSize: 12 }}
                  interval={0}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="issue_count" name="Violations" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoDataMessage message="No Detekt rules data for this scan." />
          )}
        </div>

        <div className="analytics-card">
          <h3 className="analytics-title">Latest Scan Issue Types (Sonar)</h3>
          {issueTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={issueTypeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  label
                >
                  {issueTypeData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={TYPE_COLORS[index % TYPE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <NoDataMessage message="No issue type data for this scan." />
          )}
        </div>

        <div className="analytics-card">
          <h3 className="analytics-title">Top 5 Noisiest Files (Sonar)</h3>
          {latest_noisy_files.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={latest_noisy_files}
                layout="vertical"
                margin={{ left: 150 }}
              >
                <XAxis type="number" />
                <YAxis
                  dataKey="file_name"
                  type="category"
                  width={150}
                  tick={{ fontSize: 12 }}
                  interval={0}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="issue_count" name="Issues" fill="#5bc0de" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoDataMessage message="No file data for this scan." />
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
