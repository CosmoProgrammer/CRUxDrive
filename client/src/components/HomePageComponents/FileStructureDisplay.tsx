import React, { useState } from "react";
import FileCard from "./FileCard";

interface FileStructure {
  key: string;
  size: string;
  lastModified: string;
}
interface Folder {
  name: string;
  files: FileStructure[];
  folders: Folder[];
}

type Props = { fileStructures: FileStructure[] };

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
          const newFolder: Folder = { name: part, files: [], folders: [] };
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
  console.log(folderHierarchy);
  return (
    <div style={styles.container}>
      {folderHierarchy.map((folder) => (
        <FileCard
          key={folder.name}
          file={{ key: folder.name, lastModified: "", size: "" }}
          isFolder={true}
          filesInsideFolder={folder.files}
          foldersInsideFolder={folder.folders} // Pass subfolders
        />
      ))}
    </div>
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
