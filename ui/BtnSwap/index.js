import React, { useState } from "react";
import { useAppThemeContext } from "../AppThemeProvider";
import { Typography, Button } from "@mui/material";
import Loader from "../Loader";

const BtnSwap = (props) => {
  const {label, className, labelClassName, isDisabled, onClick, loading} = props;
  const [disabledState, setDisabledState] = useState(isDisabled);
  const {appTheme} = useAppThemeContext();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [bgColorLight, setBgColorLight] = useState(
    isDisabled ? "#A3A9BA" : "#8F5AE8",
  );
  const [bgColorDark, setBgColorDark] = useState(
    isDisabled ? "#7F828B" : "#8F5AE8",
  );
  const [borderColorLight, setBorderColorLight] = useState(
    isDisabled ? "#D4D5DB" : "#D2D0F2",
  );
  const [borderColorDark, setBorderColorDark] = useState(
    isDisabled ? "#494B51" : "#33284C",
  );

  window.addEventListener("resize", () => {
    setWindowWidth(window.innerWidth);
  });

  const mouseOver = () => {
    if (isDisabled) {
      return;
    }

    setBgColorLight("#8F5AE8");
    setBorderColorLight("#C6BAF0");

    setBgColorDark("#8F5AE8");
    setBorderColorDark("#402E61");
  };

  const mouseOut = () => {
    if (isDisabled) {
      return;
    }

    setBgColorLight("#8F5AE8");
    setBorderColorLight("#D2D0F2");

    setBgColorDark("#8F5AE8");
    setBorderColorDark("#33284C");
  };

  const mouseDown = () => {
    if (isDisabled) {
      return;
    }

    setBgColorLight("#8F5AE8");
    setBorderColorLight("#B9A4EE");

    setBgColorDark("#8F5AE8");
    setBorderColorDark("#523880");
  };

  const updateState = () => {
    if (disabledState !== isDisabled) {
      setDisabledState(isDisabled);

      setBgColorLight(isDisabled ? "#A3A9BA" : "#8F5AE8");
      setBorderColorLight(isDisabled ? "#D4D5DB" : "#D2D0F2");

      setBgColorDark(isDisabled ? "#7F828B" : "#8F5AE8");
      setBorderColorDark(isDisabled ? "#494B51" : "#33284C");
    }
    return (
      <></>
    );
  };

  return (
    <div
      className={className}
      style={{
        position: "relative",
        cursor: isDisabled ? "default" : "pointer",
      }}
      onMouseOver={mouseOver}
      onMouseOut={mouseOut}
      onMouseDown={mouseDown}
      onMouseUp={mouseOut}>
      <>
        {updateState()}
        <div
          className={['g-flex', 'g-flex--align-center', 'g-flex--justify-center'].join(' ')}
          onClick={onClick}
          style={{ minWidth: 163, height: 64 }}
        >
          <div
            className={labelClassName}
            style={{
              userSelect: "none",
              pointerEvents: "none",
              lineHeight: '120%',
            }}
          >
            {`${label}`}
            {/*{loading && (
              <div style={{ marginLeft: 13 }}>
                <Loader color={"#060B17"} />
              </div>
            )}*/}
          </div>
          
        </div>
      </>
    </div>
  );
};

export default BtnSwap;
