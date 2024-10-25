import React, { useState } from "react";
import {
  FaFolder,
  FaFileAlt,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

interface FileStructure {
  key: string;
  lastModified: string;
  size: string;
}

interface Folder {
  name: string;
  key: string;
  files: FileStructure[];
  folders: Folder[];
}

interface CardProps {
  file: FileStructure | Folder;
  isFolder: boolean;
  filesInsideFolder?: FileStructure[];
  foldersInsideFolder?: Folder[];
  toggleSelection: (key: string, folderOrNot: boolean) => void;
  selectedItems: Set<string>;
}

const SERVERPATH = process.env.REACT_APP_SERVER_PATH || "http://localhost:8000";

const FileCard = ({
  file,
  isFolder,
  filesInsideFolder,
  foldersInsideFolder,
  toggleSelection,
  selectedItems,
}: CardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const itemKey = isFolder ? (file as Folder).key : (file as FileStructure).key;
  const isSelected = selectedItems.has(itemKey);

  const toggleFolder = () => setIsOpen(!isOpen);

  const fetchFileURL = async (fileKey: string) => {
    try {
      const response = await fetch(`${SERVERPATH}/getDownloadURL`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: fileKey }),
      });
      const url = await response.json();
      console.log(url);
      window.location.href = url;
    } catch (error) {
      console.error("Error fetching file URL:", error);
    }
  };

  const handleClick = () => {
    if (!isFolder) {
      fetchFileURL((file as FileStructure).key);
      console.log("Fetching URL");
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSelection(itemKey, isFolder);
  };

  const folderLastModified =
    filesInsideFolder && filesInsideFolder.length > 0
      ? filesInsideFolder[0].lastModified
      : null;

  return (
    <div
      style={{
        ...styles.card,
        ...(isSelected ? styles.selectedCard : {}),
        ...(isFolder ? {} : styles.fileButton),
      }}
      onClick={handleClick}
    >
      <div style={styles.cardHeader}>
        <div style={styles.iconAndName}>
          <input
            type="checkbox"
            checked={isSelected}
            onClick={handleCheckboxClick}
            style={{ marginRight: "10px" }}
          />
          {isFolder ? (
            <FaFolder color="#FDB813" style={{ marginRight: "10px" }} />
          ) : (
            <FaFileAlt color="#4285F4" style={{ marginRight: "10px" }} />
          )}

          <span style={styles.fileName}>
            {isFolder ? (file as Folder).name : (file as FileStructure).key}
          </span>

          {isFolder && (
            <button onClick={toggleFolder} style={styles.toggleButton}>
              {isOpen ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          )}
        </div>

        <div style={styles.fileInfo}>
          {!isFolder && <span>{(file as FileStructure).size}</span>}
          {isFolder && folderLastModified && (
            <span>{new Date(folderLastModified).toLocaleDateString()}</span>
          )}
          {!isFolder && (
            <span>
              {new Date(
                (file as FileStructure).lastModified
              ).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {isFolder && isOpen && (
        <div style={styles.folderContents}>
          {foldersInsideFolder?.map((innerFolder) => (
            <FileCard
              key={innerFolder.name}
              file={innerFolder}
              isFolder={true}
              filesInsideFolder={innerFolder.files}
              foldersInsideFolder={innerFolder.folders}
              toggleSelection={toggleSelection}
              selectedItems={selectedItems}
            />
          ))}

          {filesInsideFolder?.map((innerFile) => (
            <FileCard
              key={innerFile.key}
              file={innerFile}
              isFolder={false}
              toggleSelection={toggleSelection}
              selectedItems={selectedItems}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: "#fff",
    borderRadius: "5px",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    padding: "10px",
    marginBottom: "10px",
    width: "100%",
  },
  selectedCard: {
    backgroundColor: "#e0f7fa",
    border: "1px solid #4fc3f7",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
  },
  fileButton: {
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: "#f0f0f0",
    },
  },
  iconAndName: {
    display: "flex",
    alignItems: "center",
  },
  fileName: {
    fontSize: "16px",
    fontWeight: "500",
  },
  fileInfo: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    color: "#555",
    fontSize: "14px",
  },
  toggleButton: {
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    marginLeft: "10px",
    fontSize: "14px",
  },
  folderContents: {
    paddingLeft: "20px",
    paddingTop: "10px",
  },
};

export default FileCard;
