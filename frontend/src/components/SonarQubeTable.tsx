import React from 'react';
import { SonarQubeApiResponse, SonarQubeIssue } from '../hooks/useSonarQubeQuery'; // Adjust path as needed
import './SonarQubeTable.css';

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

    // Function to extract filename from SonarQube component string
    const getFileName = (componentPath: string): string => {
        if (!componentPath) return 'N/A';
        const parts = componentPath.split(':');
        return parts.pop() || componentPath; // Returns the last part (filename) or the full path if no ':'
    };

    return (
        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table className="sonarqube-table"> {/* Use a distinct class name */}
                <thead>
                    <tr>
                        <th>Severity</th>
                        <th>Type</th>
                        <th>Rule</th>
                        <th>Message</th>
                        <th>File</th>
                        <th>Line</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {sonarData.issues.map((issue: SonarQubeIssue) => (
                        <tr key={issue.key}>
                            <td>{issue.severity}</td>
                            <td>{issue.type}</td>
                            <td>{issue.rule}</td>
                            <td style={{ whiteSpace: 'pre-wrap', minWidth: '300px' }}>{issue.message}</td>
                            <td style={{ wordBreak: 'break-all' }}>{getFileName(issue.component)}</td>
                            <td>{issue.line || 'N/A'}</td>
                            <td>{issue.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#555' }}>
                Displaying {sonarData.issues.length} of {sonarData.total ?? sonarData.issues.length} total issues.
            </p>
        </div>
    );
};

export default SonarQubeTable;