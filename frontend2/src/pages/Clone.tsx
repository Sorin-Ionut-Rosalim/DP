import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "./Clone.css";

function Clone() {
  const [repoUrl, setRepoUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/profile", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error((await response.json()).message);
        }
        return response.json();
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      });
  }, []);

  const handleClone = async () => {
    try {
      const response = await fetch("/clone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ repoUrl }),
      });
      const result = await response.json();
      alert(`Clone status: ${result.message}`);
    } catch (error) {
      console.error("Error cloning:", error);
    }
  };

  if (error) {
    return (
      <div style={{ margin: "2rem", textAlign: "center" }}>
        <h1>Not Authenticated</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="clone-container">
      <Sidebar />
      <div className="clone-content">
        <h1>Clone a Repository</h1>
        <input
          type="text"
          className="clone-input"
          placeholder="GitHub Repo URL"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
        />
        <button className="clone-button" onClick={handleClone}>
          Clone
        </button>
      </div>
    </div>
  );
}

export default Clone;
