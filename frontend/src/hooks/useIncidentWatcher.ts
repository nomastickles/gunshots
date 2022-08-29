import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../actions";
import { DELAY_MS } from "../constants";
import * as selectors from "../selectors";
import { AppSteps } from "../types";

const useIncidentWatcher = () => {
  const dispatch = useDispatch();
  const stepMap = useSelector(selectors.getStepMap);
  const startNextIncident = stepMap[AppSteps.INIT_NEXT_INCIDENT];

  /**
   * system to loop through incidents
   */
  useEffect(() => {
    // return;
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

    setTimeout(() => {
      dispatch(actions.setStepValue({ step: AppSteps.HIDE_INCIDENT }));
    }, DELAY_MS * 7);

    setTimeout(() => {
      dispatch(actions.setStepValue({ step: AppSteps.INIT_NEXT_INCIDENT }));
    }, DELAY_MS * 7 + 2500);
  }, [dispatch, startNextIncident]);
};

export default useIncidentWatcher;
