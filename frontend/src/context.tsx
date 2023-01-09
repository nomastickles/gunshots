import { AnyAction } from "@reduxjs/toolkit";
import React from "react";
import { initialState, AppSlice } from "./slice";

const initialDispatch: React.Dispatch<AnyAction> = () => {
  return;
};
const StateContext = React.createContext(initialState);
const DispatchContext = React.createContext(initialDispatch);

interface Props {
  children: React.ReactNode;
}

const ContextProvider = ({ children }: Props): React.ReactElement => {
  const [state, dispatch] = React.useReducer(AppSlice.reducer, initialState);
  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  );
};

export { ContextProvider, StateContext, DispatchContext };
