import React from "react";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import { Routes as Switch, Route } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import LockedFileAccess from "./components/HomePageComponents/LockedFileAccess";
import SharedWithMe from "./components/SharedWithMe";

function App() {
  return (
    <>
      CRUxDrive <br />
      <Switch>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/locked" element={<LockedFileAccess />} />
        <Route path="/shared" element={<SharedWithMe />} />
        <Route path="/" element={<>home</>} />
      </Switch>
    </>
  );
}

export default App;
