import React, { useState, useMemo } from "react";
import "./Table.css";

// Define SonarQube issue structure
interface SonarQubeIssue {
  component: string;
  line?: number;
  message: string;
  rule: string;
  severity: string;
  type: string;
}

interface SonarQubeTableProps {
  sonarData: {
    issues: SonarQubeIssue[];
  };
}

const SonarQubeTable: React.FC<SonarQubeTableProps> = ({
  sonarData,
}) => {
  const issues = sonarData.issues || [];

  // State for sorting, searching, and filtering
  const [sortConfig, setSortConfig] = useState<{
    key: keyof SonarQubeIssue;
    direction: "ascending" | "descending";
  } | null>({ key: "severity", direction: "ascending" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterType, setFilterType] = useState("all");

  // Apply search, filter, and sort
  const filteredAndSortedIssues = useMemo(() => {
    let sortableIssues = [...issues];

    // Filtering
    if (filterSeverity !== "all") {
      sortableIssues = sortableIssues.filter(
        (issue) => issue.severity.toLowerCase() === filterSeverity.toLowerCase()
      );
    }
    if (filterType !== "all") {
      sortableIssues = sortableIssues.filter(
        (issue) => issue.type.toLowerCase() === filterType.toLowerCase()
      );
    }

    // Searching
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      sortableIssues = sortableIssues.filter(
        (issue) =>
          issue.message.toLowerCase().includes(lowercasedTerm) ||
          issue.component.toLowerCase().includes(lowercasedTerm) ||
          issue.rule.toLowerCase().includes(lowercasedTerm)
      );
    }

    // Sorting
    if (sortConfig !== null) {
      sortableIssues.sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";
        if (aValue < bValue)
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue)
          return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return sortableIssues;
  }, [issues, searchTerm, filterSeverity, filterType, sortConfig]);

  // Handle sort request
  const requestSort = (key: keyof SonarQubeIssue) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig?.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortClassName = (key: keyof SonarQubeIssue) => {
    if (!sortConfig) return "";
    return sortConfig.key === key ? sortConfig.direction : "";
  };

  const severities = useMemo(
    () => [
      "all",
      ...Array.from(new Set(issues.map((i) => i.severity.toLowerCase()))),
    ],
    [issues]
  );
  const types = useMemo(
    () => [
      "all",
      ...Array.from(new Set(issues.map((i) => i.type.toLowerCase()))),
    ],
    [issues]
  );

  const tableHeaders: { key: keyof SonarQubeIssue; label: string }[] = [
    { key: "component", label: "File" },
    { key: "line", label: "Line" },
    { key: "type", label: "Type" },
    { key: "rule", label: "Rule" },
    { key: "severity", label: "Severity" },
    { key: "message", label: "Message" },
  ];

  return (
    <div className="enhanced-table-container">
      <div className="table-controls">
        <input
          type="text"
          placeholder="Search issues..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="filter-container">
          <label htmlFor="sonar-severity-filter">Severity:</label>
          <select
            id="sonar-severity-filter"
            className="filter-select"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            {severities.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-container">
          <label htmlFor="sonar-type-filter">Type:</label>
          <select
            id="sonar-type-filter"
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="enhanced-table">
          <thead>
            <tr>
              {tableHeaders.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => requestSort(key)}
                  className={getSortClassName(key)}
                >
                  {label}
                  <span className="sort-indicator"></span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedIssues.length > 0 ? (
              filteredAndSortedIssues.map((issue, index) => (
                <tr key={index}>
                  <td data-label="Component" title={issue.component}>
                    {issue.component.split(":").pop()}
                  </td>
                  <td data-label="Line">{issue.line || "N/A"}</td>
                  <td data-label="Type">{issue.type}</td>
                  <td data-label="Rule">{issue.rule}</td>
                  <td data-label="Severity">
                    <span
                      className={`severity-badge severity-${issue.severity.toLowerCase()}`}
                    >
                      {issue.severity}
                    </span>
                  </td>
                  <td data-label="Message">{issue.message}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={tableHeaders.length} className="no-results">
                  No issues found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SonarQubeTable;