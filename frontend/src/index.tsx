import React from "react";
import ReactDOM from "react-dom";
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

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
