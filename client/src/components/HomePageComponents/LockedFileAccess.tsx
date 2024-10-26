import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SERVERPATH = process.env.REACT_APP_SERVER_PATH || "http://localhost:8000";

const LockedFileAccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Extract the key from the URL
  const queryParams = new URLSearchParams(location.search);
  const fileKey = queryParams.get("key");

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      console.log("HI");
      const response = await fetch(`${SERVERPATH}/validatePassword`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: fileKey, password }),
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        setError("Invalid password. Please try again.");
      }
    } catch (error) {
      console.error("Error validating password:", error);
      setError("An error occurred. Please try again later.");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <h2>Enter Password for Access</h2>
      <form onSubmit={handlePasswordSubmit}>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ display: "block", width: "100%", margin: "10px 0" }}
          />
        </label>
        <button type="submit">Submit</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default LockedFileAccess;
