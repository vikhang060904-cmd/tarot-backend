import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import "./index.css";

import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(

  <React.StrictMode>

    <GoogleOAuthProvider
      clientId="26506370221-ucrnjduq50naerlghgukbqtp1vatee9j.apps.googleusercontent.com"
    >

      <App />

    </GoogleOAuthProvider>

  </React.StrictMode>
);