import React, { useState, useEffect } from 'react';
import Sidebar from "../components/Sidebar";
import './Profile.css';
import { useProfileQuery } from '../hooks/useProfileQuery';
import { useProjectQuery, Project } from '../hooks/useProjectQuery';
import { useProjectScanQuery, Scan } from '../hooks/useProjectScanQuery';
import { useScanXMLQuery } from '../hooks/useScanXMLQuery';
import DetektTable from '../components/DetektTable';
import { useSonarQubeQuery } from '../hooks/useSonarQubeQuery';
import SonarQubeTable from '../components/SonarQubeTable';

const Profile: React.FC = () => {
  const { data: user, error: profileError, isLoading: profileLoading } = useProfileQuery();
  const { data: projectsData, isLoading: projectsLoading, error: projectsError } = useProjectQuery();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  // Auto-select first project
  useEffect(() => {
    if (!selectedProjectId && projectsData?.projects && projectsData.projects.length > 0) {
      setSelectedProjectId(projectsData.projects[0].id);
      setSelectedScanId(null);
    } else if (selectedProjectId && (!projectsData?.projects || projectsData.projects.length === 0)) {
      setSelectedProjectId(null);
      setSelectedScanId(null);
    }
  }, [projectsData, selectedProjectId]);

  const { data: scansData, isLoading: scansLoading, error: scansError } = useProjectScanQuery(selectedProjectId);
  const { data: scanXML, isLoading: scanXMLLoading, error: scanXMLError } = useScanXMLQuery(selectedScanId);

  const {
    data: sonarQubeResults,
    isLoading: sonarQubeLoading,
    error: sonarQubeError
  } = useSonarQubeQuery(selectedScanId);

  function formatUtcDate(dateString: string) {
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      }).format(new Date(dateString)) + " UTC";
    } catch {
      return dateString;
    }
  }

  const totalScannedProjects = projectsData?.projects?.filter((project: Project) => !!project.lastScan).length ?? 0;

  if (profileLoading) {
    return (
      <div className="status-container">
        <div className="loading-spinner"></div><h1>Loading Profile...</h1>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="status-container">
        <h1 className="error-title">Error Loading Profile</h1>
        <div className="error-message">
          <p>We couldn't load your profile: {profileError.message}</p>
          <p>Please ensure you're logged in and try again.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="status-container">
        <h1>User data not available.</h1>
        <p>Please try logging out and then logging back in.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Sidebar />
      <div className="profile-content">
        {/* User Info Card */}
        <div className="profile-card">
          <div className="user-info-grid">
            <div className="info-item"><span className="info-label">User ID</span><span className="info-value">{user.id}</span></div>
            <div className="info-item"><span className="info-label">Username</span><span className="info-value">{user.username}</span></div>
            <div className="info-item">
              <span className="info-label">Projects with Scans</span>
              {projectsLoading ? <span className="info-value">Loading...</span> :
                projectsError ? <span className="info-value" style={{ color: 'red' }}>Error</span> :
                  <span className="info-value">{totalScannedProjects}</span>
              }
            </div>
          </div>
        </div>
        {/* Project History */}
        <div className="project-history-card">
          <h2>Project History</h2>
          {projectsLoading ? (
            <div>Loading projects...</div>
          ) : projectsError ? (
            <div style={{ color: 'red' }}>
              <p><strong>Error loading projects:</strong> {projectsError.message}</p>
              <p>This often means the backend API at <code>/api/projects</code> did not return data in the expected format.</p>
            </div>
          ) : (
            <>
              {projectsData?.projects?.length ? (
                <div className="project-list-grid">
                  {projectsData.projects.map((proj: Project) => (
                    <div
                      key={proj.id}
                      className={`project-card-mini${proj.id === selectedProjectId ? " selected" : ""}`}
                      onClick={() => { setSelectedProjectId(proj.id); setSelectedScanId(null); }}
                      tabIndex={0}
                      role="button"
                    >
                      <div className="project-title-row">
                        <button
                          className="project-select-btn"
                          tabIndex={-1}
                          style={{ background: proj.id === selectedProjectId ? "#012a4a" : "#468faf" }}
                        >
                          {proj.name}
                        </button>
                        <span className="project-lastscan">
                          {proj.lastScan ? (
                            <>
                              <span className="dot-green" />
                              Last Scan :<span className="datetime">{formatUtcDate(proj.lastScan)}</span>
                            </>
                          ) : (
                            <span style={{ color: "#888" }}><span className="dot-grey" /> Never scanned</span>
                          )}
                        </span>
                      </div>
                      <a className="project-url-link" href={proj.url} target="_blank" rel="noopener noreferrer">
                        {proj.url}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-projects-message">No projects found. Go to "Scan" to scan your first repository.</div>
              )}
            </>
          )}
        </div>

        {/* Scans for Selected Project */}
        {selectedProjectId && !projectsError && (
          <div className="scan-history-card">
            <h3>
              Scans for: {projectsData?.projects?.find(p => p.id === selectedProjectId)?.name || 'Selected Project'}
            </h3>
            {scansLoading ? (
              <div>Loading scans...</div>
            ) : scansError ? (
              <div style={{ color: 'red' }}>Error loading scans: {scansError.message}</div>
            ) : (
              <div className="scan-list-row">
                {scansData?.scans?.length ? (
                  scansData.scans.map((scan: Scan) => (
                    <div key={scan.id} className={`scan-badge${scan.id === selectedScanId ? " selected" : ""}`}>
                      <button
                        className="scan-select-btn"
                        onClick={() => setSelectedScanId(scan.id)}
                      >
                        View Scan ({scan.id.substring(0, 8)}...)
                      </button>
                      <span className="scan-date">{formatUtcDate(scan.detectedAt)}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-scans-message">No scans recorded for this project yet.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Detekt Results */}
        {selectedScanId && !scansError && (
          <>
            <div className="results-card">
              <h3 style={{ marginBottom: "1.2rem" }}>
                Detekt Results for Scan ({selectedScanId.substring(0, 8)}...)
              </h3>
              {scanXMLLoading ? (
                <div>Loading scan results...</div>
              ) : scanXMLError ? (
                <div style={{ color: 'red' }}>Error loading scan results: {scanXMLError.message}</div>
              ) : (
                scanXML ? <DetektTable xml={scanXML} /> : <div>No Detekt XML data available for this scan.</div>
              )}
            </div>

            <div className="results-card">
              <h3 style={{ marginBottom: "1.2rem" }}>SonarQube Analysis Issues</h3>
              {sonarQubeLoading ? (
                <div>Loading SonarQube results...</div>
              ) : sonarQubeError ? (
                <div style={{ color: 'red' }}>
                  <p><strong>Error loading SonarQube results:</strong> {sonarQubeError.message}</p>
                  <p>This might indicate that SonarQube analysis failed, data is not yet available, or there was an issue fetching it.</p>
                </div>
              ) : sonarQubeResults ? (
                <SonarQubeTable sonarData={sonarQubeResults} />
              ) : (
                <div>No SonarQube data available for this analysis run.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;