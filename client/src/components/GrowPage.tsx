import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import GroupFileStructureDisplay from "./GroupFileStructureDisplay";

const SERVERPATH = process.env.REACT_APP_SERVER_PATH || "http://localhost:8000";

const GroupPage = () => {
  const { showShare, showButtons, groupId, name } = useParams();

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  interface File {
    key: string;
    size: string;
    lastModified: string;
    redirectKey: string;
  }
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      fetchFileStructure(token);
    }
  }, [navigate]);

  const fetchFileStructure = async (token: string) => {
    try {
      const response = await fetch(`${SERVERPATH}/getGroupFileStructure`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId: groupId,
          groupName: decodeURIComponent(name!),
        }),
      });
      if (response.ok) {
        let data = await response.json();
        //data.fileStructure.splice(0, 1);
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
      <div style={styles.container}>
        <h1 style={styles.title}>Group Details</h1>
        <p style={styles.text}>Group ID: {groupId}</p>
        <p style={styles.text}>Group Name: {decodeURIComponent(name!)}</p>
      </div>
      {loading ? (
        <p>Loading files...</p>
      ) : (
        <>
          <GroupFileStructureDisplay
            fileStructures={files}
            showButtons={JSON.parse(showButtons!)}
            groupId={groupId}
            groupName={decodeURIComponent(name!)}
            showShareButton={!JSON.parse(showShare!)}
          />
        </>
      )}
    </>
  );
};

const styles = {
  container: {
    padding: "20px",
    maxWidth: "600px",
    margin: "0 auto",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  text: {
    fontSize: "16px",
    color: "#555",
  },
};
export default GroupPage;
