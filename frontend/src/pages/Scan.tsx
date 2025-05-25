import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useScanMutation } from "../hooks/useScanMutation";
import "./Scan.css";
import DetektTable from "../components/DetektTable";

const Scan: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [detektXML, setDetektXML] = useState<string | null>(null);

  // Destructure the mutation result
  const { mutateAsync, status } = useScanMutation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile", { credentials: "include" });
        if (!res.ok) {
          const { message } = await res.json();
          throw new Error(message || "Failed to fetch profile.");
        }
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : "Unknown auth error");
      }
    };
    fetchProfile();
  }, []);

  if (authError) {
    return (
      <div className="status-container">
        <h1 className="error-title">Not Authenticated</h1>
        <p className="error-message">{authError}</p>
      </div>
    );
  }

  const handleScan = async () => {
    if (!repoUrl.trim()) {
      setStatusMessage("Please enter a valid repository URL.");
      return;
    }
    setStatusMessage(null);
    setDetektXML(null);
    try {
      const { message } = await mutateAsync({ repoUrl });
      setStatusMessage("✅ Scan complete!");
      setDetektXML(message);
    } catch (err) {
      setStatusMessage(`❌ ${err instanceof Error ? err.message : "Scan failed"}`);
    }
  };

  return (
    <div className="scan-container">
      <Sidebar />
      <div className="scan-content">
        <h1 className="scan-title">Scan a Repository</h1>

        <div className="scan-input-container">
          <input
            type="text"
            className="scan-input"
            placeholder="Enter GitHub Repo URL"
            value={repoUrl}
            onChange={(e) => {
              setRepoUrl(e.target.value);
              setStatusMessage(null);
              setDetektXML(null);
            }}
          />
        </div>

        <button
          className="scan-button"
          onClick={handleScan}
          disabled={status === "pending"}
        >
          {status === "pending" ? "Scanning..." : "Scan Repository"}
        </button>
        {status === "pending" && <div className="spinner">⏳ Scanning, please wait...</div>}
        {statusMessage && <p className="scan-status">{statusMessage}</p>}
        {detektXML && <DetektTable xml={detektXML} />}
      </div>
    </div>
  );
};

export default Scan;