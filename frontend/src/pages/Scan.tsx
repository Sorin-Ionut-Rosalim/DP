import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useScanMutation } from "../hooks/useScanMutation";
import "./Scan.css";
import DetektTable from "../components/DetektTable";
import SonarQubeTable from "../components/SonarQubeTable";

// SVG Icons
const GitIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);
const LoadingSpinner = () => <div className="spinner"></div>;

const Scan: React.FC = () => {
  const location = useLocation();
  const [repoUrl, setRepoUrl] = useState(location.state?.repoUrl || "");
  const [detektXML, setDetektXML] = useState<string | null>(null);
  const [sonarQubeData, setSonarQubeData] = useState<any>(null);

  const { mutateAsync, isPending, error } = useScanMutation();

  const startScan = async (urlToScan: string) => {
    if (!urlToScan.trim() || isPending) return;

    setDetektXML(null);
    setSonarQubeData(null);

    try {
      const { scanId } = await mutateAsync({ repoUrl: urlToScan });

      try {
        const detektRes = await fetch(
          `http://localhost:4000/api/scan/${scanId}/detekt`,
          { credentials: "include" }
        );
        if (detektRes.ok) {
          setDetektXML(await detektRes.text());
        } else {
          console.error(
            "Failed to fetch Detekt results:",
            detektRes.statusText
          );
        }
      } catch (detektError) {
        console.error("Error fetching Detekt results:", detektError);
      }

      try {
        const sonarRes = await fetch(
          `http://localhost:4000/api/scan/${scanId}/sonarqube`,
          { credentials: "include" }
        );
        if (sonarRes.ok) {
          setSonarQubeData(await sonarRes.json());
        } else {
          console.error(
            "Failed to fetch SonarQube results:",
            sonarRes.statusText
          );
        }
      } catch (sonarError) {
        console.error("Error fetching SonarQube results:", sonarError);
      }
    } catch (mutationError) {
      console.error("Scan mutation failed:", mutationError);
    }
  };

  // Effect to automatically start a scan if a repoUrl is passed in the navigation state.
  useEffect(() => {
    const urlFromState = location.state?.repoUrl;
    if (urlFromState) {
      // Clear the state to prevent re-scanning on refresh
      window.history.replaceState({}, document.title);
      startScan(urlFromState);
    }
  }, [location.state?.repoUrl]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startScan(repoUrl);
  };

  return (
    <div className="page-container">
      <Sidebar />
      <main className="page-content">
        <header className="page-header">
          <h1>New Scan</h1>
          <p>Enter a public GitHub repository URL to start a new analysis.</p>
        </header>

        <div className="scan-card">
          <form onSubmit={handleFormSubmit} className="scan-form">
            <div className="input-group">
              <span className="input-icon">
                <GitIcon />
              </span>
              <input
                type="text"
                className="auth-inputField"
                placeholder="e.g., https://github.com/user/repo"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={isPending}
              />
            </div>
            <button
              type="submit"
              className="auth-button"
              disabled={isPending || !repoUrl.trim()}
            >
              {isPending ? "Scanning..." : "Scan Repository"}
            </button>
          </form>
        </div>

        {isPending && (
          <div className="status-container-scan">
            <LoadingSpinner />
            <p>Scan in progress... This may take several minutes.</p>
          </div>
        )}

        {error && (
          <div className="status-container-scan error">
            <p>
              <strong>Scan Failed:</strong> {error.message}
            </p>
          </div>
        )}

        {/* Results Section */}
        {(detektXML || sonarQubeData) && !isPending && (
          <div className="results-wrapper">
            <h2>Scan Results</h2>
            {detektXML && (
              <div className="results-card">
                <h3>Detekt Analysis</h3>
                <DetektTable xml={detektXML} />
              </div>
            )}
            {sonarQubeData && (
              <div className="results-card">
                <h3>SonarQube Analysis</h3>
                <SonarQubeTable sonarData={sonarQubeData} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Scan;
