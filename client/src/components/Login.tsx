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
        <div style={styles.container}>
          <h1 style={styles.title}>Login with Google</h1>
          <div style={styles.buttonContainer}>
            <div style={styles.googleButtonWrapper}>
              <GoogleLogin onSuccess={handleSuccess} onError={handleFailure} />
            </div>
          </div>
        </div>
      </GoogleOAuthProvider>
    </>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "20px",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "center",
  },
  googleButtonWrapper: {
    padding: "10px 20px",
    fontSize: "16px",
    //backgroundColor: "#4285F4",
    color: "#fff",
    borderRadius: "5px",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
    cursor: "pointer",
  },
};

export default Login;
