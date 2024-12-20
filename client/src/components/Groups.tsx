import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FileStructureDisplay from "./HomePageComponents/FileStructureDisplay";
import GroupCard from "./GroupCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const SERVERPATH = process.env.REACT_APP_SERVER_PATH || "http://localhost:8000";

interface Group {
  groupId: string;
  name: string;
  owner: string;
  isPublic: boolean;
}

const Groups = () => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingTwo, setLoadingTwo] = useState(false);
  const [loadingThree, setLoadingThree] = useState(false);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [myGroupsIAmIn, setMyGroupsIAmIn] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      fetchMyGroups(token);
      fetchGroupIAmIn(token);
      fetchPublicGroups(token);
    }
  }, [navigate]);

  const fetchMyGroups = async (token: any) => {
    try {
      const response = await fetch(`${SERVERPATH}/getAllMyGroups`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        let data = await response.json();
        setMyGroups(data);
        console.log(data);
      } else {
        console.error("Failed to get groups");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupIAmIn = async (token: any) => {
    try {
      const response = await fetch(`${SERVERPATH}/getAllGroupsYouArePartOf`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        let data = await response.json();
        setMyGroupsIAmIn(data);
        return data;
      } else {
        console.error("Failed to get groups");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTwo(false);
    }
  };

  const fetchPublicGroups = async (token: any) => {
    try {
      const response = await fetch(`${SERVERPATH}/getAllPublicGroups`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        let data = await response.json();
        setPublicGroups(data);
        console.log(data);
      } else {
        console.error("Failed to get groups");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingThree(false);
    }
  };

  const handleShowCreateGroup = () => {
    if (showCreateGroup) {
      setShowCreateGroup(false);
    } else {
      setShowCreateGroup(true);
    }
  };

  const handleSubmitGroup = async (e: any) => {
    e.preventDefault();
    console.log(groupName, isPublic);
    const response = await fetch(`${SERVERPATH}/createNewGroup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ groupName, isPublic }),
    });
    const reply = await response.json();
    console.log(reply);
    refetchMyGroups();
    if (isPublic) {
      refetchPublicGroups();
    }
    setShowCreateGroup(false);
  };

  const handleShowPublicClick = () => {
    if (isPublic) {
      setIsPublic(false);
    } else {
      setIsPublic(true);
    }
  };

  const {
    data: GroupsIAmIn,
    isLoading: GroupsIAmInLoading,
    isError: GroupsIAmInError,
    refetch: refetchGroupsIAmIn,
  } = useQuery({
    queryKey: ["GroupsIAmIn"],
    queryFn: () => fetchGroupIAmIn(token!),
    refetchOnWindowFocus: false,
  });

  const {
    data: PublicGroups,
    isLoading: PublicGroupsLoading,
    isError: PublicGroupsEror,
    refetch: refetchPublicGroups,
  } = useQuery({
    queryKey: ["PublicGroups"],
    queryFn: () => fetchPublicGroups(token!),
    refetchOnWindowFocus: false,
  });

  const {
    data: MyGroups,
    isLoading: MyGroupsLoading,
    isError: MyGroupsEror,
    refetch: refetchMyGroups,
  } = useQuery({
    queryKey: ["MyGroups"],
    queryFn: () => fetchMyGroups(token!),
    refetchOnWindowFocus: false,
  });

  return (
    <div style={styles.gridContainer}>
      {/* Create Group Section */}
      <div
        style={{
          ...styles.createGroupSection,
          alignItems: showCreateGroup ? "flex-start" : "center",
          justifyContent: showCreateGroup ? "flex-start" : "center",
        }}
      >
        <input
          type="button"
          value="Create Group"
          onClick={handleShowCreateGroup}
          style={
            showCreateGroup ? styles.createButtonTop : styles.createButtonCenter
          }
        />
        {showCreateGroup && (
          <form style={styles.createGroupForm}>
            <label style={styles.label}>
              Group Name:{"          "}
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                style={styles.input}
              />
            </label>
            <label style={styles.label}>
              isPublic:
              <input
                type="checkbox"
                checked={isPublic}
                onClick={handleShowPublicClick}
                style={styles.checkbox}
              />
            </label>
            <input
              type="submit"
              onClick={(e) => handleSubmitGroup(e)}
              style={styles.submitButton}
            />
          </form>
        )}
      </div>

      {/* Your Groups Section */}
      <div style={styles.yourGroupsSection}>
        <h2 style={styles.sectionTitle}>Your Groups</h2>
        <div style={styles.groupCardGrid}>
          {myGroups.map((group) => (
            <div key={group.groupId} style={styles.groupItem}>
              <GroupCard
                group={group}
                refetchGroupsIAmIn={refetchGroupsIAmIn}
                refetchPublicGroups={refetchPublicGroups}
                refetchMyGroups={refetchMyGroups}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Joined Groups Section */}
      <div style={styles.joinedGroupsSection}>
        <h2 style={styles.sectionTitle}>Groups You’ve Joined</h2>
        {myGroupsIAmIn.map((group) => (
          <div key={group.groupId} style={styles.groupItem}>
            <GroupCard
              group={group}
              showButtons={false}
              showLeaveButton={true}
              refetchGroupsIAmIn={refetchGroupsIAmIn}
              refetchPublicGroups={refetchPublicGroups}
              refetchMyGroups={refetchMyGroups}
            />
          </div>
        ))}
      </div>

      {/* Public Groups Section */}
      <div style={styles.publicGroupsSection}>
        <h2 style={styles.sectionTitle}>Browse Public Groups</h2>
        {publicGroups.map((group) => (
          <div key={group.groupId} style={styles.groupItem}>
            <GroupCard
              group={group}
              showButtons={false}
              showJoinButton={true}
              refetchGroupsIAmIn={refetchGroupsIAmIn}
              refetchPublicGroups={refetchPublicGroups}
              refetchMyGroups={refetchMyGroups}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
    gap: "20px",
    padding: "20px",
    height: "100vh",
  },
  createGroupSection: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexDirection: "column",
  },
  createButtonCenter: {
    padding: "20px 35px",
    fontSize: "18px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  createButtonTop: {
    padding: "10px 15px",
    backgroundColor: "#4CAF50",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  createGroupForm: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "15px",
    marginBottom: "10px",
  },
  input: {
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    marginTop: "5px",
    marginBottom: "10px",
  },
  checkbox: {
    marginLeft: "10px",
  },
  submitButton: {
    padding: "10px 15px",
    fontSize: "15px",
    backgroundColor: "#4285F4",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  yourGroupsSection: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    overflowY: "auto",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "15px",
    color: "#333",
  },
  groupCardGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "15px",
  },
  groupItem: {
    marginBottom: "15px",
  },
  joinedGroupsSection: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
  publicGroupsSection: {
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  },
};

export default Groups;
