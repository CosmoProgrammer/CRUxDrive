import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FileStructureDisplay from "./HomePageComponents/FileStructureDisplay";

const SERVERPATH = process.env.REACT_APP_SERVER_PATH || "http://localhost:8000";

const UploadObjectToGroup = () => {
  interface File {
    key: string;
    size: string;
    lastModified: string;
    redirectKey: string;
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

  const { groupId, relativeKey, groupName } = useParams();
  let relKey = decodeURIComponent(relativeKey!);

  console.log(groupId, relKey);

  return (
    <>
      <h1>Upload objects to group</h1>
      {loading ? (
        <p>Loading files...</p>
      ) : (
        <>
          <FileStructureDisplay
            fileStructures={files}
            showButtons={false}
            uploadObjectsToGroup={true}
            groupId={groupId}
            groupName={groupName}
            groupRelativeKey={relKey}
          />{" "}
        </>
      )}
    </>
  );
};

export default UploadObjectToGroup;
