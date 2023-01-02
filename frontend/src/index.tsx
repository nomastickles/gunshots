import React from "react";
import { createRoot } from "react-dom/client";
import { ContextProvider } from "./context";
import App from "./App";
import "./index.css";

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
