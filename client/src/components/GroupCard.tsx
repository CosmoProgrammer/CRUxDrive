import React from "react";
import { useNavigate } from "react-router-dom";

interface Group {
  groupId: string;
  name: string;
  owner: string;
  isPublic: boolean;
}

interface Props {
  group: Group;
  showButtons?: boolean;
  showJoinButton?: boolean;
  showLeaveButton?: boolean;
}

const SERVERPATH = process.env.REACT_APP_SERVER_PATH || "http://localhost:8000";

const GroupCard = ({
  group,
  showButtons = true,
  showJoinButton = false,
  showLeaveButton = false,
}: Props) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleCardClick = () => {
    navigate(
      `/group/${group.isPublic}/${showButtons}/${
        group.groupId
      }/${encodeURIComponent(group.name)}`
    );
  };

  const handleJoinGroup = async () => {
    console.log(group.groupId);
    const groupId = group.groupId;
    console.log(groupId, typeof groupId);
    const response = await fetch(`${SERVERPATH}/joinGroup`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ groupId: groupId }),
    });
    let data = await response.json();
    console.log(data);
  };

  const handleLeaveGroup = async () => {
    console.log(group.groupId);
    const groupId = group.groupId;
    console.log(groupId, typeof groupId);
    const response = await fetch(`${SERVERPATH}/leaveGroup`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToBeRemoved: groupId }),
    });
    let data = await response.json();
    console.log(data);
  };

  return (
    <div style={styles.card} onClick={handleCardClick}>
      <h2 style={styles.title}>{group.name}</h2>
      <p style={styles.owner}>Owner: {group.owner}</p>
      <p style={styles.access}>
        Access: {group.isPublic ? "Public" : "Private"}
      </p>

      {showJoinButton && (
        <button
          style={styles.joinButton}
          onClick={(e) => {
            e.stopPropagation();
            handleJoinGroup();
          }}
        >
          Join Group
        </button>
      )}

      {showLeaveButton && (
        <button
          style={styles.leaveButton}
          onClick={(e) => {
            e.stopPropagation();
            handleLeaveGroup();
          }}
        >
          Leave Group
        </button>
      )}
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  card: {
    width: "300px",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    backgroundColor: "#fff",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    position: "relative",
  },
  title: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#333",
    marginBottom: "10px",
  },
  owner: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "10px",
  },
  access: {
    fontSize: "14px",
    color: "#007BFF",
    fontWeight: "500",
    marginBottom: "15px",
  },
  joinButton: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    marginTop: "10px",
  },
  leaveButton: {
    padding: "10px 20px",
    fontSize: "16px",
    backgroundColor: "#f44336",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    marginTop: "10px",
  },
};

export default GroupCard;
