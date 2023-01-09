import React from "react";
import { createRoot } from "react-dom/client";
import { ContextProvider } from "./context";
import App from "./App";
import "./index.css";
import reportWebVitals from "./reportWebVitals";

const container =
  document.getElementById("root")! || document.createElement("div")!; // for testing purposes;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ContextProvider>
      <App />
    </ContextProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
