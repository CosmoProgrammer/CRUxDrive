import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
}

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken: TokenPayload = jwtDecode(token);
        setProfilePicture(decodedToken.picture || null);
      } catch (error) {
        console.error("Invalid token", error);
      }
    }
  }, []);

  let closeTimeout: ReturnType<typeof setTimeout>;

  const handleMouseEnter = () => {
    clearTimeout(closeTimeout);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeout = setTimeout(() => setIsOpen(false), 200);
  };

  return (
    <div style={styles.container}>
      <div
        style={styles.menuContainer}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <FaBars style={styles.menuIcon} />
        {isOpen && (
          <div
            style={styles.dropdown}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              to="/home"
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
                ...(location.pathname === "/shared"
                  ? styles.activeMenuItem
                  : {}),
              }}
            >
              Shared With Me
            </Link>
            <Link
              to="/groups"
              style={{
                ...styles.menuItem,
                ...(location.pathname === "/groups"
                  ? styles.activeMenuItem
                  : {}),
              }}
            >
              Groups
            </Link>
          </div>
        )}
      </div>

      {profilePicture && (
        <img
          src={profilePicture}
          alt="User Profile"
          style={styles.profilePicture}
        />
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
    justifyContent: "space-between",
  },
  menuContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  menuIcon: {
    fontSize: "24px",
    cursor: "pointer",
    color: "#333",
  },
  dropdown: {
    position: "absolute",
    top: "40px",
    left: 0,
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
  profilePicture: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    cursor: "pointer",
  },
};

export default Sidebar;
