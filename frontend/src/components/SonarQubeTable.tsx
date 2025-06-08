import React from 'react';
import { SonarQubeApiResponse, SonarQubeIssue } from '../hooks/useSonarQubeQuery';

interface SonarQubeTableProps {
  sonarData: SonarQubeApiResponse | undefined;
}

const SonarQubeTable: React.FC<SonarQubeTableProps> = ({ sonarData }) => {
  if (!sonarData) {
    return <div>Loading SonarQube data or data not available...</div>;
  }

  if (!sonarData.issues || sonarData.issues.length === 0) {
    return <div>No SonarQube issues found for this analysis.</div>;
  }

  // Extract file path from component string
  const getFileName = (componentPath: string): string => {
    if (!componentPath) return 'N/A';
    const parts = componentPath.split(':');
    return parts.length > 1 ? parts.slice(1).join(':') : componentPath;
  };

  return (
    <div className="results-card" style={{ marginTop: 0 }}>
      <table className="results-table">
        <thead>
          <tr>
            <th style={{ minWidth: 210 }}>File</th>
            <th style={{ minWidth: 55 }}>Line</th>
            <th style={{ minWidth: 120 }}>Rule</th>
            <th style={{ minWidth: 85 }}>Severity</th>
            <th style={{ minWidth: 85 }}>Type</th>
            <th style={{ minWidth: 220 }}>Message</th>
          </tr>
        </thead>
        <tbody>
          {sonarData.issues.map((issue: SonarQubeIssue, idx: number) => (
            <tr key={issue.key || idx}>
              <td style={{ wordBreak: 'break-all' }}>{getFileName(issue.component)}</td>
              <td>{issue.line || ''}</td>
              <td>{issue.rule}</td>
              <td>{issue.severity}</td>
              <td>{issue.type}</td>
              <td style={{ whiteSpace: 'pre-wrap', minWidth: 220 }}>{issue.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SonarQubeTable;