import {MenuItem, Select, Typography} from '@mui/material';
import React, {useState} from 'react';
import {useAppThemeContext} from '../../ui/AppThemeProvider';
import classes from './select-token.module.css';
import {formatCurrency} from '../../utils';
import {useRouter} from "next/router";

function TokenSelect(props) {
  const {appTheme} = useAppThemeContext();
  const router = useRouter();
  const {value, options, symbol, handleChange, placeholder = ''} = props;

  const [openSelectToken, setOpenSelectToken] = useState(false);

  const openSelect = () => {
    setOpenSelectToken(!openSelectToken);
  };

  const noValue = value === null;

  const arrowIcon = () => {
    return (
      <svg style={{pointerEvents: 'none', position: 'absolute', right: 15}} width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.29289 8.79289L1.38995 2.88995C0.507999 2.008 1.13263 0.5 2.3799 0.5L13.6201 0.500001C14.8674 0.500001 15.492 2.008 14.6101 2.88995L8.70711 8.79289C8.31658 9.18342 7.68342 9.18342 7.29289 8.79289Z" fill="#B1F1E3"/>
      </svg>
    )
    // return (
      // <span className={classes.selectArrowIcon}></span>
    // )
    // return (
    //   <svg style={{pointerEvents: 'none', position: 'absolute', right: 16,}} width="18" height="9"
    //        viewBox="0 0 18 9" fill="none" xmlns="http://www.w3.org/2000/svg">
    //     <path
    //       d="M16.9201 0.949951L10.4001 7.46995C9.63008 8.23995 8.37008 8.23995 7.60008 7.46995L1.08008 0.949951"
    //       stroke="#D3F85A" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round"
    //       strokeLinejoin="round" />
    //   </svg>
    // );
  };

  return (
    <Select
      open={openSelectToken}
      onClick={openSelect}
      className={[classes.tokenSelect, classes[`tokenSelect--${appTheme}`], openSelectToken ? classes.tokenSelectOpen : '',].join(' ')}
      fullWidth
      classes={{
        select: classes.selectWrapper,
      }}
      MenuProps={{
        classes: {
          list: appTheme === 'dark' ? classes['list--dark'] : classes.list,
          paper: classes.listPaper,
        },
      }}
      value={value}
      {...{
        displayEmpty: noValue ? true : undefined,
        renderValue: noValue ? (selected) => {
          if (selected === null) {
            return (
              <div className={classes.placeholder}>
                {placeholder}
              </div>
            );
          }
        } : undefined,
      }}
      onChange={handleChange}
      IconComponent={arrowIcon}
      inputProps={{
        className: appTheme === 'dark' ? classes['tokenSelectInput--dark'] : classes.tokenSelectInput,
      }}>
      {(!options || !options.length) &&
        <div className={classes.noNFT}>
          <div className={classes.noNFTtext}>
            You receive NFT by creating a Lock of your CONE for some time, the more CONE you lock and for
            the longest time, the more Voting Power your NFT will have.
          </div>
          <div className={classes.noNFTlinks}>
                        <span className={classes.noNFTlinkButton} onClick={() => {
                          router.push("/swap")
                        }}>BUY CONE</span>
            <span className={classes.noNFTlinkButton} onClick={() => {
              router.push("/vest")
            }}>LOCK CONE FOR NFT</span>
          </div>
        </div>
      }
      {options?.map((option) => {
        return (
          <MenuItem
            key={option.id}
            value={option}>
            <div
              className={[classes.menuOption, 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
              <Typography
                style={{
                  fontWeight: 500,
                  fontSize: 16,
                  color: '#D3F85A',
                }}>
                #{option.id}
              </Typography>

              <div className={[classes.menuOptionSec, 'g-flex-column'].join(' ')}>
                <Typography
                  style={{
                    fontWeight: 400,
                    fontSize: 16,
                    color: '#8191B9',
                  }}>
                  {formatCurrency(option.lockValue)}
                  {symbol ? ' ' + symbol : ''}
                </Typography>

              </div>
            </div>
          </MenuItem>
        );
      })}
    </Select>
  );
}

export default TokenSelect;
