/**
 * Browser entry point.
 * Input: the #root mount from index.html plus App and global styles.
 * Output: the running React application in the browser document.
 * Processing: creates the React root and renders App in StrictMode.
 */
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
