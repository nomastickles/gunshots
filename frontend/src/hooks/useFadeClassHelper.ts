import * as React from "react";
import { useSelector } from "react-redux";
import * as selectors from "../selectors";

type FadeStrings = "animate__fadeIn" | "animate__fadeOut" | "invisible";

type UseFadeHelperProps = {
  classStart: FadeStrings;
  classEnd: FadeStrings;
};

const classPrefix = "animate__animated animate__slow";

const useFadeHelper = ({ classStart, classEnd }: UseFadeHelperProps) => {
  const currentIncidentIndex = useSelector(selectors.getCurrentIncidentIndex);
  const [visibleClass, setVisibleClass] = React.useState(
    `${classPrefix} ${classStart}`
  );

  React.useEffect(() => {
    if (currentIncidentIndex !== undefined) {
      // things have really started
      setVisibleClass(`${classPrefix} ${classEnd}`);
    }
  }, [classEnd, currentIncidentIndex]);

  return visibleClass;
};

export default useFadeHelper;
