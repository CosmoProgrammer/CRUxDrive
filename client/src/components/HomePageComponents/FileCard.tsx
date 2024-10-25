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
  files: FileStructure[];
  folders: Folder[];
}

interface CardProps {
  file: FileStructure | Folder;
  isFolder: boolean;
  filesInsideFolder?: FileStructure[];
  foldersInsideFolder?: Folder[];
}

const FileCard = ({
  file,
  isFolder,
  filesInsideFolder,
  foldersInsideFolder,
}: CardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFolder = () => setIsOpen(!isOpen);

  const folderLastModified =
    filesInsideFolder && filesInsideFolder.length > 0
      ? filesInsideFolder[0].lastModified
      : null;

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={styles.iconAndName}>
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
              foldersInsideFolder={innerFolder.folders} // Render nested folders
            />
          ))}

          {filesInsideFolder?.map((innerFile) => (
            <FileCard key={innerFile.key} file={innerFile} isFolder={false} />
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
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
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
