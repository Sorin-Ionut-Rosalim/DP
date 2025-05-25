import React from "react";
import { XMLParser } from "fast-xml-parser";
import "./DetektTable.css";

interface DetektTableProps {
  xml: string;
}

type DetektErrorRow = {
  file: string;
  line: string;
  column: string;
  severity: string;
  message: string;
  rule: string;
};

const DetektTable: React.FC<DetektTableProps> = ({ xml }) => {
  if (!xml) return null;
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  let parsed: any;
  try {
    parsed = parser.parse(xml);
    // console.log("Parsed Detekt XML:", parsed); // DEBUG
  } catch (e) {
    return <div>Invalid detekt XML.</div>;
  }

  // Defensive extraction for various Detekt outputs
  let filesArr: any[] = [];
  if (parsed && parsed.checkstyle && parsed.checkstyle.file) {
    let fileNode = parsed.checkstyle.file;
    // file can be a single object or array
    filesArr = Array.isArray(fileNode) ? fileNode : [fileNode];
  }
  
  let rows: DetektErrorRow[] = [];
  for (const file of filesArr) {
    if (!file) continue;
    // If there are no errors, skip
    if (!file.error) continue;
    // error can be a single object or array
    const errorsArr = Array.isArray(file.error) ? file.error : [file.error];
    for (const error of errorsArr) {
      if (!error) continue;
      rows.push({
        file: file["@_name"] || "(unknown file)",
        line: error["@_line"] || "",
        column: error["@_column"] || "",
        severity: error["@_severity"] || "",
        message: error["@_message"] || "",
        rule: error["@_source"] || "",
      });
    }
  }

  if (rows.length === 0) {
    return <div>No Detekt issues found.</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="detekt-table">
        <thead>
          <tr>
            <th>File</th>
            <th>Line</th>
            <th>Column</th>
            <th>Rule</th>
            <th>Severity</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td>{row.file}</td>
              <td>{row.line}</td>
              <td>{row.column}</td>
              <td>{row.rule}</td>
              <td>{row.severity}</td>
              <td>{row.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DetektTable;
