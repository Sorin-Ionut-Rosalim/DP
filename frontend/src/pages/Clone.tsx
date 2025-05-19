import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { useCloneMutation } from "../hooks/useCloneMutation";
import "./Clone.css";
import DetektTable from "../components/DetektTable";

const Clone: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [detektXML, setDetektXML] = useState<string | null>(null);

  // Destructure the mutation result
  const { mutateAsync, status } = useCloneMutation();

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

  const handleClone = async () => {
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
      setStatusMessage(`❌ ${err instanceof Error ? err.message : "Clone failed"}`);
    }
  };

  return (
    <div className="clone-container">
      <Sidebar />
      <div className="clone-content">
        <h1 className="clone-title">Clone a Repository</h1>

        <div className="clone-input-container">
          <input
            type="text"
            className="clone-input"
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
          className="clone-button"
          onClick={handleClone}
          disabled={status === "pending"}
        >
          {status === "pending" ? "Scanning..." : "Clone Repository"}
        </button>
        {status === "pending" && <div className="spinner">⏳ Scanning, please wait...</div>}
        {statusMessage && <p className="clone-status">{statusMessage}</p>}
        {detektXML && <DetektTable xml={detektXML} />}
      </div>
    </div>
  );
};

export default Clone;