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
        ignoreAttributes: false,    // <-- include attributes like @_name
        attributeNamePrefix: "@_",  // <-- use @_ prefix for attributes
    });
    let parsed;
    try {
        parsed = parser.parse(xml);
    } catch {
        return <div>Invalid detekt XML.</div>;
    }

    const files = parsed?.checkstyle?.file;
    const filesArr = Array.isArray(files) ? files : files ? [files] : [];
    let rows: DetektErrorRow[] = [];
    filesArr.forEach((file: any) => {
        if (!file.error) return;
        const errorsArr = Array.isArray(file.error) ? file.error : [file.error];
        errorsArr.forEach((error: any) => {
            rows.push({
            file: file['@_name'],
            line: error['@_line'],
            column: error['@_column'],
            severity: error['@_severity'],
            message: error['@_message'],
            rule: error['@_source'],
            });
        });
    });

    if (rows.length === 0) {
        return <div>No Detekt issues found.</div>;
    }
    else {
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
    }

    
};

export default DetektTable;
