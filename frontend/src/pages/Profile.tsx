import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "./Profile.css";
import { useProfileQuery } from "../hooks/useProfileQuery";
import { useProjectQuery, Project } from "../hooks/useProjectQuery";
import { useProjectScanQuery, Scan } from "../hooks/useProjectScanQuery";
import { useScanXMLQuery } from "../hooks/useScanXMLQuery";
import DetektTable from "../components/DetektTable";
import { useSonarQubeQuery } from "../hooks/useSonarQubeQuery";
import SonarQubeTable from "../components/SonarQubeTable";

const Profile: React.FC = () => {
  // Data fetching hooks
  const {
    data: user,
    error: profileError,
    isLoading: profileLoading,
  } = useProfileQuery();
  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjectQuery();

  // State management
  const [activeTab, setActiveTab] = useState<"projects" | "scans" | "reports">(
    "projects"
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  // Auto-select the first project when data loads
  useEffect(() => {
    if (
      !selectedProjectId &&
      projectsData?.projects &&
      projectsData.projects.length > 0
    ) {
      setSelectedProjectId(projectsData.projects[0].id);
    }
  }, [projectsData, selectedProjectId]);

  // Fetch scans and reports based on selections
  const {
    data: scansData,
    isLoading: scansLoading,
    error: scansError,
  } = useProjectScanQuery(selectedProjectId);
  const {
    data: scanXML,
    isLoading: scanXMLLoading,
    error: scanXMLError,
  } = useScanXMLQuery(selectedScanId);
  const {
    data: sonarQubeResults,
    isLoading: sonarQubeLoading,
    error: sonarQubeError,
  } = useSonarQubeQuery(selectedScanId);

  // Helper function to format dates
  function formatUtcDate(dateString: string | null | undefined): string {
    if (!dateString) return "N/A";
    try {
      return (
        new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "UTC",
        }).format(new Date(dateString)) + " UTC"
      );
    } catch {
      return dateString;
    }
  }

  // Handlers for selecting items
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedScanId(null); // Reset scan selection
    setActiveTab("scans"); // Move to scans tab for better UX
  };

  const handleSelectScan = (scanId: string) => {
    setSelectedScanId(scanId);
    setActiveTab("reports"); // Move to reports tab
  };

  // Main loading and error states for the whole page
  if (profileLoading) {
    return (
      <div className="status-container">
        <div className="loading-spinner"></div>
        <h1>Loading Profile...</h1>
      </div>
    );
  }

  if (profileError || !user) {
    return (
      <div className="status-container">
        <h1 className="error-title">Error Loading Profile</h1>
        <div className="error-message">
          <p>
            {profileError ? profileError.message : "User data not available."}
          </p>
          <p>Please ensure you're logged in and try again.</p>
        </div>
      </div>
    );
  }

  const selectedProjectName =
    projectsData?.projects?.find((p) => p.id === selectedProjectId)?.name || "";

  // Render the main component
  return (
    <div className="profile-container">
      <Sidebar />
      <main className="profile-content">
        <header className="profile-header">
          <h1>
            Hello <span className="username-highlight">{user.username}</span>
            !
          </h1>
          <p>Here is a summary of your activity and scan reports.</p>
        </header>

        <div className="profile-tabs">
          <button
            className={`tab-button ${activeTab === "projects" ? "active" : ""}`}
            onClick={() => setActiveTab("projects")}
          >
            Projects
          </button>
          <button
            className={`tab-button ${activeTab === "scans" ? "active" : ""}`}
            onClick={() => setActiveTab("scans")}
            disabled={!selectedProjectId}
          >
            Scan History
          </button>
          <button
            className={`tab-button ${activeTab === "reports" ? "active" : ""}`}
            onClick={() => setActiveTab("reports")}
            disabled={!selectedScanId}
          >
            Reports
          </button>
        </div>

        <div className="tab-content">
          {/* Projects Tab */}
          {activeTab === "projects" && (
            <div id="projects-section" className="content-section">
              <h2>Your Projects</h2>
              {projectsLoading ? (
                <p>Loading projects...</p>
              ) : projectsError ? (
                <p style={{ color: "red" }}>
                  Error loading projects: {projectsError.message}
                </p>
              ) : !projectsData?.projects?.length ? (
                <p>
                  No projects found. Go to "Scan" to scan your first repository.
                </p>
              ) : (
                <div className="repo-list">
                  {projectsData.projects.map((proj: Project) => (
                    <div className="repo-card" key={proj.id}>
                      <div className="repo-card-header">
                        <h3>{proj.name}</h3>
                        <span className={`repo-visibility public`}>Public</span>
                      </div>
                      <div className="repo-card-body">
                        <p>
                          {" "}
                          <a
                            href={proj.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {proj.url}
                          </a>
                        </p>
                        <p>
                          <strong>Last Scan:</strong>{" "}
                          {formatUtcDate(proj.lastScan)}
                        </p>
                      </div>
                      <div className="repo-card-actions">
                        <button
                          className="action-button primary"
                          onClick={() => handleSelectProject(proj.id)}
                        >
                          View Scans
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Scans Tab */}
          {activeTab === "scans" && (
            <div id="scans-section" className="content-section">
              {!selectedProjectId ? (
                <p>Select a project to see its scan history.</p>
              ) : (
                <>
                  <h2>
                    Scan History for:{" "}
                    <span className="username-highlight">
                      {selectedProjectName}
                    </span>
                  </h2>
                  {scansLoading ? (
                    <p>Loading scans...</p>
                  ) : scansError ? (
                    <p style={{ color: "red" }}>
                      Error loading scans: {scansError.message}
                    </p>
                  ) : !scansData?.scans?.length ? (
                    <p>No scans recorded for this project yet.</p>
                  ) : (
                    <div className="scan-list">
                      <div className="scan-list-header">
                        <span>Scan ID</span>
                        <span>Scan Date</span>
                        <span>Actions</span>
                      </div>
                      {scansData.scans.map((scan: Scan) => (
                        <div className="scan-item" key={scan.id}>
                          <span data-label="Scan ID">
                            {scan.id}
                          </span>
                          <span data-label="Date">
                            {formatUtcDate(scan.detectedAt)}
                          </span>
                          <span data-label="Actions">
                            <button
                              className="action-button"
                              onClick={() => handleSelectScan(scan.id)}
                            >
                              View Report
                            </button>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div id="reports-section" className="content-section">
              {!selectedScanId ? (
                <p>Select a scan to see its reports.</p>
              ) : (
                <>
                  <h2>
                    Reports for Scan{" "}
                    <span className="username-highlight">
                      {selectedScanId}
                    </span>
                  </h2>

                  {/* Detekt Results */}
                  <div className="report-container">
                    <h3>Detekt Analysis</h3>
                    {scanXMLLoading ? (
                      <p>Loading Detekt results...</p>
                    ) : scanXMLError ? (
                      <p style={{ color: "red" }}>
                        Error loading Detekt results: {scanXMLError.message}
                      </p>
                    ) : scanXML ? (
                      <DetektTable xml={scanXML} />
                    ) : (
                      <p>No Detekt XML data available for this scan.</p>
                    )}
                  </div>

                  {/* SonarQube Results */}
                  <div className="report-container">
                    <h3>SonarQube Analysis</h3>
                    {sonarQubeLoading ? (
                      <p>Loading SonarQube results...</p>
                    ) : sonarQubeError ? (
                      <p style={{ color: "red" }}>
                        Error loading SonarQube results:{" "}
                        {sonarQubeError.message}
                      </p>
                    ) : sonarQubeResults ? (
                      <SonarQubeTable sonarData={sonarQubeResults} />
                    ) : (
                      <p>No SonarQube data available for this scan.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;