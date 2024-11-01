import React, { useState } from "react";
import FileCard from "./FileCard";
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
  uploadObjectsToGroup?: boolean;
  groupId?: string;
  groupName?: string;
  groupRelativeKey?: string;
  refetch?: () => void;
  bookmarkRefetch?: () => void;
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

const FileStructureDisplay = ({
  fileStructures,
  showButtons,
  uploadObjectsToGroup = false,
  groupId = "",
  groupName = "",
  groupRelativeKey = "",
  refetch = () => {
    console.log("Refetfch placeholder");
  },
  bookmarkRefetch = () => {
    console.log("Bookmark refetch placeholder");
  },
}: Props) => {
  const token = localStorage.getItem("token");
  const folderHierarchy = parseFileStructure(fileStructures);
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

  const handleFileChange = (e: any) => {
    console.log("File changed");
    const file = e.target.files[0];
    setFile(Array.from(e.target.files));
  };

  async function handleFileSubmit() {
    console.log("hi");
    if (!File.length) {
      return;
    }
    console.log("Handling submit");
    for (const file of File) {
      let toUploadTo = Array.from(selectedItems)[0];
      if (toUploadTo[-1] !== "/") {
        toUploadTo = toUploadTo + "/";
      }
      const fileKey = `${toUploadTo}${file.name}`;
      const signedUrl = await getS3SignedURL(fileKey, file.type); // Get signed URL for each file
      await pushToS3(signedUrl, file); // Upload each file to S3
    }
    refetch();
  }

  async function handleDelete() {
    console.log("Deleting");
    console.log(selectedItems);
    const response = await fetch(`${SERVERPATH}/delete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Array.from(selectedItems)),
    });
    const reply = await response.json();
    console.log(reply);
    refetch();
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

  const enableShare = () => {
    if (showShare === false) {
      setShowShare(true);
    } else {
      setShowShare(false);
    }
    console.log(selectedItems);
  };

  async function handleShareEmailSubmit(e: any) {
    e.preventDefault();
    console.log("sharing");
    console.log(selectedItems);
    console.log(emailToShare);
    const response = await fetch(`${SERVERPATH}/shareToEmail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: Array.from(selectedItems),
        email: emailToShare,
      }),
    });
    const reply = await response.json();
    console.log(reply);
    setShowLockFileField(false);
  }

  async function handleCreateFolderSubmit(e: any) {
    e.preventDefault();
    let toUploadTo = Array.from(selectedItems)[0];
    if (toUploadTo[-1] !== "/") {
      toUploadTo = toUploadTo + "/";
    }
    const response = await fetch(`${SERVERPATH}/createFolder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: toUploadTo,
        name: folderName,
      }),
    });
    const url = await response.json();
    console.log(url);
    refetch!();
  }

  async function handleLock() {
    console.log(Array.from(selectedItems)[0]);
    if (showLockFileField === false) {
      setShowLockFileField(true);
    } else {
      setShowLockFileField(false);
    }
  }

  async function handleLockPasswordSubmit() {
    console.log(lockedFilePassword);
    console.log(Array.from(selectedItems)[0]);
    const response = await fetch(`${SERVERPATH}/lockFileFolder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: Array.from(selectedItems)[0],
        password: lockedFilePassword,
      }),
    });
    const result = await response.json();
    console.log(result);
    setShowLockFileField(false);
  }

  async function handleBookmark() {
    const response = await fetch(`${SERVERPATH}/bookmarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ selectedObjects: Array.from(selectedItems) }),
    });
    const reply = await response.json();
    bookmarkRefetch();
  }

  async function handleUploadObjectsToGroup() {
    console.log("uploadingtogrp");
    const toSendToGroup = Array.from(selectedItems);
    const response = await fetch(`${SERVERPATH}/uploadKeysToGroup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        toSendToGroup,
        groupId,
        groupName,
        groupRelativeKey,
      }),
    });
    const reply = await response.json();
    console.log(reply);
  }

  return (
    <>
      {showButtons && (
        <div style={styles.mainContainer}>
          <div style={styles.leftContainer}>
            {showUpload && (
              <div style={styles.uploadContainer}>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  style={styles.fileInput}
                />
                <button onClick={handleFileSubmit} style={styles.submitButton}>
                  Submit
                </button>
              </div>
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

            {showLock && (
              <button onClick={handleLock} style={styles.lockButton}>
                Lock File/Folder
              </button>
            )}
            <br />

            {showLockFileField && (
              <form style={styles.form}>
                <label style={styles.label}>
                  Enter Password
                  <input
                    type="password"
                    value={lockedFilePassword}
                    onChange={(e) => setLockedFilePassword(e.target.value)}
                    style={styles.input}
                  />
                </label>
                <button
                  onClick={handleLockPasswordSubmit}
                  style={styles.submitButton}
                >
                  Submit
                </button>
              </form>
            )}

            {selectedItems.size > 0 && (
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
                  onClick={handleShareEmailSubmit}
                  style={styles.submitButton}
                >
                  Submit
                </button>
              </form>
            )}
            <br />
            {selectedItems.size > 0 && (
              <button onClick={handleBookmark} style={styles.lockButton}>
                Bookmark
              </button>
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
      {uploadObjectsToGroup && (
        <button
          onClick={handleUploadObjectsToGroup}
          style={styles.submitButton}
        >
          Submit
        </button>
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

export default FileStructureDisplay;
