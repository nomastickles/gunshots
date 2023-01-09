import { useEffect } from "react";
import * as actions from "../actions";
import { DELAY_MS } from "../constants";
import { AppSteps } from "../types";
import { useAppDispatch } from "./useAppDispatch";
import { useAppState } from "./useAppState";

const useIncidentWatcher = () => {
  const dispatch = useAppDispatch();
  const { stepMap } = useAppState();
  const startNextIncident = stepMap[AppSteps.INIT_NEXT_INCIDENT];

  /**
   * system to loop through incidents
   */
  useEffect(() => {
    if (!startNextIncident) {
      return;
    }

    dispatch(actions.selectNextIncident());

    setTimeout(() => {
      dispatch(actions.setStepValue({ step: AppSteps.ISOLATE_US_TERRITORY }));
    }, DELAY_MS);

    setTimeout(() => {
      dispatch(actions.setStepValue({ step: AppSteps.SHOW_INCIDENT }));
    }, DELAY_MS * 2);

    setTimeout(() => {
      dispatch(
        actions.setStepValue({
          step: AppSteps.ISOLATE_US_TERRITORY,
          clear: true,
        })
      );
    }, DELAY_MS * 6);

    // setTimeout(() => {
    //   dispatch(actions.setStepValue({ step: AppSteps.HIDE_INCIDENT }));
    // }, DELAY_MS * 7);

    // setTimeout(() => {
    //   dispatch(actions.setStepValue({ step: AppSteps.INIT_NEXT_INCIDENT }));
    // }, DELAY_MS * 7 + 2500);
  }, [dispatch, startNextIncident]);
};

export default useIncidentWatcher;
