import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useScanMutation } from "../hooks/useScanMutation";
import "./Scan.css";
import DetektTable from "../components/DetektTable";
import SonarQubeTable from "../components/SonarQubeTable";

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

  // Manually control a single loading state for the entire process.
  const [isScanning, setIsScanning] = useState(false);

  const { mutateAsync, error: mutationError } = useScanMutation();

  const initialScanStartedRef = useRef(false);

  const startScan = useCallback(
    async (urlToScan: string) => {
      // Prevent starting a new scan if one is already in progress.
      if (isScanning || !urlToScan.trim()) return;

      // Set loading to true at the very beginning.
      setIsScanning(true);
      setDetektXML(null);
      setSonarQubeData(null);

      try {
        const { scanId } = await mutateAsync({ repoUrl: urlToScan });

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
      } catch (e) {
        console.error("An error occurred during the scan process:", e);
      } finally {
        setIsScanning(false);
      }
    },
    [isScanning, mutateAsync]
  );

  useEffect(() => {
    const urlFromState = location.state?.repoUrl;
    if (urlFromState && !initialScanStartedRef.current) {
      initialScanStartedRef.current = true;
      window.history.replaceState({}, document.title);
      startScan(urlFromState);
    }
  }, [location.state?.repoUrl, startScan]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startScan(repoUrl);
  };

  const error = mutationError;

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
                disabled={isScanning}
              />
            </div>
            <button
              type="submit"
              className="auth-button"
              disabled={isScanning || !repoUrl.trim()}
            >
              {isScanning ? "Scanning..." : "Scan Repository"}
            </button>
          </form>
        </div>

        {isScanning && (
          <div className="status-container-scan">
            <LoadingSpinner />
            <p>Scan in progress... This may take several minutes.</p>
          </div>
        )}

        {error && !isScanning && (
          <div className="status-container-scan error">
            <p>
              <strong>Scan Failed:</strong> {error.message}
            </p>
          </div>
        )}

        {(detektXML || sonarQubeData) && !isScanning && (
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
