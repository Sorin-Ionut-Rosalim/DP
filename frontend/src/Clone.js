import React, { useState, useEffect } from "react";

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
    <div style={{ margin: "2rem", textAlign: "center" }}>
      <h1>Clone a GitHub Repository</h1>
      <input
        type="text"
        placeholder="Enter GitHub Repo URL"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        style={{ width: "300px", marginRight: "1rem" }}
      />
      <button onClick={handleClone}>Clone</button>
    </div>
  );
}

export default Clone;
