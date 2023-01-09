import React from "react";
import useFadeClassHelper from "../hooks/useFadeClassHelper";

function Loader() {
  const visibleClass = useFadeClassHelper({
    classStart: "animate__fadeIn",
    classEnd: "animate__fadeOut",
  });

  return (
    <div
      className="flex top-2 justify-center items-center w-full fixed"
      data-testid="loader"
    >
      <div className={`space-x-1 text-red-300 ${visibleClass}`}>
        <span className="">Loading...</span>
      </div>
    </div>
  );
}

export default Loader;
