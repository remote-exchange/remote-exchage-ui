import React, { useState } from 'react';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import classes from './select-sort.module.css';
import {ClickAwayListener} from '@mui/material';
import {Close} from "@mui/icons-material";

const SortSelect = (props) => {
  const {appTheme} = useAppThemeContext();
  const {value, options, handleChange, sortDirection, className} = props;
  const [open, setOpen] = useState(false);

  const changeState = () => {
    setOpen(!open);
  };

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <div className={[classes.sortSelect, open ? classes.sortSelectOpened : ''].join(' ')}>
        <div className={classes.selectedOption} onClick={changeState}>
          <div
            className={['g-flex', 'g-flex--align-center', 'g-flex__item'].join(' ')}
            title={options.find(it => it.id === value).label}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.26872 7.999L8.40008 6.86788L5.7656 4.23436C5.45288 3.92188 4.946 3.92188 4.63424 4.23436L2 6.86788L3.13136 7.99996L4.4 6.73108V19H6.00008V6.73108L7.26872 7.999Z" fill="#131313"/>
              <path d="M21.2001 4H10V5.60008H21.2001V4Z" fill="#131313"/>
              <path d="M18.8001 8.4502H10V10.0503H18.8001V8.4502Z" fill="#131313"/>
              <path d="M16.4001 12.9004H10V14.5005H16.4001V12.9004Z" fill="#131313"/>
              <path d="M14.0001 17.3506H10V18.9504H14.0001V17.3506Z" fill="#131313"/>
            </svg>
          </div>
        </div>

        {open &&
          <div className={[classes.opts, className ? className : ''].join(" ")}>
            <div className={classes.optsHead}>
              <div className={classes.optsHeadTitle}>
                Sort
              </div>

              <span className={classes.optsHeadClose} onClick={changeState}>
                <Close style={{ fontSize: 14, color: "#ff", fill: "#fff" }} />
              </span>
            </div>

            <div className={classes.optsBody}>
              {options?.map((option) => {
                return (
                  <div
                    key={option.id}
                    className={classes.menuOption}
                    onClick={() => {
                      setOpen(false);
                      handleChange({target: {value: option.id}});
                    }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontFamily: 'PT Root UI',
                        fontWeight: 500,
                        fontSize: 14,
                        lineHeight: '20px',
                        color: '#F6F7F9'
                      }}
                    >
                      {option.label ? (
                        option.label
                      ) : (
                        <>
                          <span style={{ marginRight: 8 }}>{option.labelPart1}</span>
                          <span style={{ color: '#9A9FAF' }}>{option.labelPart2}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        }
      </div>
    </ClickAwayListener>
  );
};

export default SortSelect;
