import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { Provider } from "react-redux";

import { configureStore } from "@reduxjs/toolkit";
import { AppSlice } from "./slice";

export const store = configureStore({
  reducer: {
    [AppSlice.name]: AppSlice.reducer,
    // [OtherSlice.name]: OtherSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

const container =
  document.getElementById("root")! || document.createElement("div")!; // for testing purposes;
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
