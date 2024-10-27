import React, { useState } from "react";
import {
  FaFolder,
  FaFileAlt,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import {
  MdImage,
  MdPictureAsPdf,
  MdTextSnippet,
  MdAudiotrack,
  MdVideocam,
} from "react-icons/md";

interface FileStructure {
  key: string;
  lastModified: string;
  size: string;
  redirectKey: string;
}

interface Folder {
  name: string;
  key: string;
  files: FileStructure[];
  folders: Folder[];
  redirectKey: string;
}

interface CardProps {
  file: FileStructure | Folder;
  isFolder: boolean;
  filesInsideFolder?: FileStructure[];
  foldersInsideFolder?: Folder[];
  toggleSelection: (key: string, folderOrNot: boolean) => void;
  selectedItems: Set<string>;
  redirectKey: string;
}

const SERVERPATH = process.env.REACT_APP_SERVER_PATH || "http://localhost:8000";

const FileCard = ({
  file,
  isFolder,
  filesInsideFolder,
  foldersInsideFolder,
  toggleSelection,
  selectedItems,
  redirectKey,
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
      fetchFileURL((file as FileStructure).redirectKey);
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

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()!.toLowerCase();
    switch (extension) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "bmp":
        return <MdImage color="#4caf50" style={{ marginRight: "10px" }} />;
      case "pdf":
        return (
          <MdPictureAsPdf color="#f44336" style={{ marginRight: "10px" }} />
        );
      case "txt":
      case "doc":
      case "docx":
        return (
          <MdTextSnippet color="#2196f3" style={{ marginRight: "10px" }} />
        );
      case "mp3":
      case "wav":
      case "aac":
        return <MdAudiotrack color="#9c27b0" style={{ marginRight: "10px" }} />;
      case "mp4":
      case "mov":
      case "avi":
      case "mkv":
        return <MdVideocam color="#ff9800" style={{ marginRight: "10px" }} />;
      default:
        return <FaFileAlt color="#4285F4" style={{ marginRight: "10px" }} />;
    }
  };

  function formatFileSize(b: string) {
    let bytes = parseFloat(b);
    if (bytes === 0) return "0 Bytes";
    const units = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + units[i];
  }

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
            getFileIcon((file as FileStructure).key)
          )}

          <span style={styles.fileName}>
            {isFolder
              ? (file as Folder).name
              : (file as FileStructure).key.split("/").pop()}
          </span>

          {isFolder && (
            <button onClick={toggleFolder} style={styles.toggleButton}>
              {isOpen ? <FaChevronUp /> : <FaChevronDown />}
            </button>
          )}
        </div>

        <div style={styles.fileInfo}>
          {!isFolder && (
            <span>{formatFileSize((file as FileStructure).size)}</span>
          )}
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
              redirectKey={innerFolder.redirectKey}
            />
          ))}

          {filesInsideFolder?.map((innerFile) => (
            <FileCard
              key={innerFile.key}
              file={innerFile}
              isFolder={false}
              toggleSelection={toggleSelection}
              selectedItems={selectedItems}
              redirectKey={innerFile.redirectKey}
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
