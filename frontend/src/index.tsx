import React from "react";
import "./index.css";
import App from "./App";
import { Provider } from "react-redux";
import { createRoot } from "react-dom/client";

import { configureStore } from "@reduxjs/toolkit";
import { AppSlice } from "./slice";

const container = document.getElementById("root")!;
const root = createRoot(container);

export const store = configureStore({
  reducer: {
    [AppSlice.name]: AppSlice.reducer,
    // [OtherSlice.name]: OtherSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
