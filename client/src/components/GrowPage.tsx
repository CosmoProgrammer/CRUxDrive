import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
import GroupFileStructureDisplay from "./GroupFileStructureDisplay";

const SERVERPATH = process.env.REACT_APP_SERVER_PATH || "http://localhost:8000";

const GroupPage = () => {
  type FileTypeFilter = {
    images: boolean;
    pdfs: boolean;
    text: boolean;
  };
  interface File {
    key: string;
    size: string;
    lastModified: string;
    redirectKey: string;
  }
  const { showShare, showButtons, groupId, name } = useParams();

  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<File[]>(files);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>({
    images: false,
    pdfs: false,
    text: false,
  });

  const fileExtensions: Record<string, string[]> = {
    images: ["jpg", "jpeg", "png", "gif"],
    pdfs: ["pdf"],
    text: ["txt", "doc", "docx"],
  };
  const fuse = new Fuse(files, {
    keys: ["key"],
    threshold: 0.4,
    distance: 100,
    shouldSort: true,
    minMatchCharLength: 2,
    findAllMatches: true,
    useExtendedSearch: true,
    ignoreLocation: true,
  });

  interface File {
    key: string;
    size: string;
    lastModified: string;
    redirectKey: string;
  }

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

  const toggleShowDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const toggleFileTypeFilter = (type: keyof FileTypeFilter): void => {
    const updatedFileTypeFilter: FileTypeFilter = {
      ...fileTypeFilter,
      [type]: !fileTypeFilter[type],
    };
    setFileTypeFilter(updatedFileTypeFilter);
    applyFilters(updatedFileTypeFilter);
  };

  const applyFilters = (fileTypeFilter: FileTypeFilter): void => {
    const typesToShow = Object.keys(fileTypeFilter).filter(
      (type) => fileTypeFilter[type as keyof FileTypeFilter]
    ) as (keyof FileTypeFilter)[];

    const filtered = files.filter((file) => {
      const matchesFileType =
        typesToShow.length === 0 ||
        typesToShow.some((type) =>
          fileExtensions[type].includes(file.key.split(".").pop() || "")
        );

      return matchesFileType;
    });

    setFilteredFiles(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.trim()) {
      const results = fuse.search(term).map((result) => result.item);
      setFilteredFiles(results);
    } else {
      applyFilters(fileTypeFilter);
    }
  };

  useEffect(() => {
    applyFilters(fileTypeFilter);
  }, [files]);

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
          <div style={styles.container}>
            <div style={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={handleSearch}
                style={styles.searchInput}
              />
              <div style={styles.filterContainer}>
                <button
                  style={styles.filterButton}
                  onClick={toggleShowDropdown}
                >
                  Filter ▼
                </button>
                {(showDropdown ||
                  Object.values(fileTypeFilter).some((v) => v)) && (
                  <div style={styles.dropdown}>
                    <div style={styles.filterOption}>
                      <label>
                        <input
                          type="checkbox"
                          checked={fileTypeFilter.images}
                          onChange={() => toggleFileTypeFilter("images")}
                          style={styles.checkbox}
                        />
                        Images
                      </label>
                    </div>
                    <div style={styles.filterOption}>
                      <label>
                        <input
                          type="checkbox"
                          checked={fileTypeFilter.pdfs}
                          onChange={() => toggleFileTypeFilter("pdfs")}
                          style={styles.checkbox}
                        />
                        PDFs
                      </label>
                    </div>
                    <div style={styles.filterOption}>
                      <label>
                        <input
                          type="checkbox"
                          checked={fileTypeFilter.text}
                          onChange={() => toggleFileTypeFilter("text")}
                          style={styles.checkbox}
                        />
                        Text Files
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <GroupFileStructureDisplay
              fileStructures={filteredFiles}
              showButtons={JSON.parse(showButtons!)}
              groupId={groupId}
              groupName={decodeURIComponent(name!)}
              showShareButton={!JSON.parse(showShare!)}
            />
          </div>
        </>
      )}
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: "20px",
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
  searchContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  searchInput: {
    padding: "8px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    width: "200px",
  },
  filterContainer: {
    position: "relative",
    display: "inline-block",
  },
  filterButton: {
    padding: "8px 12px",
    fontSize: "14px",
    cursor: "pointer",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    backgroundColor: "white",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    borderRadius: "4px",
    padding: "10px",
    zIndex: 1,
  },
  filterOption: {
    display: "flex",
    alignItems: "center",
    marginBottom: "5px",
  },
  checkbox: {
    marginRight: "8px",
  },
};
export default GroupPage;
