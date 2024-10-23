import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const SERVERPATH = process.env.REACT_APP_SERVER_PATH || "http://localhost:8000";

const Home = () => {
  interface File {
    key: string;
    size: number;
    lastModified: string;
  }
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      fetchFileStructure(token);
    }
  }, [navigate]);

  const fetchFileStructure = async (token: string) => {
    try {
      const response = await fetch(`${SERVERPATH}/getFileStructure`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        let data = await response.json();
        data.fileStructure.splice(0, 1);
        console.log(data);
        setFiles(data.fileStructure);
      } else {
        console.error("Failed to get file structure");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1>Your Files</h1>
      {loading ? (
        <p>Loading files...</p>
      ) : (
        <ul>
          {files.map((file) => (
            <li key={file.key}>
              <b>{file.key}</b> - {file.size} bytes - Last modified:{" "}
              {new Date(file.lastModified).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default Home;
