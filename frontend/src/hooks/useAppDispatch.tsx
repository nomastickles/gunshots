import React from "react";
import { DispatchContext } from "../context";

export const useAppDispatch = () => {
  const dispatch = React.useContext(DispatchContext);

  return dispatch;
};
