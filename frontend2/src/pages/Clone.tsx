import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "./Clone.css";

const Clone: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
      const fetchProfile = async () => {
        try {
          const response = await fetch('/api/profile', { credentials: 'include' });
  
          if (!response.ok) {
            const errorData: { message?: string } = await response.json();
            throw new Error(errorData.message || 'Failed to fetch profile.');
          }

        } catch (err) {
          if (err instanceof Error) {
            console.error(err);
            setError(err.message);
          } else {
            console.error("An unknown error occurred.");
            setError("An unknown error occurred.");
          }
        }
      };
  
      fetchProfile();
  }, []);

  if (error) {
    return (
      <div className="status-container">
        <h1 className="error-title">Not Authenticated</h1>
        <p className="error-message">{error}</p>
      </div>
    );
  }
  
  const handleClone = async () => {
    if (!repoUrl.trim()) {
      setStatusMessage("Please enter a valid repository URL.");
      return;
    }

    try {
      const response = await fetch("/api/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ repoUrl }),
      });

      const result = await response.json();
      if (response.ok) {
        setStatusMessage(`✅ Clone successful: ${result.message}`);
      } else {
        setStatusMessage(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error cloning:", error);
      setStatusMessage("Something went wrong. Please try again.");
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
            }}
          />
        </div>

        <button className="clone-button" onClick={handleClone}>
          Clone Repository
        </button>

        {/* Status Message */}
        {statusMessage && <p className="clone-status">{statusMessage}</p>}
      </div>
    </div>
  );
};

export default Clone;
