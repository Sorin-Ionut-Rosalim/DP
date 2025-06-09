import React, { useState, useMemo } from "react";
import "./Table.css";

// Define the structure of a parsed issue
interface DetektIssue {
  file: string;
  line: number;
  column: number;
  rule: string;
  severity: string;
  message: string;
}

// Props for the component
interface DetektTableProps {
  xml: string;
}

const DetektTable: React.FC<DetektTableProps> = ({ xml }) => {
  // State for sorting, searching, and filtering
  const [sortConfig, setSortConfig] = useState<{
    key: keyof DetektIssue;
    direction: "ascending" | "descending";
  } | null>({ key: "severity", direction: "ascending" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");

  // Parse the XML data into an array of issues
  const issues = useMemo((): DetektIssue[] => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, "text/xml");
      const fileNodes = Array.from(xmlDoc.getElementsByTagName("file"));
      const allIssues: DetektIssue[] = [];

      fileNodes.forEach((fileNode) => {
        const fileName = fileNode.getAttribute("name") || "N/A";
        const errorNodes = Array.from(fileNode.getElementsByTagName("error"));

        errorNodes.forEach((errorNode) => {
          allIssues.push({
            file: fileName,
            line: parseInt(errorNode.getAttribute("line") || "0", 10),
            column: parseInt(errorNode.getAttribute("column") || "0", 10),
            rule:
              errorNode.getAttribute("source")?.replace("detekt.", "") || "N/A",
            severity: errorNode.getAttribute("severity") || "N/A",
            message: errorNode.getAttribute("message") || "No message",
          });
        });
      });
      return allIssues;
    } catch (e) {
      console.error("Failed to parse Detekt XML:", e);
      return [];
    }
  }, [xml]);

  // Apply search, filter, and sort to the issues
  const filteredAndSortedIssues = useMemo(() => {
    let sortableIssues = [...issues];

    // Filter by severity
    if (filterSeverity !== "all") {
      sortableIssues = sortableIssues.filter(
        (issue) => issue.severity.toLowerCase() === filterSeverity.toLowerCase()
      );
    }

    // Filter by search term
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      sortableIssues = sortableIssues.filter(
        (issue) =>
          issue.message.toLowerCase().includes(lowercasedTerm) ||
          issue.file.toLowerCase().includes(lowercasedTerm) ||
          issue.rule.toLowerCase().includes(lowercasedTerm)
      );
    }

    // Apply sorting
    if (sortConfig !== null) {
      sortableIssues.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue)
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue)
          return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return sortableIssues;
  }, [issues, searchTerm, filterSeverity, sortConfig]);

  // Function to handle sorting when a header is clicked
  const requestSort = (key: keyof DetektIssue) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig?.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortClassName = (key: keyof DetektIssue) => {
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

  const tableHeaders: { key: keyof DetektIssue; label: string }[] = [
    { key: "file", label: "File" },
    { key: "line", label: "Line" },
    { key: "column", label: "Column" },
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
          <label htmlFor="severity-filter">Severity:</label>
          <select
            id="severity-filter"
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
                  <td data-label="File" title={issue.file}>
                    {issue.file.split("/").slice(3).join("/")}
                  </td>
                  <td data-label="Line">{issue.line}</td>
                  <td data-label="Column">{issue.column}</td>
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

export default DetektTable;
