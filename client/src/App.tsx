import React from "react";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import { Routes as Switch, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";
import Home from "./components/Home";
import LockedFileAccess from "./components/HomePageComponents/LockedFileAccess";
import SharedWithMe from "./components/SharedWithMe";
import Groups from "./components/Groups";
import GroupPage from "./components/GrowPage";
import UploadObjectToGroup from "./components/UploadObjectToGroup";

function App() {
  return (
    <>
      CRUxDrive <br />
      <Sidebar />
      <Switch>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/locked" element={<LockedFileAccess />} />
        <Route path="/shared" element={<SharedWithMe />} />
        <Route path="/groups" element={<Groups />} />
        <Route
          path="/group/:showShare/:showButtons/:groupId/:name"
          element={<GroupPage />}
        />
        <Route
          path="/uploadToGroup/:groupId/:relativeKey/:groupName"
          element={<UploadObjectToGroup />}
        />
        <Route path="/" element={<>home</>} />
      </Switch>
    </>
  );
}

export default App;
