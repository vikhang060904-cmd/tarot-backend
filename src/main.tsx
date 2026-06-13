import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";
import "./components/tarot-patch.css";
import App from "./App";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { LanguageProvider } from "./i18n/LanguageContext";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(

  <React.StrictMode>
    <LanguageProvider>
      <GoogleOAuthProvider
        clientId="26506370221-ucrnjduq50naerlghgukbqtp1vatee9j.apps.googleusercontent.com"
      >

        <App />

      </GoogleOAuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);