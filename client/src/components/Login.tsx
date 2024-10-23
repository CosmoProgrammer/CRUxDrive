import React from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const CLIENTID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";
const SERVERPATH = process.env.REACT_APP_SERVER_PATH || "http://localhost:8000";
console.log(CLIENTID);

const Login = () => {
  const navigate = useNavigate();

  const handleSuccess = async (res: any) => {
    try {
      const token = res.credential;
      const response = await fetch(`${SERVERPATH}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: token }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        navigate("/home");
      } else {
        console.error(data.message);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFailure = () => {
    console.error("login failed");
  };

  return (
    <>
      <GoogleOAuthProvider clientId={CLIENTID}>
        <h1>Login with Google</h1>
        <GoogleLogin onSuccess={handleSuccess} onError={handleFailure} />
      </GoogleOAuthProvider>
    </>
  );
};

export default Login;
