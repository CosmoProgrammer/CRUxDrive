import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FileStructureDisplay from "./HomePageComponents/FileStructureDisplay";

const SERVERPATH = process.env.REACT_APP_SERVER_PATH || "http://localhost:8000";

const SharedWithMe = () => {
  interface File {
    key: string;
    size: string;
    lastModified: string;
    redirectKey: string;
  }
  const [files, setFiles] = useState<File[]>([]);
  const fetchFileStructure = async (token: string) => {
    try {
      console.log("sending");
      const response = await fetch(`${SERVERPATH}/getSharedFilesFolders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("got");
      if (response.ok) {
        let data = await response.json();
        console.log(data);
        setFiles(data.fileStructure);
        setLoading(false);
      } else {
        console.error("Failed to get file structure");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      fetchFileStructure(token);
    }
  }, [navigate]);

  return (
    <>
      <h1>Shared with me</h1>
      {!loading ? (
        <FileStructureDisplay fileStructures={files} showButtons={false} />
      ) : (
        <p>Loading shared files</p>
      )}
    </>
  );
};

export default SharedWithMe;
