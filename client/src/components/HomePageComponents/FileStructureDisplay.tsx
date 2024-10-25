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
  const [File, setFile] = useState(null);

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
    await pushToS3(url, File);
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
    setFile(file);
  };
  async function handleFileSubmit() {
    console.log("hi");
    if (!File) return;
    console.log("Handling submit");
    const url = await getS3SignedURL(
      `${Array.from(selectedItems)[0]}${File["name"]}`,
      File["type"]
    );
  }

  const toggleSelection = (key: string, folderOrNot: boolean) => {
    setSelectedItems((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(key)) {
        newSelected.delete(key);
        if (folderOrNot) {
          setShowUpload(false);
        }
      } else {
        newSelected.add(key);
        if (folderOrNot && newSelected.size === 1) {
          setShowUpload(true);
        }
      }
      return newSelected;
    });
  };

  console.log(folderHierarchy);
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
      )}
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
