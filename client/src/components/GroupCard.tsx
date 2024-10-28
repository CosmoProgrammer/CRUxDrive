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
}

const GroupCard = ({ group }: Props) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/group/${group.groupId}/${encodeURIComponent(group.name)}`);
  };

  return (
    <div style={styles.card} onClick={handleCardClick}>
      <h2 style={styles.title}>{group.name}</h2>
      <p style={styles.owner}>Owner: {group.owner}</p>
      <p style={styles.access}>
        Access: {group.isPublic ? "Public" : "Private"}
      </p>
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
  },
};

export default GroupCard;
