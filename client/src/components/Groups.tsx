import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FileStructureDisplay from "./HomePageComponents/FileStructureDisplay";
import GroupCard from "./GroupCard";

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
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myGroups, setMyGroups] = useState<Group[]>([]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      fetchMyGroups(token);
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
  };

  const handleShowPublicClick = () => {
    if (isPublic) {
      setIsPublic(false);
    } else {
      setIsPublic(true);
    }
  };

  return (
    <>
      <h1>Groups</h1>
      <input
        type="button"
        value="Create Group"
        onClick={handleShowCreateGroup}
      />
      {showCreateGroup && (
        <form>
          Group Name:{" "}
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          isPublic:{" "}
          <input
            type="checkbox"
            checked={isPublic}
            onClick={handleShowPublicClick}
          />
          <input type="submit" onClick={(e) => handleSubmitGroup(e)} />
        </form>
      )}
      {myGroups.map((group) => (
        <li key={group.groupId}>
          <GroupCard group={group} />
        </li>
      ))}
    </>
  );
};

export default Groups;
