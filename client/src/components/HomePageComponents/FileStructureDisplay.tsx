import React, { useState } from "react";
import FileCard from "./FileCard";
import { AsyncResource } from "async_hooks";

interface FileStructure {
  key: string;
  size: string;
  lastModified: string;
}
interface Folder {
  name: string;
  key: string;
  files: FileStructure[];
  folders: Folder[];
}

type Props = { fileStructures: FileStructure[] };

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

  return rootFolders;
};

const FileStructureDisplay = ({ fileStructures }: Props) => {
  const folderHierarchy = parseFileStructure(fileStructures);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showUpload, setShowUpload] = useState(false);
  const [File, setFile] = useState<any[]>([]);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [showLock, setShowLock] = useState(false);
  const [showLockFileField, setShowLockFileField] = useState(false);
  const [lockedFilePassword, setLockedFilePassword] = useState("");

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
    setShowCreateFolder(true);
  };

  async function handleCreateFolderSubmit() {
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
  }

  async function handleLock() {
    console.log(Array.from(selectedItems)[0]);
    setShowLockFileField(true);
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
  }

  return (
    <>
      {showUpload ? (
        <>
          <input type="file" multiple onChange={handleFileChange} />
          <input
            onClick={() => handleFileSubmit()}
            type="button"
            value="Submit"
          />
        </>
      ) : (
        <></>
      )}{" "}
      <br />
      {selectedItems.size > 0 ? (
        <>
          <input onClick={handleDelete} type="button" value="Delete" />
        </>
      ) : (
        <></>
      )}{" "}
      <br />
      {showUpload ? (
        <>
          <input
            onClick={enableCreateFolder}
            type="button"
            value="Create Folder"
          />
        </>
      ) : (
        <></>
      )}{" "}
      <br />
      {showCreateFolder ? (
        <>
          <form>
            <label>
              Enter File Name
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
              />
              <input
                onClick={() => handleCreateFolderSubmit()}
                type="button"
                value="Submit"
              />
            </label>
          </form>
        </>
      ) : (
        <></>
      )}{" "}
      <br />
      {showLock ? (
        <>
          <input onClick={handleLock} type="button" value="Lock File/Folder" />
        </>
      ) : (
        <></>
      )}{" "}
      <br />
      {showLockFileField ? (
        <>
          <form>
            <label>
              Enter Password
              <input
                type="password"
                value={lockedFilePassword}
                onChange={(e) => setLockedFilePassword(e.target.value)}
              />
              <input
                onClick={() => handleLockPasswordSubmit()}
                type="button"
                value="Submit"
              />
            </label>
          </form>
        </>
      ) : (
        <></>
      )}{" "}
      <br />
      <div style={styles.container}>
        {folderHierarchy.map((folder) => (
          <FileCard
            key={folder.name}
            file={{ key: folder.name, lastModified: "", size: "" }}
            isFolder={true}
            filesInsideFolder={folder.files}
            foldersInsideFolder={folder.folders}
            toggleSelection={toggleSelection}
            selectedItems={selectedItems}
          />
        ))}
      </div>
    </>
  );
};

const styles = {
  container: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "20px",
  },
};

export default FileStructureDisplay;
