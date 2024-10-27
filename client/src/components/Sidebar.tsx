import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaBars } from "react-icons/fa";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const enableMenu = () => {
    if (isOpen === false) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };
  //console.log(`location is ${location.pathname}`);

  return (
    <div style={styles.container}>
      {/* Menu Icon */}
      <FaBars onClick={enableMenu} style={styles.menuIcon} />

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={styles.dropdown}>
          <Link
            to="/"
            style={{
              ...styles.menuItem,
              ...(location.pathname === "/home" ? styles.activeMenuItem : {}),
            }}
          >
            Home
          </Link>
          <Link
            to="/shared"
            style={{
              ...styles.menuItem,
              ...(location.pathname === "/shared" ? styles.activeMenuItem : {}),
            }}
          >
            Shared With Me
          </Link>
          <Link
            to="/groups"
            style={{
              ...styles.menuItem,
              ...(location.pathname === "/groups" ? styles.activeMenuItem : {}),
            }}
          >
            Groups
          </Link>
        </div>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    padding: "10px",
  },
  menuIcon: {
    fontSize: "24px",
    cursor: "pointer",
    color: "#333",
  },
  dropdown: {
    position: "absolute",
    top: "40px",
    left: "10px",
    width: "150px",
    backgroundColor: "#fff",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    borderRadius: "8px",
    overflow: "hidden",
    zIndex: 10,
  },
  menuItem: {
    display: "block",
    padding: "12px 20px",
    color: "#333",
    textDecoration: "none",
    fontSize: "16px",
    fontWeight: "500",
    transition: "background-color 0.2s ease",
    cursor: "pointer",
  },
  activeMenuItem: {
    backgroundColor: "#1f0f0",
    fontWeight: "bold",
  },
};

export default Sidebar;
