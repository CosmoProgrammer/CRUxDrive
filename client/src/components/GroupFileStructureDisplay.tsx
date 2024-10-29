import React, { useState } from "react";
import FileCard from "./HomePageComponents/FileCard";
import { useNavigate } from "react-router-dom";
import { AsyncResource } from "async_hooks";

interface FileStructure {
  key: string;
  size: string;
  lastModified: string;
  redirectKey: string;
}
interface Folder {
  name: string;
  key: string;
  files: FileStructure[];
  folders: Folder[];
  redirectKey: string;
}

type Props = {
  fileStructures: FileStructure[];
  showButtons: boolean;
  groupId: string | undefined;
  groupName: string | undefined;
  showShareButton?: boolean;
};

const SERVERPATH = process.env.REACT_APP_SERVER_PATH || "http://localhost:8000";

const parseFileStructure = (fileStructures: FileStructure[]): Folder[] => {
  const rootFolders: Folder[] = [];
  const folderMap: { [folderPath: string]: Folder } = {};

  fileStructures.forEach((file) => {
    const parts = file.key.split("/");

    let currentFolderPath = "";
    let currentFolder: Folder | undefined;

    parts.forEach((part, index) => {
      if (!part) return;
      if (index === parts.length - 1 && !file.key.endsWith("/")) {
        if (currentFolder) {
          currentFolder.files.push(file);
        }
      } else {
        currentFolderPath += part + "/";
        if (!folderMap[currentFolderPath]) {
          const newFolder: Folder = {
            name: part,
            key: currentFolderPath,
            files: [],
            folders: [],
            redirectKey: currentFolderPath,
          };
          folderMap[currentFolderPath] = newFolder;
          if (currentFolder) {
            currentFolder.folders.push(newFolder);
          } else {
            rootFolders.push(newFolder);
          }
        }
        currentFolder = folderMap[currentFolderPath];
      }
    });
  });
  console.log(rootFolders);
  return rootFolders;
};

