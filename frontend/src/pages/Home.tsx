import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./Home.css";
import { useProfileQuery } from "../hooks/useProfileQuery";
import { useProjectQuery } from "../hooks/useProjectQuery";

// SVG Icons for the dashboard
const ScanIcon = () => (
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
    <path d="m15.5 7.5 3 3-3 3"></path>
    <path d="M8.5 16.5 5 13l3.5-3.5"></path>
    <path d="M18 12H6"></path>
    <path d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0Z"></path>
  </svg>
);
const FolderIcon = () => (
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
    <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
  </svg>
);
const ClockIcon = () => (
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
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const Home: React.FC = () => {
  const navigate = useNavigate();
  const {
    data: user,
    isLoading: profileLoading,
    error: profileError,
  } = useProfileQuery();
  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
  } = useProjectQuery();

  const totalProjects = projectsData?.projects?.length ?? 0;
  const totalScans = projectsData?.totalScans ?? 0;

  const lastScanDate = useMemo(() => {
    if (!projectsData?.projects || projectsData.projects.length === 0)
      return "N/A";
    const mostRecentScan = projectsData.projects
      .filter((p) => p.lastScan)
      .sort(
        (a, b) =>
          new Date(b.lastScan!).getTime() - new Date(a.lastScan!).getTime()
      )[0];
    return mostRecentScan
      ? new Date(mostRecentScan.lastScan!).toLocaleDateString()
      : "N/A";
  }, [projectsData]);

  const recentProjects = useMemo(() => {
    if (!projectsData?.projects) return [];
    return [...projectsData.projects]
      .sort(
        (a, b) =>
          new Date(b.lastScan || 0).getTime() -
          new Date(a.lastScan || 0).getTime()
      )
      .slice(0, 7);
  }, [projectsData]);

  const isLoading = profileLoading || projectsLoading;
  const error = profileError || projectsError;

  const handleViewProject = (projectId: string) => {
    navigate('/portfolio', { state: { defaultProjectId: projectId } });
  };

  if (isLoading) {
    return (
      <div className="status-container">
        <div className="loading-spinner"></div>
        <h1>Loading Dashboard...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-container">
        <h1 className="error-title">
          {error.message.includes("401")
            ? "Not Authenticated"
            : "Error Loading Dashboard"}
        </h1>
        <p className="error-message">
          {error.message.includes("401")
            ? "Please log in to access this page."
            : error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="home-container">
      <Sidebar />
      <main className="home-content">
        <header className="home-header">
          <h1>Welcome back, {user?.username}!</h1>
          <p>Here’s a snapshot of your scanning activity.</p>
        </header>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div
              className="stat-icon-wrapper"
              style={{ backgroundColor: "#e0f2fe" }}
            >
              <FolderIcon />
            </div>
            <div className="stat-info">
              <span className="stat-title">Total Projects</span>
              <span className="stat-value">{totalProjects}</span>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon-wrapper"
              style={{ backgroundColor: "#dcfce7" }}
            >
              <ScanIcon />
            </div>
            <div className="stat-info">
              <span className="stat-title">Total Scans</span>
              <span className="stat-value">{totalScans}</span>
            </div>
          </div>
          <div className="stat-card">
            <div
              className="stat-icon-wrapper"
              style={{ backgroundColor: "#f3e8ff" }}
            >
              <ClockIcon />
            </div>
            <div className="stat-info">
              <span className="stat-title">Last Scan Date</span>
              <span className="stat-value">{lastScanDate}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <Link to="/scan" className="action-button primary">
              <ScanIcon />
              Start a New Scan
            </Link>
            <Link to="/portfolio" className="action-button">
              View All Reports
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="recent-activity">
          <h2>Recent Projects</h2>
          {recentProjects.length > 0 ? (
            <ul className="activity-list">
              {recentProjects.map((project) => (
                <li key={project.id} className="activity-item">
                  <div className="activity-icon">
                    <FolderIcon />
                  </div>
                  <div className="activity-details">
                    <span className="activity-title">{project.name}</span>
                    <span className="activity-subtitle">
                      {project.lastScan
                        ? `Last scanned on ${new Date(
                          project.lastScan
                        ).toLocaleDateString()}`
                        : "Never scanned"}
                    </span>
                  </div>
                  <button onClick={() => handleViewProject(project.id)} className="activity-link">
                    View
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-activity-message">
              You haven't scanned any projects yet. Start a new scan to see
              activity here.
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;