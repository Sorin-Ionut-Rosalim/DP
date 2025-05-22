import React, { useState, useEffect } from 'react';
import Sidebar from "../components/Sidebar";
import './Profile.css'; // Ensure your CSS handles new states if needed
import { useProfileQuery } from '../hooks/useProfileQuery';
import { useProjectQuery, Project } from '../hooks/useProjectQuery'; // Removed ProjectsResponse as it's used internally in useProjectQuery
import { useProjectScanQuery, Scan } from '../hooks/useProjectScanQuery'; // Assuming Scan type is exported
import { useScanXMLQuery } from '../hooks/useScanXMLQuery';
import DetektTable from '../components/DetektTable';

const Profile: React.FC = () => {
  const { data: user, error: profileError, isLoading: profileLoading } = useProfileQuery();
  const { data: projectsData, isLoading: projectsLoading, error: projectsError } = useProjectQuery();

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  // Auto-select the first project
  useEffect(() => {
    if (!selectedProjectId && projectsData?.projects && projectsData.projects.length > 0) {
      setSelectedProjectId(projectsData.projects[0].id);
      setSelectedScanId(null); // Reset scan selection when project changes
    } else if (selectedProjectId && (!projectsData?.projects || projectsData.projects.length === 0)) {
      // If projects disappear or selected project is no longer valid, reset
      setSelectedProjectId(null);
      setSelectedScanId(null);
    }
  }, [projectsData, selectedProjectId]);

  const { data: scansData, isLoading: scansLoading, error: scansError } = useProjectScanQuery(selectedProjectId);
  const { data: scanXML, isLoading: scanXMLLoading, error: scanXMLError } = useScanXMLQuery(selectedScanId);

  // Debug logs (optional, can be commented out for production)
  useEffect(() => {
    console.log("[Profile] Profile Query:", { isLoading: profileLoading, error: profileError, data: user });
    console.log("[Profile] Projects Query:", { isLoading: projectsLoading, error: projectsError, data: projectsData });
    console.log("[Profile] Scans Query:", { isLoading: scansLoading, error: scansError, data: scansData, selectedProjectId });
    console.log("[Profile] ScanXML Query:", { isLoading: scanXMLLoading, error: scanXMLError, data: scanXML, selectedScanId });
  }, [profileLoading, profileError, user, projectsLoading, projectsError, projectsData, scansLoading, scansError, scansData, selectedProjectId, scanXMLLoading, scanXMLError, scanXML, selectedScanId]);


  const hasAnyScan = projectsData?.projects?.some((project: Project) => !!project.lastScan) ?? false;
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
    // This case should ideally be covered by profileError, but as a fallback:
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
              <p>This often means the backend API at `/api/projects` did not return data in the expected format. Please check the browser console (especially Zod validation errors from `useProjectQuery.ts`) and the Network tab for more details on the API response.</p>
            </div>
          ) : (
            <ul className="project-list">
              {projectsData?.projects?.length ? (
                projectsData.projects.map((proj: Project) => (
                  <li key={proj.id}>
                    <button
                      className={proj.id === selectedProjectId ? "active" : ""}
                      onClick={() => { setSelectedProjectId(proj.id); setSelectedScanId(null); }}
                    >
                      {proj.name}
                    </button>
                    <span className="project-url">{proj.url}</span>
                    <span className="project-lastscan">
                      Last Scan: {proj.lastScan ? new Date(proj.lastScan).toLocaleString() : "Never"}
                    </span>
                  </li>
                ))
              ) : (
                <li>No projects found. Go to "Clone" to scan your first repository.</li>
              )}
            </ul>
          )}
        </div>

        {/* Scans for Selected Project */}
        {selectedProjectId && !projectsError && ( // Only show if a project is selected and projects loaded fine
          <div className="scan-history-card">
            <h3>Scans for: {projectsData?.projects?.find(p => p.id === selectedProjectId)?.name || 'Selected Project'}</h3>
            {scansLoading ? (
              <div>Loading scans...</div>
            ) : scansError ? (
              <div style={{ color: 'red' }}>Error loading scans: {scansError.message}</div>
            ) : (
              <ul className="scan-list">
                {scansData?.scans?.length ? (
                  scansData.scans.map((scan: Scan) => ( // Use the Scan type if available
                    <li key={scan.id}>
                      <button
                        className={scan.id === selectedScanId ? "active" : ""}
                        onClick={() => setSelectedScanId(scan.id)}
                      >
                        View Scan ({scan.id.substring(0, 8)}...)
                      </button>
                      <span className="scan-date">Date: {new Date(scan.detectedAt).toLocaleString()}</span>
                    </li>
                  ))
                ) : (
                  <li>No scans recorded for this project yet.</li>
                )}
              </ul>
            )}
          </div>
        )}

        {/* Detekt Results for Selected Scan */}
        {selectedScanId && !scansError && ( // Only show if a scan is selected and scans loaded fine
          <div className="detekt-results-card">
            <h3>Detekt Results for Scan ({selectedScanId.substring(0,8)}...)</h3>
            {scanXMLLoading ? (
              <div>Loading scan results...</div>
            ) : scanXMLError ? (
              <div style={{ color: 'red' }}>Error loading scan results: {scanXMLError.message}</div>
            ) : (
              scanXML ? <DetektTable xml={scanXML} /> : <div>No Detekt XML data available for this scan.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;