import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
import FileStructureDisplay from "./HomePageComponents/FileStructureDisplay";

const SERVERPATH = process.env.REACT_APP_SERVER_PATH || "http://localhost:8000";

const SharedWithMe = () => {
  type FileTypeFilter = {
    images: boolean;
    pdfs: boolean;
    text: boolean;
    spreadsheets: boolean;
    presentations: boolean;
    audio: boolean;
    video: boolean;
    compressed: boolean;
    code: boolean;
    executables: boolean;
  };
  interface File {
    key: string;
    size: string;
    lastModified: string;
    redirectKey: string;
  }
  const [files, setFiles] = useState<File[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<File[]>(files);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>({
    images: false,
    pdfs: false,
    text: false,
    spreadsheets: false,
    presentations: false,
    audio: false,
    video: false,
    compressed: false,
    code: false,
    executables: false,
  });

  const fileExtensions: Record<string, string[]> = {
    images: ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "svg", "webp"],
    pdfs: ["pdf"],
    text: ["txt", "doc", "docx", "rtf", "odt"],
    spreadsheets: ["xls", "xlsx", "csv", "ods"],
    presentations: ["ppt", "pptx", "odp"],
    audio: ["mp3", "wav", "aac", "flac", "ogg", "m4a"],
    video: ["mp4", "avi", "mkv", "mov", "wmv", "flv"],
    compressed: ["zip", "rar", "7z", "tar", "gz"],
    code: [
      "js",
      "ts",
      "html",
      "css",
      "py",
      "java",
      "cpp",
      "c",
      "rb",
      "php",
      "go",
    ],
    executables: ["exe", "msi", "bin", "dmg", "sh", "apk"],
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

  const [minSize, setMinSize] = useState<number | "">("");
  const [maxSize, setMaxSize] = useState<number | "">("");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  const fetchFileStructure = async (token: string) => {
    try {
      console.log("sending");
      const response = await fetch(`${SERVERPATH}/getSharedFilesFolders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("got");
      if (response.ok) {
        let data = await response.json();
        console.log(data);
        setFiles(data.fileStructure);
        setLoading(false);
      } else {
        console.error("Failed to get file structure");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      fetchFileStructure(token);
    }
  }, [navigate]);

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

      const matchesSize =
        (minSize === "" || parseInt(file.size, 10) >= minSize) &&
        (maxSize === "" || parseInt(file.size, 10) <= maxSize);

      const lastModified = new Date(file.lastModified);
      const matchesDate =
        (!startDate || lastModified >= new Date(startDate)) &&
        (!endDate || lastModified <= new Date(endDate));

      return matchesFileType && matchesSize && matchesDate;
    });

    setFilteredFiles(filtered);
  };

  const handleMinSizeChange = (e: any) => {
    setMinSize(e.target.value === "" ? "" : parseInt(e.target.value, 10));
  };

  const handleMaxSizeChange = (e: any) => {
    setMaxSize(e.target.value === "" ? "" : parseInt(e.target.value, 10));
  };

  const handleStartDateChange = (e: any) => {
    setStartDate(e.target.value || null);
  };

  const handleEndDateChange = (e: any) => {
    setEndDate(e.target.value || null);
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
  }, [files, minSize, maxSize, startDate, endDate, fileTypeFilter]);

  return (
    <>
      <h1>Shared with me</h1>
      {!loading ? (
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
                    {Object.keys(fileTypeFilter).map((type) => (
                      <div key={type} style={styles.filterOption}>
                        <label>
                          <input
                            type="checkbox"
                            checked={
                              fileTypeFilter[type as keyof FileTypeFilter]
                            }
                            onChange={() =>
                              toggleFileTypeFilter(type as keyof FileTypeFilter)
                            }
                            style={styles.checkbox}
                          />
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </label>
                      </div>
                    ))}
                    <div style={styles.filterOption}>
                      <label>Min Size (bytes):</label>
                      <input
                        type="number"
                        value={minSize || ""}
                        onChange={handleMinSizeChange}
                        style={styles.sizeInput}
                      />
                    </div>
                    <div style={styles.filterOption}>
                      <label>Max Size (bytes):</label>
                      <input
                        type="number"
                        value={maxSize || ""}
                        onChange={handleMaxSizeChange}
                        style={styles.sizeInput}
                      />
                    </div>

                    {/* Date Filter */}
                    <div style={styles.filterOption}>
                      <label>Start Date:</label>
                      <input
                        type="date"
                        value={startDate || ""}
                        onChange={handleStartDateChange}
                        style={styles.dateInput}
                      />
                    </div>
                    <div style={styles.filterOption}>
                      <label>End Date:</label>
                      <input
                        type="date"
                        value={endDate || ""}
                        onChange={handleEndDateChange}
                        style={styles.dateInput}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <FileStructureDisplay
              fileStructures={filteredFiles}
              showButtons={false}
            />
          </div>
        </>
      ) : (
        <p>Loading shared files</p>
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

export default SharedWithMe;