const GroupFileStructureDisplay = ({
  fileStructures,
  showButtons,
  groupId,
  groupName,
  showShareButton = false,
}: Props) => {
  const folderHierarchy = parseFileStructure(fileStructures);
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showUpload, setShowUpload] = useState(false);
  const [File, setFile] = useState<any[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [showLock, setShowLock] = useState(false);
  const [showLockFileField, setShowLockFileField] = useState(false);
  const [lockedFilePassword, setLockedFilePassword] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [emailToShare, setEmailToShare] = useState("");
  const token = localStorage.getItem("token");

  async function getS3SignedURL(key: string, type: string) {
    const response = await fetch(`${SERVERPATH}/getUploadURL`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key: key, contentType: type }),
    });
    const url = await response.json();
    console.log(url);
    return url;
  }

  async function pushToS3(url: string, file: any) {
    console.log("pushing");
    console.log(url);
    const response = await fetch(String(url), {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });
  }

  async function handleFileSubmit() {
    const relativeKey = Array.from(selectedItems)[0];
    navigate(
      `/uploadToGroup/${groupId}/${encodeURIComponent(
        relativeKey
      )}/${groupName}`
    );
  }

  async function handleDelete() {
    console.log("Deleting");
    const objectsToDelete = Array.from(selectedItems);
    const response = await fetch(`${SERVERPATH}/deleteObjectsInGroup`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ objectsToDelete, groupId }),
    });
    const reply = await response.json();
    console.log(reply);
  }

  const toggleSelection = (key: string, folderOrNot: boolean) => {
    setSelectedItems((prev) => {
      setShowLockFileField(false);
      setShowCreateFolder(false);
      const newSelected = new Set(prev);
      if (newSelected.has(key)) {
        newSelected.delete(key);
        if (folderOrNot) {
          setShowUpload(false);
          setShowCreateFolder(false);
        }
        if (!folderOrNot && newSelected.size === 1) {
          setShowLock(true);
        }
        if (folderOrNot && newSelected.size === 1) {
          setShowUpload(true);
        }
      } else {
        newSelected.add(key);
        if (folderOrNot && newSelected.size === 1) {
          setShowUpload(true);
          setShowLock(true);
        }
        if (newSelected.size > 1) {
          setShowUpload(false);
          setShowCreateFolder(false);
          setShowLock(false);
        }
        if (!folderOrNot && newSelected.size === 1) {
          setShowLock(true);
        }
      }
      if (newSelected.size === 0) {
        setShowUpload(false);
        setShowCreateFolder(false);
        setShowLock(false);
      }
      console.log(newSelected);
      return newSelected;
    });
  };

  const enableCreateFolder = () => {
    if (showCreateFolder === false) {
      setShowCreateFolder(true);
    } else {
      setShowCreateFolder(false);
    }
  };

  async function handleShareEmailSubmit(e: any) {
    console.log("Sharing");
    e.preventDefault();
    const response = await fetch(`${SERVERPATH}/addEmailToGroup`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ groupId: groupId, email: emailToShare }),
    });
    let data = await response.json();
    console.log(data);
  }

  const enableShare = () => {
    if (showShare === false) {
      setShowShare(true);
    } else {
      setShowShare(false);
    }
    console.log(selectedItems);
  };

  async function handleCreateFolderSubmit(e: any) {
    e.preventDefault();
    let toUploadTo = Array.from(selectedItems)[0];
    if (toUploadTo[-1] !== "/") {
      toUploadTo = toUploadTo + "/";
    }
    const response = await fetch(`${SERVERPATH}/createGroupFolder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        key: toUploadTo,
        name: folderName,
        groupId: groupId,
      }),
    });
    const url = await response.json();
    console.log(url);
  }

  return (
    <>
      {showButtons && (
        <div style={styles.mainContainer}>
          <div style={styles.leftContainer}>
            {showUpload && (
              <button onClick={handleFileSubmit} style={styles.lockButton}>
                Upload Objects
              </button>
            )}
            <br />

            {selectedItems.size > 0 && (
              <>
                <button onClick={handleDelete} style={styles.deleteButton}>
                  Delete
                </button>
              </>
            )}
            <br />

            {showUpload && (
              <>
                <button onClick={enableCreateFolder} style={styles.button}>
                  Create Folder
                </button>
              </>
            )}
            <br />

            {showCreateFolder && (
              <form style={styles.form}>
                <label style={styles.label}>
                  Enter Folder Name
                  <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    style={styles.input}
                  />
                </label>
                <button
                  onClick={(e) => handleCreateFolderSubmit(e)}
                  style={styles.submitButton}
                >
                  Submit
                </button>
              </form>
            )}
            <br />
            {showShareButton && (
              <button onClick={enableShare} style={styles.lockButton}>
                Share File(s)/Folder(s)
              </button>
            )}

            {showShare && (
              <form style={styles.form}>
                <label style={styles.label}>
                  Enter Email Address
                  <input
                    type="email"
                    value={emailToShare}
                    onChange={(e) => setEmailToShare(e.target.value)}
                    style={styles.input}
                  />
                </label>
                <button
                  onClick={(e) => handleShareEmailSubmit(e)}
                  style={styles.submitButton}
                >
                  Submit
                </button>
              </form>
            )}
          </div>
          <br />
          <div style={styles.rightContainer}>
            {folderHierarchy.map((folder) => (
              <FileCard
                key={folder.name}
                file={{
                  key: folder.name,
                  lastModified: "",
                  size: "",
                  name: folder.name,
                  redirectKey: folder.redirectKey,
                }}
                isFolder={true}
                filesInsideFolder={folder.files}
                foldersInsideFolder={folder.folders}
                toggleSelection={toggleSelection}
                selectedItems={selectedItems}
                redirectKey={folder.redirectKey}
              />
            ))}
          </div>
        </div>
      )}
      {!showButtons && (
        <div style={styles.rightContainer}>
          {folderHierarchy.map((folder) => (
            <FileCard
              key={folder.name}
              file={{
                key: folder.name,
                lastModified: "",
                size: "",
                name: folder.name,
                redirectKey: folder.redirectKey,
              }}
              isFolder={true}
              filesInsideFolder={folder.files}
              foldersInsideFolder={folder.folders}
              toggleSelection={toggleSelection}
              selectedItems={selectedItems}
              redirectKey={folder.redirectKey}
            />
          ))}
        </div>
      )}
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  mainContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  leftContainer: {
    width: "35%",
    padding: "10px",
    borderRight: "1px solid #ddd",
  },
  rightContainer: {
    width: "70%",
    padding: "10px",
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },
  uploadContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
  },
  fileInput: {
    padding: "8px",
    fontSize: "14px",
    borderRadius: "5px",
    border: "1px solid #ddd",
    cursor: "pointer",
    width: "60%",
  },
  submitButton: {
    padding: "10px 15px",
    fontSize: "16px",
    color: "#fff",
    backgroundColor: "#4CAF50",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  button: {
    display: "inline-block",
    padding: "10px 15px",
    margin: "10px 0",
    fontSize: "16px",
    color: "#fff",
    backgroundColor: "#4CAF50",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  deleteButton: {
    display: "inline-block",
    padding: "10px 15px",
    margin: "10px 0",
    fontSize: "16px",
    color: "#fff",
    backgroundColor: "#f44336",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  lockButton: {
    display: "inline-block",
    padding: "10px 15px",
    margin: "10px 0",
    fontSize: "16px",
    color: "#fff",
    backgroundColor: "#FF9800",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "20px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "bold",
    marginBottom: "5px",
    width: "90%",
  },
  input: {
    padding: "8px",
    fontSize: "14px",
    borderRadius: "5px",
    border: "1px solid #ddd",
    width: "100%",
  },
};

export default GroupFileStructureDisplay;
