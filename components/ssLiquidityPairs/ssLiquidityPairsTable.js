import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles, styled } from '@mui/styles';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Typography,
  Tooltip,
  Toolbar,
  IconButton,
  TextField,
  InputAdornment,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails, DialogTitle, DialogContent, Dialog, Slide,
} from '@mui/material';
import { useRouter } from "next/router";
import BigNumber from 'bignumber.js';
import {
  Close,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import SortSelect from '../select-sort/select-sort';
import { formatCurrency, formatInputAmount } from '../../utils';
import classes from './ssLiquidityPairs.module.css';
import css from './ssLiquidityPairs.module.css';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import TablePaginationActions from '../table-pagination/table-pagination';
import { formatSymbol } from '../../utils';
import SwitchCustom from '../../ui/Switch';
import { TableBodyPlaceholder } from '../../components/table';
import BoostCalculator from '../ssLiquidityManage/ssBoostCalculator';
import stores from '../../stores';

const Transition = React.forwardRef((props, ref) => (
    <Slide direction="up" {...props} ref={ref} />
));

function descendingComparator(a, b, orderBy) {
  if (!a || !b) {
    return 0;
  }

  switch (orderBy) {
    case 'pair':
      return formatSymbol(a.symbol).localeCompare(formatSymbol(b.symbol));
    case "tvl":
      if (BigNumber(b?.tvl).lt(a?.tvl)) {
        return -1;
      }
      if (BigNumber(b?.tvl).gt(a?.tvl)) {
        return 1;
      }
      return 0;
    case "apr":
      if (BigNumber(b?.gauge?.apr).lt(BigNumber(a?.gauge?.apr))) {
        // console.log(BigNumber(b?.gauge?.apr), BigNumber(a?.gauge?.apr), "1");
        return -1;
      }
      if (
        BigNumber(b?.gauge?.apr).div(100).times(40).gt(BigNumber(a?.gauge?.apr))
      ) {
        // console.log(BigNumber(b?.gauge?.apr), BigNumber(a?.gauge?.apr), "2");
        return 1;
      }
      return 0;
    case "balance":
      let balanceA = BigNumber(a?.token0?.balance)
        .plus(a?.token1?.balance)
        .toNumber();
      let balanceB = BigNumber(b?.token0?.balance)
        .plus(b?.token1?.balance)
        .toNumber();

      if (BigNumber(balanceB).lt(balanceA)) {
        return -1;
      }
      if (BigNumber(balanceB).gt(balanceA)) {
        return 1;
      }
      return 0;

    case 'poolBalance':
      let poolBalanceA = BigNumber(a.balance).div(a.totalSupply).times(a.reserve0)
        .plus(BigNumber(a.balance).div(a.totalSupply).times(a.reserve1))
        .toNumber();

      let poolBalanceB = BigNumber(b.balance).div(b.totalSupply).times(b.reserve0)
        .plus(BigNumber(b.balance).div(b.totalSupply).times(b.reserve1))
        .toNumber();

      if (BigNumber(poolBalanceB).lt(poolBalanceA)) {
        return -1;
      }
      if (BigNumber(poolBalanceB).gt(poolBalanceA)) {
        return 1;
      }
      return 0;

    case 'stakedBalance':
      if (!(a && a.gauge)) {
        return 1;
      }

      if (!(b && b.gauge)) {
        return -1;
      }

      if (BigNumber(b?.gauge?.balance).lt(a?.gauge?.balance)) {
        return -1;
      }
      if (BigNumber(b?.gauge?.balance).gt(a?.gauge?.balance)) {
        return 1;
      }
      return 0;

    case 'poolAmount':
      let reserveA = BigNumber(a?.reserve0).plus(a?.reserve1).toNumber();
      let reserveB = BigNumber(b?.reserve0).plus(b?.reserve1).toNumber();

      if (BigNumber(reserveB).lt(reserveA)) {
        return -1;
      }
      if (BigNumber(reserveB).gt(reserveA)) {
        return 1;
      }
      return 0;

    case 'stakedAmount':
      if (!(a && a.gauge)) {
        return 1;
      }

      if (!(b && b.gauge)) {
        return -1;
      }

      let stakedAmountA = BigNumber(a?.gauge?.reserve0).plus(a?.gauge?.reserve1).toNumber();
      let stakedAmountB = BigNumber(b?.gauge?.reserve0).plus(b?.gauge?.reserve1).toNumber();

      if (BigNumber(stakedAmountB).lt(stakedAmountA)) {
        return -1;
      }
      if (BigNumber(stakedAmountB).gt(stakedAmountA)) {
        return 1;
      }
      return 0;

    default:
      return 0;

  }
}

function getComparator(order, orderBy) {
  return order === 'desc' ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const headCells = [
  {
    id: 'pair',
    numeric: false,
    disablePadding: false,
    label: 'Asset',
    isSticky: true,
    isHideInDetails: true,
  },
  {
    id: 'tvl',
    numeric: true,
    disablePadding: false,
    label: <div style={{display: 'flex',}}>
      <span>TVL</span>
      {/*<Tooltip
          title='APR is based on current prices of tokens, token boosted APR, your veREMOTE amount, the % of TVL using veREMOTE and gauge TVL.'
          componentsProps={{
            tooltip: {
              style: {
                padding: 24,
                fontSize: 16,
                fontWeight: 400,
                lineHeight: '24px',
                
                border: '1px solid #779BF4',
                borderRadius: 12,

                background: '#1F2B49',
                color: '#E4E9F4',
              }},
          }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: 16,
          height: 16,
          borderRadius: 100,
          border: '1px solid #586586',
          marginLeft: 8,
        }}>
          <svg width="10" height="10" viewBox="0 0 5 9" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.23914 0.95C2.91914 0.95 3.46247 1.13667 3.86914 1.51C4.28247 1.88333 4.48914 2.39333 4.48914 3.04C4.48914 3.71333 4.27581 4.22 3.84914 4.56C3.42247 4.9 2.85581 5.07 2.14914 5.07L2.10914 5.86H1.11914L1.06914 4.29H1.39914C2.04581 4.29 2.53914 4.20333 2.87914 4.03C3.22581 3.85667 3.39914 3.52667 3.39914 3.04C3.39914 2.68667 3.29581 2.41 3.08914 2.21C2.88914 2.01 2.60914 1.91 2.24914 1.91C1.88914 1.91 1.60581 2.00667 1.39914 2.2C1.19247 2.39333 1.08914 2.66333 1.08914 3.01H0.0191407C0.0191407 2.61 0.109141 2.25333 0.289141 1.94C0.469141 1.62667 0.725807 1.38333 1.05914 1.21C1.39914 1.03667 1.79247 0.95 2.23914 0.95ZM1.59914 8.07C1.39247 8.07 1.21914 8 1.07914 7.86C0.939141 7.72 0.869141 7.54667 0.869141 7.34C0.869141 7.13333 0.939141 6.96 1.07914 6.82C1.21914 6.68 1.39247 6.61 1.59914 6.61C1.79914 6.61 1.96914 6.68 2.10914 6.82C2.24914 6.96 2.31914 7.13333 2.31914 7.34C2.31914 7.54667 2.24914 7.72 2.10914 7.86C1.96914 8 1.79914 8.07 1.59914 8.07Z" fill="#586586"/>
          </svg>
        </div>
      </Tooltip>*/}
    </div>,
    isHideInDetails: true,
  },
  {
    id: 'apr',
    numeric: true,
    disablePadding: false,
    label: 'APR %',
    isHideInDetails: true,
  },
  {
    id: 'poolBalance',
    numeric: true,
    disablePadding: false,
    label: 'My Pool',
  },
  {
    id: 'stakedBalance',
    numeric: true,
    disablePadding: false,
    label: 'My Stake',
  },
  {
    id: 'poolAmount',
    numeric: true,
    disablePadding: false,
    label: 'Total Liquidity',
    // isHideInDetails: true,
  },
  {
    id: 'stakedAmount',
    numeric: true,
    disablePadding: false,
    label: 'Total Stake',
  },
  {
    id: '',
    numeric: true,
    disablePadding: false,
    label: 'Actions',
    isHideInDetails: true,
  },
];

const StickyTableCell = styled(TableCell)(({theme, appTheme}) => ({
  color: appTheme === 'dark' ? '#C6CDD2 !important' : '#325569 !important',
  width: 310,
  left: 0,
  position: "sticky",
  // zIndex: 5,
  whiteSpace: 'nowrap',
  padding: '12px 24px 12px',
  background: '#131313',
}));

const StyledTableCell = styled(TableCell)(({theme, appTheme}) => ({
  // background: appTheme === 'dark' ? '#24292D' : '#CFE5F2',
  width: 'auto',
  whiteSpace: 'nowrap',
  padding: '15px 24px 16px',
}));

const sortIcon = (sortDirection) => {
  const {appTheme} = useAppThemeContext();

  return (
    <>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        style={{
          transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M5.83325 8.33337L9.99992 12.5L14.1666 8.33337H5.83325Z"
          fill={appTheme === 'dark' ? '#5F7285' : '#9BC9E4'}/>
      </svg>
    </>
  );
};

function EnhancedTableHead(props) {
  const {order, orderBy, onRequestSort} = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  const {appTheme} = useAppThemeContext();

  return (
    <TableHead>
      <TableRow
        style={{
          // borderBottom: '1px solid #9BC9E4',
          // borderColor: appTheme === 'dark' ? '#5F7285' : '#9BC9E4',
          whiteSpace: 'nowrap',
        }}>
        {
          headCells.map((headCell) => (
            <React.Fragment key={headCell.id + '_'}>
              {
                headCell.isSticky
                  ? <StickyTableCell
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    padding={'normal'}
                    sortDirection={orderBy === headCell.id ? order : false}
                    style={{
                      zIndex: 5,
                      background: '#131313',
                      borderBottom: '1px solid rgba(104, 114, 122, 0.4)',
                    }}>
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={createSortHandler(headCell.id)}
                      IconComponent={() => orderBy === headCell.id ? sortIcon(order) : null}>
                      <Typography
                        className={classes.headerText}
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          lineHeight: '16px',
                          color: '#9A9FAF',
                          textTransform: 'uppercase',
                        }}>
                        {headCell.label}
                      </Typography>
                      {/*{orderBy === headCell.id
                        ? <span className={classes.visuallyHidden}>
                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                          </span>
                        : null
                      }*/}
                    </TableSortLabel>
                  </StickyTableCell>
                  : <StyledTableCell
                    style={{
                      background: '#131313',
                      borderBottom: '1px solid rgba(104, 114, 122, 0.4)',
                      borderLeft: '1px solid rgba(104, 114, 122, 0.4)',
                      color: '#8191B9',
                    }}
                    key={headCell.id}
                    align={headCell.numeric ? 'right' : 'left'}
                    padding={'normal'}
                    sortDirection={orderBy === headCell.id ? order : false}>
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      IconComponent={() => orderBy === headCell.id ? sortIcon(order) : null}
                      style={{
                        color: appTheme === 'dark' ? '#C6CDD2' : '#325569',
                      }}
                      onClick={createSortHandler(headCell.id)}>
                      <div
                        className={classes.headerText}
                        style={{
                          fontWeight: 700,
                          fontSize: 16,
                          lineHeight: '16px',
                          textTransform: 'uppercase',
                          color: '#9A9FAF',
                        }}>
                        {headCell.label}
                      </div>
                      {/*{orderBy === headCell.id
                        ? <span className={classes.visuallyHidden}>
                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                  </span>
                        : null
                      }*/}
                    </TableSortLabel>
                  </StyledTableCell>
              }
            </React.Fragment>
          ))
        }
      </TableRow>
    </TableHead>
  );
}

EnhancedTableHead.propTypes = {
  classes: PropTypes.object.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
};

const useStyles = makeStyles({
  tooltipCircle: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: 16,
    height: 16,
    borderRadius: 100,
    border: '1px solid #586586',
  },
  infoContainer: {
    position: 'relative',
    padding: 22,
    marginTop: 26,
    display: 'flex',
    // width: '100%',
    background: 'rgba(6, 11, 23, 0.5)',
    border: '1px solid #1F2B49',
    borderRadius: 12,
  },
  infoContainerWarn: {
    color: '#18202f',
    position: 'absolute',
    left: 30,
    top: 20,
  },
  infoContainerText: {
    color: '#E4E9F4',
    fontSize: 16,
    fontWeight: 400,
    paddingLeft: 18,
  },
  tableWrapper: {
    overflowY: 'initial',
    ["@media (min-width:1920px)"]: {
      // paddingLeft: 400,
    },
  },
  tableContWrapper: {
    background: '#131313',
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    ["@media (min-width:806px)"]: {
      marginTop: 12,
    },
    ["@media (min-width:1333px)"]: {
      marginTop: 30,
    },
    ["@media (min-width:1483px)"]: {
      marginTop: 30,
    },
    ["@media (min-width:1920px)"]: {
      marginTop: 30,
    },
  },
  mobmsg: {
    display: 'flex',
    background: '#171D2D',
    borderRadius: 12,
    color: '#E4E9F4',
    fontSize: 20,
    fontWeight: 500,
    padding: '12px 24px',
    alignItems: 'center',
  },
  toolbarFirst: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: 64,
    position: 'relative',
    ["@media (max-width:805px)"]: {
      height: 'auto',
    },
    ["@media (min-width:1200px)"]: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  },
  toolbarTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  toolbarTitle: {
    fontSize: 40,
    fontWeight: 700,
    color: '#000000',
    lineHeight: '48px',
    // letterSpacing: '0.04em',
    textShadow: '2px 2px 0px #6575B1',
    textTransform: 'uppercase',
    ["@media (max-width:806px)"]: {
      fontSize: 24,
      lineHeight: '32px',
      textShadow: '1px 1px 0px #6575B1',
    },

  },
  toolbarRight: {

  },

  sidebar: {
    display: 'flex',
    width: '100%',
    background: '#131313',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    ["@media (max-width:806px)"]: {
      padding: 12,
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: 164,
      // flexWrap: 'wrap',
    },
    // flexDirection: 'column',
    // position: 'absolute',
    /*,
    ["@media (min-width:1333px)"]: {
      // flexDirection: 'row',
      flexWrap: 'unset',
    },
    ["@media (min-width:1483px)"]: {
      // flexDirection: 'row',
    },
    ["@media (min-width:1920px)"]: {
      flexDirection: 'column',
      width: '370px',
      position: 'absolute',
      left: -400,
    },*/
  },
  root: {
    width: '100%',
  },
  assetTableRow: {
    // '&:hover': {
    //   background: 'rgba(104, 114, 122, 0.12)',
    // },
    '&:last-child > td': {
      borderBottom: 'none !important',
    },
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1,
  },
  inline: {
    display: 'flex',
    alignItems: 'center',
  },
  inlineEnd: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  icon: {
    marginRight: '12px',
  },
  textSpaced: {
    lineHeight: '1.5',
    fontWeight: '200',
    fontSize: '12px',
  },
  headerText: {
    fontWeight: '500 !important',
    fontSize: '12px !important',
  },
  cell: {},
  cellSuccess: {
    color: '#4eaf0a',
  },
  cellAddress: {
    cursor: 'pointer',
  },
  aligntRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  skelly: {
    marginBottom: '12px',
    marginTop: '12px',
  },
  skelly1: {
    marginBottom: '12px',
    marginTop: '24px',
  },
  skelly2: {
    margin: '12px 6px',
  },
  tableBottomSkelly: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  assetInfo: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    padding: '24px',
    width: '100%',
    flexWrap: 'wrap',
    borderBottom: '1px solid rgba(104, 108, 122, 0.25)',
    background: 'radial-gradient(circle, rgba(63,94,251,0.7) 0%, rgba(47,128,237,0.7) 48%) rgba(63,94,251,0.7) 100%',
  },
  assetInfoError: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    padding: '24px',
    width: '100%',
    flexWrap: 'wrap',
    borderBottom: '1px rgba(104, 108, 122, 0.25)',
    background: '#dc3545',
  },
  infoField: {
    flex: 1,
  },
  flexy: {
    padding: '6px 0px',
  },
  overrideCell: {
    padding: '0px',
  },
  hoverRow: {
    cursor: 'pointer',
  },
  statusLiquid: {
    color: '#dc3545',
  },
  statusWarning: {
    color: '#FF9029',
  },
  statusSafe: {
    color: 'green',
  },
  imgLogoContainer: {
    padding: 1,
    width: 39,
    height: 39,
    borderRadius: '100px',
    background: 'rgb(25, 33, 56)',
    border: '2px solid #DBE6EC',
  },
  'imgLogoContainer--dark': {
    border: '2px solid #151718',
    ["@media (max-width:660px)"]: {
      border: '2px solid #24292d',
    },
  },
  imgLogoContainer2: {
    marginLeft: -10,
  },
  imgLogo: {
    width: 37,
    height: 37,
    margin: -2,
    borderRadius: '100px',
  },
  doubleImages: {
    display: 'flex',
    position: 'relative',
    width: '80px',
    height: '35px',
  },
  searchContainer: {
    display: 'flex',
  },
  textSearchField: {
    width: '100%',
    // paddingRight: 0,

    /*["@media (min-width:806px)"]: {
      width: 374,
      position: 'absolute',
      right: 86,
      top: 10,
      paddingRight: 0,
    },
    ["@media (min-width:1333px)"]: {
      width: 747,
      top: 100,
    },*/

  },
  searchInput: {
    // width: 747,
    height: 48,
    paddingRight: 12,
    border: '1px solid #9A9FAF',
    borderRadius: 12,
  
    '&:hover': {
      // backgroundColor: '#1F2B49 !important',
    },

    // zIndex: 99,
    '& > fieldset': {
      border: 'none',
    },
    /*["@media (max-width:1360px)"]: {
      // eslint-disable-line no-useless-computed-key
      position: 'absolute',
      top: 31,
      right: 0,
    },*/
    ["@media (max-width:1332px)"]: {
      position: 'relative',
      // top: '6px',
      left: 0,
      width: '100%',
    },
    ["@media (max-width:805px)"]: {
      height: 36,
      // marginTop: 2,
      paddingRight: 16,
    },
  },
  searchInputInput: {
    '&::placeholder': {
      color: '#8191B9 !important',
    },
    ["@media (max-width:805px)"]: {
      padding: '16px !important',
      fontSize: '14px !important'
    }
  },
  searchInputIcon: {
    display: 'flex',
    alignItems: 'center',
    height: '0.01em',
    maxHeight: '2em',
    ["@media (max-width: 767px)"]: {
      transform: 'scale(0.8)',
    }
  },
  actionsButtons: {
    ["@media (max-width:1332px)"]: {
      // position: 'absolute',
      // right: 0,
      // top: 0,
    },
  },
  myDeposits: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #B1F1E3',
    borderRadius: 12,
    marginRight: 22,
    padding: 2,
    ["@media (max-width:806px)"]: {
      margin: 0,
      borderRadius: 8,
    },
  },
  myDepositsBtn: {
    color: '#9A9FAF',
    fontSize: '16px',
    fontWeight: 500,
    width: 158,
    height: 44,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    ["@media (max-width:806px)"]: {
      width: '50%',
      height: 28,

    },
  },
  myDepositsBtnActive: {
    color: '#131313',
    fontSize: '16px',
    fontWeight: 500,
    background: '#B1F1E3',
    borderRadius: 10,
    width: 158,
    height: 44,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    ["@media (max-width:806px)"]: {
      width: '50%',
      height: 28,
      borderRadius: 6,
    },
  },
  myDepositsText: {
    fontWeight: 600,
    fontSize: 16,
    lineHeight: '24px',
    color: '#E4E9F4',
    paddingLeft: 10,
    ["@media (max-width:806px)"]: {
      // eslint-disable-line no-useless-computed-key
      display: 'flex',
      flexDirection: 'column',
    },
  },
  toolbar: {
    background: '#EAE8E1',
    boxShadow: '8px 8px 0px #6575B1',
    borderRadius: 20,
    // marginBottom: 30,
    padding: 20,
    minHeight: 'auto',
    ["@media (max-width:806px)"]: {
      paddingBottom: 10,
      boxShadow: '4px 4px 0px #6575B1',
      borderradius: 16,
    },
  },
  filterButton: {
    padding: 0,
    width: 72,
    height: 72,
    // marginLeft: 10,
    // borderRadius: 12,
    // position: 'absolute',
    // right: 0,
    // top: 0,
    ["@media (max-width:1332px)"]: {
      // position: 'absolute',
      // right: 0,
      // top: 10,
    },
    ["@media (max-width:805px)"]: {
      width: 24,
      height: 24,
      marginRight: 36,
    },
    // background: 'rgba(119, 155, 244, 0.15)',
    '&:hover': {
      // background: 'rgba(60,107,227,0.15)',
    },
    '&:active': {
      // background: 'rgba(85,128,236,0.15)',
      // border: '1px solid #4CADE6',
    },
  },
  searchButton: {
    width: 50,
    height: 50,
    marginLeft: 10,
    borderRadius: 100,
  },
  'searchButton--dark': {
    background: '#4CADE6',
    color: '#0A2C40',
    '&:hover': {
      background: '#5F7285',
    },
    '&:active': {
      background: '#5F7285',
      border: '1px solid #4CADE6',
    },
  },
  filterContainer: {
    minWidth: '272px',
    marginTop: '15px',
    padding: '24px',
    paddingBottom: '20px',
    boxShadow: '0 10px 20px 0 rgba(0,0,0,0.2)',
    borderRadius: 12,
    background: '#171D2D',
    border: '1px solid #779BF4',
  },
  alignContentRight: {
    textAlign: 'right',
  },
  labelColumn: {
    display: 'flex',
    alignItems: 'center',
  },
  filterItem: {
    position: 'relative',
    // padding: '5px 0',
    height: 52,
    border: '1px solid rgba(104, 114, 122, 0.4)',
    borderRadius: 12,
    marginBottom: 8,
    padding: '0 12px',
  },
  filterLabel: {
    fontSize: '20px',
    lineHeight: '28px',
    fontWeight: 700,
    letterSpacing: 0,
    color: '#F6F7F9',
  },
  filterListTitle: {
    fontWeight: 500,
    fontSize: 48,
    lineHeight: '52px',
    color: '#E4E9F4',
  },
  infoIcon: {
    color: '#06D3D7',
    fontSize: '16px',
    marginLeft: '10px',
  },
  symbol: {
    minWidth: '40px',
  },
  hiddenMobile: {
    // '@media (max-width: 1000px)': {
    //   display: 'none',
    // },
  },
  hiddenSmallMobile: {
    // '@media (max-width: 600px)': {
    //   display: 'none',
    // },
  },
  labelAdd: {
    display: 'none',
    fontSize: '12px',
    // '@media (max-width: 1000px)': {
    //   display: 'block',
    // },
  },
  addButton: {
    // marginTop: 30,
    display: 'flex',
    alignItems: 'center',
    borderRadius: 12,
    cursor: 'pointer',
    height: 64,
    width: 206,

    '&:hover > p': {
      // background: '#c4ff00',
    },
    ["@media (max-width:806px)"]: {
      position: 'absolute',
      height: 48,
      top: 109,
      left: 11,
      width: 'calc(100% - 22px)',
    },
    ["@media (min-width:1333px)"]: {
      // width: 248,
      // height: 72,
    },
    ["@media (min-width:1483px)"]: {
      // width: 248,
      // height: 72,
    },
    ["@media (min-width:1920px)"]: {
      // width: '100%',
      // height: 96,
      // marginTop: 30,
    },
  },
  actionButtonText: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // textTransform: 'uppercase',
    lineHeight: '32px',
    background: '#7DB857',
    color: '#FFFFFF',
    // transition: 'all ease 300ms',
    fontSize: 24,
    fontWeight: 700,
    ["@media (max-width:806px)"]: {
      lineHeight: '16px',
      fontWeight: 700,
      fontSize: 16,
    },
  },
  withdrawButton: {
    marginTop: 10,
    display: 'flex',
    alignItems: 'center',
    borderRadius: 12,
    height: 48,
    cursor: 'pointer',
    ["@media (min-width:806px)"]: {
      height: 72,
      width: 312,
      marginTop: 20,
      marginLeft: 20,
    },
    ["@media (min-width:1333px)"]: {
      width: 312,
      marginTop: 20,
      marginLeft: 20,
    },
    ["@media (min-width:1483px)"]: {
      width: 312,
      marginTop: 20,
      marginLeft: 20,
    },
    ["@media (min-width:1920px)"]: {
      width: '100%',
      marginLeft: 0,
    },
  },
  actionButtonWithdrawText: {
    background: 'rgba(119, 155, 244, 0.15)',
    color: '#779BF4',
    fontSize: 14,
    fontWeight: 600,
    border: '1px solid #779BF4',
    borderRadius: 12,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ["@media (min-width:806px)"]: {
      fontSize: 18,
    },
  },
  table: {
    tableLayout: 'auto',
    ["@media (max-width:1333px)"]: {
      marginBottom: 20,
    },
  },
  accordionSummaryContent: {
    margin: 0,
    padding: 0,
  },
  sortSelect: {
    position: 'absolute',
    right: 60,
    top: 14,
    width: 48,
    ["@media (max-width:805px)"]: {
      right: 0,
      width: 24,
      top: 4,
    },
  },
  sortSelectPosition: {
    right: -60,
  },
  cellPaddings: {
    padding: '8px 0',
    /*["@media (max-width:530px)"]: {
      // eslint-disable-line no-useless-computed-key
      padding: 10,
    },*/
  },
  cellHeadPaddings: {
    padding: '8px 0',
    minHeight: 58,
    ["@media (max-width:530px)"]: {
      // eslint-disable-line no-useless-computed-key
      // padding: '5px 10px',
    },
  },
  popoverPaper: {
    width: 272,
    minHeight: 292,
    padding: 0,
    background: 'none',
    border: 'none !important',
    boxShadow: '5px 5px 20px rgba(14, 44, 79, 0.25)',
    borderRadius: 0,
    overflow: 'hidden',
  },
  displayedRows: {
    fontSize: 12,
  },
  closePopover: {
    ['&:hover']: {
      backgroundColor: '#8191B9 !important',
    }
  }
});

const getLocalToggles = () => {
  let localToggles = {
    toggleActive: true,
    toggleActiveGauge: true,
    toggleVariable: true,
    toggleStable: true,
    showSearch: false,
  };
  // get locally saved toggles
  try {
    const localToggleString = localStorage.getItem('solidly-pairsToggle-v1');
    if (localToggleString && localToggleString.length > 0) {
      localToggles = JSON.parse(localToggleString);
    }
  } catch (ex) {
    console.log(ex);
  }

  return localToggles;
};

const EnhancedTableToolbar = (props) => {
  const classes = useStyles();
  const router = useRouter();

  const localToggles = getLocalToggles();

  const options = [
    {id: 'tvl--asc', label: 'TVL: high to low'},
    {id: 'tvl--desc', label: 'TVL: low to high'},
    {id: 'poolBalance--asc', label: 'My Pool: high to low'},
    {id: 'poolBalance--desc', label: 'My Pool: low to high'},
    {id: 'stakedBalance--asc', label: 'My Stake: high to low'},
    {id: 'stakedBalance--desc', label: 'My Stake: low to high'},
    {id: 'poolAmount--asc', label: 'Total Liquidity: high to low'},
    {id: 'poolAmount--desc', label: 'Total Liquidity: low to high'},
    {id: 'stakedAmount--asc', label: 'Total Stake: high to low'},
    {id: 'stakedAmount--desc', label: 'Total Stake: low to high'},
  ];

  const [search, setSearch] = useState('');
  const [toggleActive, setToggleActive] = useState(localToggles.toggleActive);
  const [toggleActiveGauge, setToggleActiveGauge] = useState(localToggles.toggleActiveGauge);
  const [toggleStable, setToggleStable] = useState(localToggles.toggleStable);
  const [toggleVariable, setToggleVariable] = useState(localToggles.toggleVariable);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showSearch, setShowSearch] = useState(localToggles.showSearch);
  const [sortValueId, setSortValueId] = useState('stakedBalance--desc');
  const [sortDirection, setSortDirection] = useState('asc');

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
  });

  const onSearchChanged = (event) => {
    setSearch(event.target.value);
    props.setSearch(event.target.value);
  };

  const onToggle = (event, name = null, checked = false) => {
    const localToggles = getLocalToggles();
    const isChecked = event?.target?.checked || checked;

    switch (event?.target?.name || name) {
      case 'toggleActive':
        setToggleActive(isChecked);
        props.setToggleActive(isChecked);
        localToggles.toggleActive = isChecked;
        break;
      case 'toggleActiveGauge':
        setToggleActiveGauge(isChecked);
        // props.setToggleActiveGauge(isChecked);
        // localToggles.toggleActiveGauge = isChecked;
        break;
      case 'toggleStable':
        setToggleStable(isChecked);
        // props.setToggleStable(isChecked);
        // localToggles.toggleStable = isChecked;
        break;
      case 'toggleVariable':
        setToggleVariable(isChecked);
        // props.setToggleVariable(isChecked);
        // localToggles.toggleVariable = isChecked;
        break;
      case 'showSearch':
        setShowSearch(event.showSearch);
        props.setShowSearch(event.showSearch);
        localToggles.showSearch = event.showSearch;
        break;
      default:

    }

    // set locally saved toggles
    try {
      localStorage.setItem('solidly-pairsToggle-v1', JSON.stringify(localToggles));
    } catch (ex) {
      console.log(ex);
    }
  };

  const onFilterSave = () => {
    const localToggles = getLocalToggles();
    props.setToggleActiveGauge(toggleActiveGauge);
    localToggles.toggleActiveGauge = toggleActiveGauge;
    props.setToggleStable(toggleStable);
    localToggles.toggleStable = toggleActive;
    props.setToggleVariable(toggleVariable);
    localToggles.toggleVariable = toggleVariable;
    try {
      localStorage.setItem('solidly-pairsToggle-v1', JSON.stringify(localToggles));
    } catch (ex) {
      console.log(ex);
    }
    setAnchorEl(null);
  }

  const onCreate = () => {
    router.push('/liquidity/create');
  };

  const onWithdraw = () => {
    router.push('/liquidity/withdraw');
  };

  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const handleSearch = () => {
    onToggle({target: {name: 'showSearch'}, showSearch: !localToggles.showSearch});
  };

  const open = Boolean(anchorEl);
  const id = open ? 'transitions-popper' : undefined;

  const handleChangeSort = ({target: {value}}) => {
    const property = value.substring(0, value.indexOf('--'));
    const event = value.substring(value.indexOf('--') + 2);

    setSortValueId(value);
    setSortDirection(event);

    props.handleRequestSort(event, property);
  };

  const {appTheme} = useAppThemeContext();

  return (
    <Toolbar className={[classes.toolbar, 'g-flex-column__item-fixed', 'g-flex', 'g-flex--space-between', 'g-flex-column'].join(' ')}>

      <div className={classes.toolbarFirst}>
        <div className={classes.toolbarTitleRow}>
          <Typography className={classes.toolbarTitle}>
            Liquidity
          </Typography>

          <div className={classes.toolbarRight}>
            <div className={[classes.actionsButtons, 'g-flex', 'g-flex--align-center'].join(' ')}>
              <IconButton
                  className={[classes.filterButton, classes[`filterButton--${appTheme}`]].join(' ')}
                  onClick={handleClick}
                  aria-label="filter list">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M5 3C4.44772 3 4 3.44772 4 4V6.00001H20V4C20 3.44772 19.5523 3 19 3H5ZM19.7822 8.00001H4.21776C4.3321 8.22455 4.48907 8.42794 4.68299 8.59762L10.683 13.8476C11.437 14.5074 12.563 14.5074 13.317 13.8476L19.317 8.59762C19.5109 8.42794 19.6679 8.22455 19.7822 8.00001Z" fill="#131313"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M14 17.7049L14 11H10V19.7049L14 17.7049Z" fill="#131313"/>
                </svg>


                {/* {open ?
                    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0.5" y="0.5" width="71" height="71" rx="11.5" fill="#779BF4" fill-opacity="0.15"/>
                      <path d="M37.125 35.625V44.25C37.125 44.5484 37.0065 44.8345 36.7955 45.0455C36.5845 45.2565 36.2984 45.375 36 45.375C35.7016 45.375 35.4155 45.2565 35.2045 45.0455C34.9935 44.8345 34.875 44.5484 34.875 44.25V35.625C34.875 35.3266 34.9935 35.0405 35.2045 34.8295C35.4155 34.6185 35.7016 34.5 36 34.5C36.2984 34.5 36.5845 34.6185 36.7955 34.8295C37.0065 35.0405 37.125 35.3266 37.125 35.625ZM42.75 42C42.4516 42 42.1655 42.1185 41.9545 42.3295C41.7435 42.5405 41.625 42.8266 41.625 43.125V44.25C41.625 44.5484 41.7435 44.8345 41.9545 45.0455C42.1655 45.2565 42.4516 45.375 42.75 45.375C43.0484 45.375 43.3345 45.2565 43.5455 45.0455C43.7565 44.8345 43.875 44.5484 43.875 44.25V43.125C43.875 42.8266 43.7565 42.5405 43.5455 42.3295C43.3345 42.1185 43.0484 42 42.75 42ZM45 38.25H43.875V27.75C43.875 27.4516 43.7565 27.1655 43.5455 26.9545C43.3345 26.7435 43.0484 26.625 42.75 26.625C42.4516 26.625 42.1655 26.7435 41.9545 26.9545C41.7435 27.1655 41.625 27.4516 41.625 27.75V38.25H40.5C40.2016 38.25 39.9155 38.3685 39.7045 38.5795C39.4935 38.7905 39.375 39.0766 39.375 39.375C39.375 39.6734 39.4935 39.9595 39.7045 40.1705C39.9155 40.3815 40.2016 40.5 40.5 40.5H45C45.2984 40.5 45.5845 40.3815 45.7955 40.1705C46.0065 39.9595 46.125 39.6734 46.125 39.375C46.125 39.0766 46.0065 38.7905 45.7955 38.5795C45.5845 38.3685 45.2984 38.25 45 38.25ZM29.25 39C28.9516 39 28.6655 39.1185 28.4545 39.3295C28.2435 39.5405 28.125 39.8266 28.125 40.125V44.25C28.125 44.5484 28.2435 44.8345 28.4545 45.0455C28.6655 45.2565 28.9516 45.375 29.25 45.375C29.5484 45.375 29.8345 45.2565 30.0455 45.0455C30.2565 44.8345 30.375 44.5484 30.375 44.25V40.125C30.375 39.8266 30.2565 39.5405 30.0455 39.3295C29.8345 39.1185 29.5484 39 29.25 39ZM31.5 35.25H30.375V27.75C30.375 27.4516 30.2565 27.1655 30.0455 26.9545C29.8345 26.7435 29.5484 26.625 29.25 26.625C28.9516 26.625 28.6655 26.7435 28.4545 26.9545C28.2435 27.1655 28.125 27.4516 28.125 27.75V35.25H27C26.7016 35.25 26.4155 35.3685 26.2045 35.5795C25.9935 35.7905 25.875 36.0766 25.875 36.375C25.875 36.6734 25.9935 36.9595 26.2045 37.1705C26.4155 37.3815 26.7016 37.5 27 37.5H31.5C31.7984 37.5 32.0845 37.3815 32.2955 37.1705C32.5065 36.9595 32.625 36.6734 32.625 36.375C32.625 36.0766 32.5065 35.7905 32.2955 35.5795C32.0845 35.3685 31.7984 35.25 31.5 35.25ZM38.25 30.75H37.125V27.75C37.125 27.4516 37.0065 27.1655 36.7955 26.9545C36.5845 26.7435 36.2984 26.625 36 26.625C35.7016 26.625 35.4155 26.7435 35.2045 26.9545C34.9935 27.1655 34.875 27.4516 34.875 27.75V30.75H33.75C33.4516 30.75 33.1655 30.8685 32.9545 31.0795C32.7435 31.2905 32.625 31.5766 32.625 31.875C32.625 32.1734 32.7435 32.4595 32.9545 32.6705C33.1655 32.8815 33.4516 33 33.75 33H38.25C38.5484 33 38.8345 32.8815 39.0455 32.6705C39.2565 32.4595 39.375 32.1734 39.375 31.875C39.375 31.5766 39.2565 31.2905 39.0455 31.0795C38.8345 30.8685 38.5484 30.75 38.25 30.75Z" fill="#779BF4"/>
                      <rect x="0.5" y="0.5" width="71" height="71" rx="11.5" stroke="#779BF4"/>
                    </svg>
                    :
                    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0.5" y="0.5" width="71" height="71" rx="11.5" fill="#779BF4" fill-opacity="0.15"/>
                      <path d="M37.125 35.625V44.25C37.125 44.5484 37.0065 44.8345 36.7955 45.0455C36.5845 45.2565 36.2984 45.375 36 45.375C35.7016 45.375 35.4155 45.2565 35.2045 45.0455C34.9935 44.8345 34.875 44.5484 34.875 44.25V35.625C34.875 35.3266 34.9935 35.0405 35.2045 34.8295C35.4155 34.6185 35.7016 34.5 36 34.5C36.2984 34.5 36.5845 34.6185 36.7955 34.8295C37.0065 35.0405 37.125 35.3266 37.125 35.625ZM42.75 42C42.4516 42 42.1655 42.1185 41.9545 42.3295C41.7435 42.5405 41.625 42.8266 41.625 43.125V44.25C41.625 44.5484 41.7435 44.8345 41.9545 45.0455C42.1655 45.2565 42.4516 45.375 42.75 45.375C43.0484 45.375 43.3345 45.2565 43.5455 45.0455C43.7565 44.8345 43.875 44.5484 43.875 44.25V43.125C43.875 42.8266 43.7565 42.5405 43.5455 42.3295C43.3345 42.1185 43.0484 42 42.75 42ZM45 38.25H43.875V27.75C43.875 27.4516 43.7565 27.1655 43.5455 26.9545C43.3345 26.7435 43.0484 26.625 42.75 26.625C42.4516 26.625 42.1655 26.7435 41.9545 26.9545C41.7435 27.1655 41.625 27.4516 41.625 27.75V38.25H40.5C40.2016 38.25 39.9155 38.3685 39.7045 38.5795C39.4935 38.7905 39.375 39.0766 39.375 39.375C39.375 39.6734 39.4935 39.9595 39.7045 40.1705C39.9155 40.3815 40.2016 40.5 40.5 40.5H45C45.2984 40.5 45.5845 40.3815 45.7955 40.1705C46.0065 39.9595 46.125 39.6734 46.125 39.375C46.125 39.0766 46.0065 38.7905 45.7955 38.5795C45.5845 38.3685 45.2984 38.25 45 38.25ZM29.25 39C28.9516 39 28.6655 39.1185 28.4545 39.3295C28.2435 39.5405 28.125 39.8266 28.125 40.125V44.25C28.125 44.5484 28.2435 44.8345 28.4545 45.0455C28.6655 45.2565 28.9516 45.375 29.25 45.375C29.5484 45.375 29.8345 45.2565 30.0455 45.0455C30.2565 44.8345 30.375 44.5484 30.375 44.25V40.125C30.375 39.8266 30.2565 39.5405 30.0455 39.3295C29.8345 39.1185 29.5484 39 29.25 39ZM31.5 35.25H30.375V27.75C30.375 27.4516 30.2565 27.1655 30.0455 26.9545C29.8345 26.7435 29.5484 26.625 29.25 26.625C28.9516 26.625 28.6655 26.7435 28.4545 26.9545C28.2435 27.1655 28.125 27.4516 28.125 27.75V35.25H27C26.7016 35.25 26.4155 35.3685 26.2045 35.5795C25.9935 35.7905 25.875 36.0766 25.875 36.375C25.875 36.6734 25.9935 36.9595 26.2045 37.1705C26.4155 37.3815 26.7016 37.5 27 37.5H31.5C31.7984 37.5 32.0845 37.3815 32.2955 37.1705C32.5065 36.9595 32.625 36.6734 32.625 36.375C32.625 36.0766 32.5065 35.7905 32.2955 35.5795C32.0845 35.3685 31.7984 35.25 31.5 35.25ZM38.25 30.75H37.125V27.75C37.125 27.4516 37.0065 27.1655 36.7955 26.9545C36.5845 26.7435 36.2984 26.625 36 26.625C35.7016 26.625 35.4155 26.7435 35.2045 26.9545C34.9935 27.1655 34.875 27.4516 34.875 27.75V30.75H33.75C33.4516 30.75 33.1655 30.8685 32.9545 31.0795C32.7435 31.2905 32.625 31.5766 32.625 31.875C32.625 32.1734 32.7435 32.4595 32.9545 32.6705C33.1655 32.8815 33.4516 33 33.75 33H38.25C38.5484 33 38.8345 32.8815 39.0455 32.6705C39.2565 32.4595 39.375 32.1734 39.375 31.875C39.375 31.5766 39.2565 31.2905 39.0455 31.0795C38.8345 30.8685 38.5484 30.75 38.25 30.75Z" fill="#779BF4"/>
                      <rect x="0.5" y="0.5" width="71" height="71" rx="11.5" stroke="#779BF4"/>
                    </svg>
                }*/}

              </IconButton>

              <div
                  className={[classes.addButton,].join(' ')}
                  onClick={onCreate}
              >
                <Typography className={[classes.actionButtonText,].join(' ')}>
                  Add Liquidity
                </Typography>
              </div>
            </div>



          </div>


          {windowWidth <= 800 &&
            <div className={classes.sortSelect}>
              <SortSelect
                value={sortValueId}
                options={options}
                handleChange={handleChangeSort}
                sortDirection={sortDirection}
                className={classes.sortSelectPosition}
              />
            </div>
          }

          <Dialog
              className={css.dialogScale}
              classes={{
                root: css.rootPaper,
                scrollPaper: css.topScrollPaper,
                paper: css.paperBody,
              }}
              open={open}
              onClose={handleClosePopover}
              onClick={(e) => {
                if (e.target.classList.contains('MuiDialog-container')) {
                  handleClosePopover()
                }
              }}
              fullWidth={true}
              maxWidth={"sm"}
              TransitionComponent={Transition}
              fullScreen={false}
          >
            <div className={css.tvAntenna}>
              <svg width="56" height="28" viewBox="0 0 56 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_116_22640)">
                  <path fillRule="evenodd" clipRule="evenodd" d="M53.7324 1.53632C51.8193 0.431753 49.3729 1.08725 48.2683 3.00042C47.4709 4.38158 47.5908 6.04061 48.4389 7.27208L33.2833 22.4277C31.9114 21.3226 30.1671 20.6611 28.2683 20.6611C26.2328 20.6611 24.3748 21.4213 22.9629 22.6733L7.56181 7.27224C8.40988 6.04078 8.52973 4.38181 7.73235 3.00071C6.62778 1.08754 4.18142 0.432036 2.26825 1.53661C0.355075 2.64117 -0.300425 5.08754 0.804144 7.00071C1.86628 8.84038 4.16909 9.51716 6.04549 8.58435L21.6406 24.1794C20.7743 25.4579 20.2683 27.0004 20.2683 28.6611H36.2683C36.2683 26.8626 35.6748 25.2026 34.6729 23.8665L49.9553 8.58413C51.8317 9.51684 54.1344 8.84005 55.1965 7.00042C56.3011 5.08725 55.6456 2.64089 53.7324 1.53632Z" fill="#EAE8E1"/>
                </g>
                <defs>
                  <clipPath id="clip0_116_22640">
                    <rect width="56" height="28" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className={css.realDialog}>
              <DialogTitle style={{ padding: 0 }}>
                <div className={css.dialogTitle} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    Filters
                  </div>

                  <div
                      className={css.dialogClose}
                      onClick={handleClosePopover}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12ZM12 13.4142L8.70711 16.7071L7.29289 15.2929L10.5858 12L7.29289 8.70711L8.70711 7.29289L12 10.5858L15.2929 7.29289L16.7071 8.70711L13.4142 12L16.7071 15.2929L15.2929 16.7071L12 13.4142Z" fill="#131313"/>
                    </svg>
                  </div>
                </div>
              </DialogTitle>

              <DialogContent classes={{root: css.dialogContent,}}>
                <div className={css.dialogInner}>
                  <div
                      className={[classes.filterItem, classes[`filterItem--${appTheme}`], 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                    <Typography className={[classes.filterLabel, classes[`filterLabel--${appTheme}`]].join(' ')}>
                      Active Gauges
                    </Typography>

                    <SwitchCustom
                        checked={toggleActiveGauge}
                        name={'toggleActiveGauge'}
                        onChange={onToggle}
                    />
                  </div>

                  <div
                      className={[classes.filterItem, classes[`filterItem--${appTheme}`], 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                    <Typography className={[classes.filterLabel, classes[`filterLabel--${appTheme}`]].join(' ')}>
                      Stable Pools
                    </Typography>

                    <SwitchCustom
                        checked={toggleStable}
                        name={'toggleStable'}
                        onChange={onToggle}
                    />
                  </div>

                  <div
                      className={[classes.filterItem, classes[`filterItem--${appTheme}`], 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                    <Typography className={[classes.filterLabel, classes[`filterLabel--${appTheme}`]].join(' ')}>
                      Volatile Pools
                    </Typography>

                    <SwitchCustom
                        checked={toggleVariable}
                        name={'toggleVariable'}
                        onChange={onToggle}
                    />
                  </div>

                  <div className={css.apply} onClick={onFilterSave}>
                    Apply Filter Settings
                  </div>
                </div>
              </DialogContent>
            </div>
          </Dialog>


          {/*<Popover
            classes={{
              paper: [classes.popoverPaper, classes[`popoverPaper--${appTheme}`]].join(' '),
            }}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClosePopover}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}>
            <div className={[classes.filterContainer, classes[`filterContainer--${appTheme}`]].join(' ')}>
              <div style={{
                display: 'flex',
                alignItems: 'start',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}>
                <Typography className={[classes.filterListTitle, classes[`filterListTitle--${appTheme}`]].join(' ')}>
                  Filters
                </Typography>

                <span
                    style={{
                      width: 20,
                      height: 20,
                      cursor: 'pointer',
                      backgroundColor: '#586586',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 4,
                      marginTop: 4,
                    }}
                    onClick={handleClick}
                    className={classes.closePopover}
                >
                  <Close
                      style={{
                        // color: appTheme === "dark" ? '#ffffff' : '#0A2C40',
                        fontSize: 14,
                      }}
                  />
                </span>
              </div>


            </div>
          </Popover>*/}

        </div>


      </div>

      <div className={classes.sidebar}>
        <div className={[classes.myDeposits,].join(' ')}>
          <div onClick={() => { props.setToggleActive(false); setToggleActive(false); }} className={toggleActive ? classes.myDepositsBtn : classes.myDepositsBtnActive}>All Pools</div>
          <div onClick={() => { props.setToggleActive(true); setToggleActive(true);  }} className={toggleActive ? classes.myDepositsBtnActive : classes.myDepositsBtn}>My Deposits</div>

          {/*<div
              style={{
                marginRight: 10,
              }}>
            <SwitchCustom
                checked={toggleActive}
                onChange={onToggle}
                name={'toggleActive'}
            />
          </div>

          <Typography
              className={classes.myDepositsText}
          >
            <span
                style={{
                  // fontSize: 'inherit',
                  // fontWeight: 500,
                  paddingRight: 4,
                }}>
              Show only my Deposits
            </span>
          </Typography>*/}
        </div>

        <TextField
            className={classes.textSearchField}
            variant="outlined"
            fullWidth
            placeholder="Type name or paste the address"
            value={search}
            onChange={onSearchChanged}
            InputProps={{
              style: {
                // background: '#171D2D',
                // border: '1px solid',
                // borderColor: '#779BF4',
                // borderRadius: 12,
              },
              classes: {
                root: classes.searchInput,
                input: classes.searchInputInput
              },
              endAdornment: <InputAdornment position="end">
                {/*Search icon*/}
                <div className={classes.searchInputIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11Z" fill="#9A9FAF"/>
                    <path d="M20 20L18 18" stroke="#9A9FAF" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </InputAdornment>,
            }}
            inputProps={{
              style: {
                padding: 24,
                borderRadius: 0,
                border: 'none',
                fontSize: 16,
                fontWeight: 400,
                lineHeight: '120%',
                color: '#E4E9F4',
              },
            }}
        />

        {/*{windowWidth < 1332 && (
            <div style={{width: '100%',}} />
        )}*/}


        {/*<div
            className={[classes.withdrawButton,].join(' ')}
            onClick={onWithdraw}
        >
          <Typography className={[classes.actionButtonWithdrawText,].join(' ')}>
            WITHDRAW LIQUIDITY
          </Typography>
        </div>*/}
      </div>
    </Toolbar>
  );
};

export default function EnhancedTable({pairs, isLoading}) {
  const classes = useStyles();
  const router = useRouter();

  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('tvl');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const localToggles = getLocalToggles();

  const [search, setSearch] = useState('');
  const [toggleActive, setToggleActive] = useState(localToggles.toggleActive);
  const [toggleActiveGauge, setToggleActiveGauge] = useState(localToggles.toggleActiveGauge);
  const [toggleStable, setToggleStable] = useState(localToggles.toggleStable);
  const [toggleVariable, setToggleVariable] = useState(localToggles.toggleVariable);
  const [showSearch, setShowSearch] = useState(localToggles.showSearch);
  const [tableHeight, setTableHeight] = useState(window.innerHeight - 50 - 124 - 30 - 60 - 54 - 20 - 30);
  const [expanded, setExpanded] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [lpAmount, setLpAmount] = useState(null);

  const [open, setOpen] = React.useState(false);

  const handleTooltipClose = () => {
    setOpen(false);
  };

  const handleTooltipOpen = () => {
    setOpen(true);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';

    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  if (!pairs) {
    return (
      <div className={classes.root}>
        <Skeleton variant="rect" width={'100%'} height={40} className={classes.skelly1}/>
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly}/>
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly}/>
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly}/>
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly}/>
        <Skeleton variant="rect" width={'100%'} height={70} className={classes.skelly}/>
      </div>
    );
  }

  const onView = (pair) => {
    router.push(`/liquidity/${pair.address}`);
  };

  const renderTooltip = (pair) => {
    return (
      <div>
        <Typography>Ve Emissions</Typography>
        <Typography>0.00</Typography>
      </div>
    );
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredPairs = pairs.filter((pair) => {
    if (!search || search === '') {
      return true;
    }

    const searchLower = search.toLowerCase();

    return pair.symbol.toLowerCase().includes(searchLower)
      || pair.address.toLowerCase().includes(searchLower)
      || pair.token0.symbol.toLowerCase().includes(searchLower)
      || pair.token0.address.toLowerCase().includes(searchLower)
      || pair.token0.name.toLowerCase().includes(searchLower)
      || pair.token1.symbol.toLowerCase().includes(searchLower)
      || pair.token1.address.toLowerCase().includes(searchLower)
      || pair.token1.name.toLowerCase().includes(searchLower);
  }).filter((pair) => {
    if (toggleStable !== true && pair.isStable === true) {
      return false;
    }
    if (toggleVariable !== true && pair.isStable === false) {
      return false;
    }
    // if(toggleActiveGauge === true && (!pair.gauge || !pair.gauge.address)) {
    //   return false
    // }
    if (toggleActive === true) {
      if (BigNumber(pair?.gauge?.balance).gt(0)) {
        return true;
      }
    }
    if (toggleActive === true) {
      if (!BigNumber(pair?.balance).gt(0)) {
        return false;
      }
    }


    return true;
  });

  const {appTheme} = useAppThemeContext();

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
    setTableHeight(window.innerHeight - 50 - 124 - 30 - 60 - 54 - 20 - 30);
  });

  const handleChangeAccordion = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  const lpAmountChange = (event) => {
    const value = formatInputAmount(event.target.value.replace(",", "."));
    if (value <= 100) {
      if (!isNaN(value)) setLpAmount(value);
    }
  }

  const veTok = stores.stableSwapStore.getStore("veToken");
  const nfts = stores.stableSwapStore.getStore("vestNFTs") ?? [];

  return (
    <div
      className={[classes.tableWrapper, 'g-flex-column__item', 'g-flex-column'].join(' ')}
      style={{
        // overflowY: 'initial'/*windowWidth <= 400 ? 'auto' : 'hidden'*/,
        // paddingLeft: windowWidth > 1200 ? 400 : 0,
      }}
    >
      <EnhancedTableToolbar
        setSearch={setSearch}
        setToggleActive={setToggleActive}
        setToggleActiveGauge={setToggleActiveGauge}
        setToggleStable={setToggleStable}
        setToggleVariable={setToggleVariable}
        setShowSearch={setShowSearch}
        handleRequestSort={handleRequestSort}
        setSortDirection={setSortDirection}/>

      {windowWidth > 806 && windowWidth < 1333 &&
          <div className={classes.infoContainer}>
            <span className={classes.infoContainerWarn}>!</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 20C15.5228 20 20 15.5228 20 10C20 4.47715 15.5228 0 10 0C4.47715 0 0 4.47715 0 10C0 15.5228 4.47715 20 10 20Z" fill="#779BF4"/>
            </svg>
            <span className={classes.infoContainerText}>Use horizontal scroll to navigate the table</span>
          </div>
      }
      {windowWidth > 806 &&
        <>

          {filteredPairs.length === 0 && isLoading && (
            <div className={css.tvLoading}>
              <img src="/images/tv-loading.png" className={css.tvImage} />
              <p className={css.tvText}>Loading your Deposit from the blockchain, please wait</p>
            </div>
          )}
          {!isLoading && filteredPairs.length === 0 && (
            <div className={css.tvNotData}>
              <img src="/images/tv-sad.png" className={css.tvImage} />
              <p className={css.tvText}>You do not have any Deposits. Click ???Add Liquidity??? to create your first Deposit.</p>
            </div>
          )}

          {filteredPairs.length !== 0 && (
            <>
          <div className={classes.tableContWrapper}>
            <TableContainer
              className={'g-flex-column__item'}
              style={{
                overflow: 'auto',
                // maxHeight: tableHeight,
                height: 'auto',
                // background: appTheme === 'dark' ? '#24292D' : '#dbe6ec',
              }}>
              <Table
                stickyHeader
                className={classes.table}
                aria-labelledby="tableTitle"
                size={'medium'}
                aria-label="enhanced table">
                <EnhancedTableHead
                  classes={classes}
                  order={order}
                  orderBy={orderBy}
                  onRequestSort={handleRequestSort}
                />

                <TableBody>
                  {stableSort(filteredPairs, getComparator(order, orderBy))
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) => {
                      if (!row) {
                        return null;
                      }
                      const labelId = `enhanced-table-checkbox-${index}`;

                      return (
                        <TableRow
                          key={labelId}
                          className={classes.assetTableRow}>
                          <StickyTableCell
                            style={{
                              // background: '#171D2D',
                              borderBottom: `1px solid rgba(104, 114, 122, 0.4)`,
                              borderRight: /*windowWidth < 1333 ? '1px solid #D3F85A' : */'none',
                            }}
                            className={classes.cell}>
                            <div className={classes.inline}>
                              <div className={classes.doubleImages}>
                                <div
                                  className={[classes.imgLogoContainer, classes[`imgLogoContainer--${appTheme}`]].join(' ')}>
                                  <img
                                    className={classes.imgLogo}
                                    src={(row && row.token0 && row.token0.logoURI) ? row.token0.logoURI : ``}
                                    width="36"
                                    height="36"
                                    alt=""
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                    }}
                                  />
                                </div>

                                <div
                                  className={[classes.imgLogoContainer, classes.imgLogoContainer2, classes[`imgLogoContainer--${appTheme}`]].join(' ')}>
                                  <img
                                    className={classes.imgLogo}
                                    src={(row && row.token1 && row.token1.logoURI) ? row.token1.logoURI : ``}
                                    width="36"
                                    height="36"
                                    alt=""
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                    }}
                                  />
                                </div>
                              </div>
                              <div>
                                <Typography
                                  className={classes.textSpaced}
                                  style={{
                                    marginBottom: 4,
                                    fontWeight: 700,
                                    fontSize: 16,
                                    lineHeight: '16px',
                                    color: '#F6F7F9',
                                  }}
                                  noWrap>
                                  {formatSymbol(row?.symbol)}
                                </Typography>
                                <Typography
                                  className={classes.textSpaced}
                                  style={{
                                    fontWeight: 500,
                                    fontSize: 14,
                                    lineHeight: '20px',
                                    color: '#9A9FAF',
                                  }}
                                  noWrap>
                                  {row?.isStable ? 'Stable Pool' : 'Volatile Pool'}
                                </Typography>
                              </div>
                            </div>
                          </StickyTableCell>

                          <TableCell
                            className={[classes.cell, classes.hiddenMobile].join(' ')}
                            style={{
                              borderBottom: '1px solid rgba(104, 114, 122, 0.4)',
                              borderLeft: '1px solid rgba(104, 114, 122, 0.4)',
                              overflow: 'hidden',
                            }}
                            align="right"
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                              }}>
                              {(row && BigNumber(row.tvl).gt(0)) &&
                                <div style={{ display: 'flex' }}>
                                  <div
                                    className={classes.inlineEnd}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-end',
                                    }}>
                                    <Typography
                                      className={classes.textSpaced}
                                      style={{
                                        fontWeight: 500,
                                        fontSize: 14,
                                        lineHeight: '20px',
                                        color: '#F6F7F9',
                                        whiteSpace: 'nowrap',
                                      }}>
                                        {formatCurrency(BigNumber(row.tvl))} <span style={{color: '#9A9FAF'}}>$</span>
                                    </Typography>
                                  </div>
                                </div>
                              }
                            </div>
                          </TableCell>

                          <TableCell
                              className={[classes.cell, classes.hiddenMobile].join(' ')}
                              style={{
                                borderBottom: '1px solid rgba(104, 114, 122, 0.4)',
                                borderLeft: '1px solid rgba(104, 114, 122, 0.4)',
                                overflow: 'hidden',
                              }}
                              align="right"
                          >
                            <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                }}>
                              {BigNumber(row?.gauge?.apr).gt(0) &&
                                <div style={{ display: 'flex' }}>
                                   <Dialog
                                      PaperProps={{
                                        style: {
                                          width: "100%",
                                          maxWidth: 600,
                                          background: 'transpaarent',
                                          borderRadius: 20,
                                          overflowY: "visible"
                                        }
                                      }}
                                      open={open}
                                      onClose={handleTooltipClose}
                                      onClick={(e) => {
                                        if (e.target.classList.contains('MuiDialog-container')) {
                                          handleTooltipClose()
                                        }
                                      }}
                                    >
                                      <div className={css.boostCalculatorTooltip}>
                                        <BoostCalculator popuped={true} pair={row} ve={veTok} nft={nfts.filter(n => n.id === row?.gauge?.veId)[0]} isMobileView={true} amount={100} />
                                      </div>
                                    </Dialog>
                                    <img onClick={() => {handleTooltipOpen()}} src={
                                      (row?.gauge?.boost && BigNumber(row?.gauge?.boost).gt(0) && BigNumber(row?.gauge?.balance).gt(0))
                                        ? "/images/boost_fired.svg"
                                        : (BigNumber(row?.balance).gt(0))
                                          ? "/images/boost-empty.svg"
                                          : "/images/boost-info.svg"
                                      }
                                    />
                                    <div
                                        className={classes.inlineEnd}
                                        style={{
                                          display: 'flex',
                                          flexDirection: 'column',
                                          alignItems: 'flex-end',
                                          minWidth: 106,
                                        }}>
                                      <Typography
                                          className={classes.textSpaced}
                                          style={{
                                            marginBottom: 2,
                                            fontWeight: 500,
                                            fontSize: 14,
                                            lineHeight: '20px',
                                            color: '#F6F7F9',
                                            whiteSpace: 'nowrap',
                                          }}>
                                        {formatCurrency(BigNumber.sum(BigNumber(row?.gauge?.derivedAPR).div(100).times(40),
                                            BigNumber(row?.gauge?.additionalApr0),
                                            BigNumber(row?.gauge?.additionalApr1)
                                        ),3)}% <span style={{color: '#9A9FAF'}}>min</span>
                                      </Typography>

                                      <Typography
                                          className={classes.textSpaced}
                                          style={{
                                            fontWeight: 500,
                                            fontSize: 14,
                                            lineHeight: '20px',
                                            color: '#F6F7F9',
                                          }}>
                                        {formatCurrency(BigNumber.sum(BigNumber(row?.gauge?.derivedAPR),
                                            BigNumber(row?.gauge?.additionalApr0),
                                            BigNumber(row?.gauge?.additionalApr1)
                                        ),3)}% <span style={{color: '#9A9FAF'}}>max</span>
                                      </Typography>
                                    </div>
                                  </div>
                              }
                            </div>
                          </TableCell>

                          <TableCell
                            className={[classes.cell, classes.hiddenMobile].join(' ')}
                            style={{
                              borderBottom: '1px solid rgba(104, 114, 122, 0.4)',
                              borderLeft: '1px solid rgba(104, 114, 122, 0.4)',
                            }}
                            align="right">
                            {(row && row.balance && row.totalSupply) &&
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                }}>
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                  }}>

                                  <Typography
                                    className={classes.textSpaced}
                                    style={{
                                      marginBottom: 2,
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '20px',
                                      color: '#F6F7F9',
                                    }}>
                                    {formatCurrency(BigNumber(row.balance).div(row.totalSupply).times(row.reserve0))}
                                  </Typography>

                                  <Typography
                                    className={classes.textSpaced}
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '20px',
                                      color: '#F6F7F9',
                                    }}>
                                    {formatCurrency(BigNumber(row.balance).div(row.totalSupply).times(row.reserve1))}
                                  </Typography>
                                </div>

                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    paddingLeft: 10,
                                  }}>
                                  <Typography
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    style={{
                                      marginBottom: 2,
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '20px',
                                      color: '#9A9FAF',
                                    }}>
                                    {row.token0.symbol}
                                  </Typography>

                                  <Typography
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '20px',
                                      color: '#9A9FAF',
                                    }}>
                                    {row.token1.symbol}
                                  </Typography>
                                </div>
                              </div>
                            }
                            {!(row && row.balance && row.totalSupply) &&
                              <div
                                className={classes.inlineEnd}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                  paddingLeft: 10,
                                }}>
                                <Skeleton
                                  variant="rect"
                                  width={120}
                                  height={16}
                                  style={{marginTop: '1px', marginBottom: '1px'}}/>
                              </div>
                            }
                          </TableCell>

                          {
                            row?.gauge?.address &&
                            <TableCell
                              className={[classes.cell, classes.hiddenMobile].join(' ')}
                              style={{
                                borderBottom: '1px solid rgba(104, 114, 122, 0.4)',
                                borderLeft: '1px solid rgba(104, 114, 122, 0.4)',
                              }}
                              align="right">

                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                }}>
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                  }}>
                                  <Typography
                                    className={classes.textSpaced}
                                    style={{
                                      marginBottom: 2,
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '20px',
                                      color: '#F6F7F9',
                                    }}>
                                    {(row && row.gauge && row.gauge.balance && row.gauge.totalSupply) ? formatCurrency(BigNumber(row.gauge.balance).div(row.gauge.totalSupply).times(row.gauge.reserve0)) : "0.00"}
                                  </Typography>

                                  <Typography
                                    className={classes.textSpaced}
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '20px',
                                      color: '#F6F7F9',
                                    }}>
                                    {(row && row.gauge && row.gauge.balance && row.gauge.totalSupply) ? formatCurrency(BigNumber(row.gauge.balance).div(row.gauge.totalSupply).times(row.gauge.reserve1)) : "0.00"}
                                  </Typography>
                                </div>

                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    paddingLeft: 10,
                                  }}>
                                  <Typography
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    style={{
                                      marginBottom: 2,
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '20px',
                                      color: '#9A9FAF',
                                    }}>
                                    {formatSymbol(row.token0.symbol)}
                                  </Typography>

                                  <Typography
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '20px',
                                      color: '#9A9FAF',
                                    }}>
                                    {formatSymbol(row.token1.symbol)}
                                  </Typography>
                                </div>
                              </div>
                            </TableCell>
                          }

                          {
                            !row?.gauge?.address &&
                            <TableCell
                              className={[classes.cell, classes.hiddenMobile].join(' ')}
                              style={{
                                borderBottom: '1px solid rgba(104, 114, 122, 0.4)',
                                borderLeft: '1px solid rgba(104, 114, 122, 0.4)',
                              }}
                              align="right">
                              <Typography
                                className={classes.textSpaced}
                                style={{
                                  fontWeight: 500,
                                  fontSize: 14,
                                  lineHeight: '20px',
                                  color: '#F6F7F9',
                                  whiteSpace: 'nowrap',
                                }}>
                                No gauge
                              </Typography>
                            </TableCell>
                          }

                          <TableCell
                            className={[classes.cell, classes.hiddenSmallMobile].join(' ')}
                            style={{
                              borderBottom: '1px solid rgba(104, 114, 122, 0.4)',
                              borderLeft: '1px solid rgba(104, 114, 122, 0.4)',
                            }}
                            align="right">
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                              }}>
                              {(row && row.reserve0 && row.token0) &&
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                  }}>
                                  <Typography
                                    className={classes.textSpaced}
                                    style={{
                                      marginBottom: 2,
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '20px',
                                      color: '#F6F7F9',
                                      whiteSpace: 'nowrap',
                                    }}>
                                    {formatCurrency(row.reserve0)}
                                  </Typography>

                                  <Typography
                                    className={classes.textSpaced}
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '20px',
                                      color: '#F6F7F9',
                                      whiteSpace: 'nowrap',
                                    }}>
                                    {formatCurrency(row.reserve1)}
                                  </Typography>
                                </div>
                              }
                              {!(row && row.reserve0 && row.token0) &&
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    paddingLeft: 10,
                                  }}>
                                  <Skeleton
                                    variant="rect"
                                    width={120}
                                    height={16}
                                    style={{marginTop: '1px', marginBottom: '1px'}}/>
                                </div>
                              }
                              {(row && row.reserve1 && row.token1) &&
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    paddingLeft: 10,
                                  }}>
                                  <Typography
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    style={{
                                      marginBottom: 2,
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '20px',
                                      color: '#9A9FAF',
                                    }}>
                                    {formatSymbol(row.token0.symbol)}
                                  </Typography>

                                  <Typography
                                    className={`${classes.textSpaced} ${classes.symbol}`}
                                    style={{
                                      fontWeight: 500,
                                      fontSize: 14,
                                      lineHeight: '20px',
                                      color: '#9A9FAF',
                                    }}>
                                    {formatSymbol(row.token1.symbol)}
                                  </Typography>
                                </div>
                              }
                              {!(row && row.reserve1 && row.token1) &&
                                <div
                                  className={classes.inlineEnd}
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-end',
                                    paddingLeft: 10,
                                  }}>
                                  <Skeleton
                                    variant="rect"
                                    width={120}
                                    height={16}
                                    style={{marginTop: '1px', marginBottom: '1px'}}/>
                                </div>
                              }
                            </div>
                          </TableCell>

                          {
                            row?.gauge?.address &&
                            <TableCell
                              className={[classes.cell, classes.hiddenMobile].join(' ')}
                              style={{
                                borderBottom: '1px solid rgba(104, 114, 122, 0.4)',
                                borderLeft: '1px solid rgba(104, 114, 122, 0.4)',
                              }}
                              align="right">
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'flex-end',
                                }}>
                                {(row && row.gauge && row.gauge.reserve0 && row.token0) ? (
                                  <div
                                    className={classes.inlineEnd}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-end',
                                    }}>
                                    <Typography
                                      className={classes.textSpaced}
                                      style={{
                                        marginBottom: 2,
                                        fontWeight: 500,
                                        fontSize: 14,
                                        lineHeight: '20px',
                                        color: '#F6F7F9',
                                        whiteSpace: 'nowrap',
                                      }}>
                                      {formatCurrency(row.gauge.reserve0)}
                                    </Typography>

                                    <Typography
                                      className={classes.textSpaced}
                                      style={{
                                        fontWeight: 500,
                                        fontSize: 14,
                                        lineHeight: '20px',
                                        color: '#F6F7F9',
                                        whiteSpace: 'nowrap',
                                      }}>
                                      {formatCurrency(row.gauge.reserve1)}
                                    </Typography>
                                  </div>
                                  ) : null
                                }
                                {!(row && row.gauge && row.gauge.reserve0 && row.token0) &&
                                  <div
                                    className={classes.inlineEnd}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-end',
                                      paddingLeft: 10,
                                    }}>
                                    <Skeleton
                                      variant="rect"
                                      width={120}
                                      height={16}
                                      style={{marginTop: '1px', marginBottom: '1px'}}/>
                                  </div>
                                }
                                {(row && row.gauge && row.gauge.reserve1 && row.token1) ? (
                                  <div
                                    className={classes.inlineEnd}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-end',
                                      paddingLeft: 10,
                                    }}>
                                    <Typography
                                      className={`${classes.textSpaced} ${classes.symbol}`}
                                      style={{
                                        marginBottom: 2,
                                        fontWeight: 500,
                                        fontSize: 14,
                                        lineHeight: '20px',
                                        color: '#9A9FAF',
                                      }}>
                                      {formatSymbol(row.token0.symbol)}
                                    </Typography>

                                    <Typography
                                      className={`${classes.textSpaced} ${classes.symbol}`}
                                      style={{
                                        fontWeight: 500,
                                        fontSize: 14,
                                        lineHeight: '20px',
                                        color: '#9A9FAF',
                                      }}>
                                      {formatSymbol(row.token1.symbol)}
                                    </Typography>
                                  </div>
                                  ) : null
                                }
                                {!(row && row.gauge && row.gauge.reserve1 && row.token1) &&
                                  <div
                                    className={classes.inlineEnd}
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'flex-end',
                                      paddingLeft: 10,
                                    }}>
                                    <Skeleton
                                      variant="rect"
                                      width={120}
                                      height={16}
                                      style={{marginTop: '1px', marginBottom: '1px'}}/>
                                  </div>
                                }
                              </div>
                            </TableCell>
                          }

                          {
                            !row?.gauge?.address &&
                            <TableCell
                              className={[classes.cell, classes.hiddenMobile].join(' ')}
                              style={{
                                borderBottom: '1px solid rgba(104, 114, 122, 0.4)',
                                borderLeft: '1px solid rgba(104, 114, 122, 0.4)',
                              }}
                              align="right">
                              <Typography
                                className={classes.textSpaced}
                                style={{
                                  fontWeight: 500,
                                  fontSize: 14,
                                  lineHeight: '20px',
                                  color: '#F6F7F9',
                                  whiteSpace: 'nowrap',
                                }}>
                                No gauge
                              </Typography>
                            </TableCell>
                          }

                          <TableCell
                            className={classes.cell}
                            style={{
                              borderBottom: '1px solid rgba(104, 114, 122, 0.4)',
                              borderLeft: '1px solid rgba(104, 114, 122, 0.4)',
                            }}
                            align="right">
                            <Button
                              variant="outlined"
                              color="primary"
                              style={{
                                padding: '7px 14px',
                                border: `1px solid #7DB857`,
                                background: 'rgba(125, 184, 87, 0.12',
                                borderRadius: 8,
                                fontWeight: 500,
                                fontSize: 14,
                                lineHeight: '20px',
                                color: '#7DB857',
                              }}
                              onClick={() => {
                                onView(row);
                              }}>
                              {BigNumber(row?.balance).gt(0) || BigNumber(row?.gauge?.balance).gt(0) ? 'Edit' : 'Add'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
                
              </Table>
            </TableContainer>
          </div>

          <TablePagination
              className={'g-flex-column__item-fixed'}
              style={{
                width: '100%',
                padding: '0 10px 0 0',
                background: '#131313',
                marginTop: 20,
                marginBottom: 40,
                borderRadius: 20,
                color: '#9A9FAF',
              }}
              // rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredPairs.length}
              rowsPerPage={rowsPerPage}
              page={page}
              labelRowsPerPage={window.innerWidth < 550 ? null : 'Rows per page:'}
              rowsPerPageOptions={window.innerWidth < 435 ? [] : [5, 10, 25]}
              ActionsComponent={TablePaginationActions}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              classes={{
                root: css.paginationRoot,
                toolbar: css.paginationToolbar,
                spacer: css.paginationSpacer,
                selectLabel: css.selectLabel,
                selectRoot: css.selectRoot,
                select: css.select,
                selectIcon: css.selectIcon,
                input: css.input,
                menuItem: css.menuItem,
                displayedRows: css.displayedRows,
                actions: css.actions,
              }}
          />
          </>
          )}
        </>
      }

      {windowWidth <= 800 &&
        <>
          {filteredPairs.length === 0 && isLoading && (
           <div className={css.tvLoading}>
              <img src="/images/tv-loading.png" className={css.tvImage} />
              <p className={css.tvText}>Loading your Deposit from the blockchain, please wait</p>
            </div>
          )}
          {!isLoading && filteredPairs.length === 0 && (
            <div className={css.tvNotData}>
              <img src="/images/tv-sad.png" className={css.tvImage} />
              <p className={css.tvText}>You do not have any Deposits. Click ???Add Liquidity??? to create your first Deposit.</p>
            </div>
          )}


          {filteredPairs.length > 0 &&
        <div
          style={{
            overflowY: windowWidth > 400 ? 'auto' : 'visible',
            marginTop: 20,
          }}>
          {stableSort(filteredPairs, getComparator(order, orderBy))
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((row, index) => {
              if (!row) {
                return null;
              }
              const labelId = `accordion-${index}`;

              return (
                <Accordion
                  key={labelId}
                  style={{
                    margin: 0,
                    marginBottom: 20,
                    background: '#131313',
                    // border: `1px solid #060B17`,
                    borderRadius: 16,
                  }}
                  disableGutters={true}
                  expanded={expanded === labelId}
                  onChange={handleChangeAccordion(labelId)}>
                  <AccordionSummary
                    style={{
                      padding: 0,
                      borderRadius: 12,
                    }}
                    classes={{
                      content: classes.accordionSummaryContent,
                    }}
                    expandIcon={null}
                    aria-controls="panel1a-content">
                    <div className={['g-flex-column', 'g-flex-column__item'].join(' ')}>
                      <div
                        style={{
                          padding: '12px',
                        }}
                        className={['g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                        <div className={['g-flex',].join(' ')}>
                          <div className={classes.doubleImages}>
                            <div
                                className={[classes.imgLogoContainer, classes[`imgLogoContainer--${appTheme}`]].join(' ')}>
                              <img
                                  className={classes.imgLogo}
                                  src={(row && row.token0 && row.token0.logoURI) ? row.token0.logoURI : ``}
                                  width="36"
                                  height="36"
                                  alt=""
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                  }}
                              />
                            </div>

                            <div
                                className={[classes.imgLogoContainer, classes.imgLogoContainer2, classes[`imgLogoContainer--${appTheme}`]].join(' ')}>
                              <img
                                  className={classes.imgLogo}
                                  src={(row && row.token1 && row.token1.logoURI) ? row.token1.logoURI : ``}
                                  width="36"
                                  height="36"
                                  alt=""
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                  }}
                              />
                            </div>
                          </div>
                          <div>
                            <Typography
                                className={classes.textSpaced}
                                style={{
                                  marginBottom: 2,
                                  fontWeight: 500,
                                  fontSize: 16,
                                  lineHeight: '20px',
                                  color: '#F6F7F9',
                                }}
                                noWrap>
                              {formatSymbol(row?.symbol)}
                            </Typography>
                            <Typography
                                className={classes.textSpaced}
                                style={{
                                  fontWeight: 500,
                                  fontSize: 12,
                                  lineHeight: '12px',
                                  color: '#9A9FAF',
                                }}
                                noWrap>
                              {row?.isStable ? 'Stable Pool' : 'Volatile Pool'}
                            </Typography>
                          </div>
                        </div>
                        <div className={['g-flex','g-flex--justify-end'].join(' ')}>
                          <Button
                              variant="outlined"
                              color="primary"
                              style={{
                                padding: '8px 16px',
                                background: 'rgba(125, 184, 87, 0.12)',
                                border: `1px solid #7DB857`,
                                borderRadius: 8,
                                fontWeight: 500,
                                fontSize: 14,
                                lineHeight: '20px',
                                color: '#7DB857',
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                event.preventDefault();

                                onView(row);
                              }}>
                            {BigNumber(row?.balance).gt(0) || BigNumber(row?.gauge?.balance).gt(0) ? 'EDIT' : 'ADD'}
                          </Button>
                        </div>
                      </div>

                      <div style={{
                            margin: '12px 12px 0 12px',
                            padding: 12,
                            border: '1px solid rgba(104, 114, 122, 0.4)',
                            borderRadius: 16,
                          }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid rgba(104, 114, 122, 0.4)',
                        }}>
                          <div style={{
                            padding: '8px 0',
                            color: '#9A9FAF',
                            fontSize: 12,
                            fontWeight: 500,
                            lineHeight: '16px',
                            width: 100,
                            borderRight: '1px solid rgba(104, 114, 122, 0.4)',
                          }}>TVL</div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'right',
                            alignItems: 'center',
                          }}>
                            <Typography
                                className={classes.textSpaced}
                                style={{
                                  fontWeight: 500,
                                  fontSize: 12,
                                  lineHeight: '12px',
                                  color: '#F6F7F9',
                                  whiteSpace: 'nowrap',
                                }}>
                              {BigNumber(row?.tvl).gt(0) ? formatCurrency(BigNumber(row?.tvl)): '-'}
                            </Typography>
                            <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                  paddingLeft: 10,
                                }}
                            >
                              <Typography
                                  className={`${classes.textSpaced} ${classes.symbol}`}
                                  style={{
                                    fontWeight: 500,
                                    fontSize: 12,
                                    lineHeight: '12px',
                                    minWidth: 15,
                                    color: '#9A9FAF',
                                  }}>
                                $
                              </Typography>
                            </div>
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}>
                          <div style={{
                            padding: '8px 0',
                            color: '#9A9FAF',
                            fontSize: 12,
                            fontWeight: 500,
                            lineHeight: '16px',
                            width: 100,
                            borderRight: '1px solid rgba(104, 114, 122, 0.4)',
                          }}>APR %</div>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'right',
                            padding: '8px 0',
                          }}>
                            <Dialog
                              PaperProps={{
                                style: {
                                  width: "100%",
                                  maxWidth: 600,
                                  background: 'transpaarent',
                                  borderRadius: 20,
                                  overflowY: "visible"
                                }
                              }}
                              open={open}
                              onClose={handleTooltipClose}
                              onClick={(e) => {
                                if (e.target.classList.contains('MuiDialog-container')) {
                                  handleTooltipClose()
                                }
                              }}
                            >
                              <div className={css.boostCalculatorTooltip}>
                                <BoostCalculator popuped={true} pair={row} ve={veTok} nft={nfts.reduce((acc, item) => item.totalPower > acc.totalPower ? item : acc, nfts[0])} isMobileView={true} amount={100} />
                              </div>
                            </Dialog>
                            <img
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTooltipOpen()
                              }}
                              src={(row?.gauge?.boost && BigNumber(row?.gauge?.boost).gt(0) && BigNumber(row?.gauge?.balance).gt(0))
                                ? "/images/boost_fired.svg"
                                : (BigNumber(row?.balance).gt(0))
                                  ? "/images/boost-empty.svg"
                                  : "/images/icon-info.svg"
                              }
                              width="22px"
                              style={{ marginRight: 10 }}
                              alt="boost"
                            />

                            {/* <Tooltip
                                title={
                                  <React.Fragment>
                                    {[1].map(() => {
                                      const veTok = stores.stableSwapStore.getStore("veToken");
                                      const nfts = stores.stableSwapStore.getStore("vestNFTs") ?? [];
                                      const nft = nfts.reduce((acc, item) => item.totalPower > acc.totalPower ? item : acc, nfts[0]);

                                      return <div className={css.boostCalculatorTooltip}>
                                        <BoostCalculator popuped={true} pair={row} ve={veTok} nft={nft}
                                                         isMobileView={true} amount={100}/>
                                      </div>
                                    })
                                    }
                                  </React.Fragment>
                                }
                                classes={{
                                  tooltip: css.tooltip_boost_wrapper
                                }}
                            >
                              <img src={
                                (row?.gauge?.boost && BigNumber(row?.gauge?.boost).gt(0) && BigNumber(row?.gauge?.balance).gt(0))
                                    ? "/images/boost_fired.svg"
                                    : (BigNumber(row?.balance).gt(0))
                                        ? "/images/boost-empty.svg"
                                        : "/images/icon-info.svg"
                              }
                                   width="22px" style={{ marginRight: 10 }} alt="boost" />
                            </Tooltip> */}
                            <div
                                className={classes.inlineEnd}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                }}
                            >
                              <Typography
                                  className={classes.textSpaced}
                                  style={{
                                    marginBottom: 4,
                                    fontWeight: 500,
                                    fontSize: 12,
                                    lineHeight: '12px',
                                    color: '#F6F7F9',
                                    whiteSpace: 'nowrap',
                                  }}>
                                {BigNumber(row?.gauge?.apr).gt(0) ? `${
                                    formatCurrency(BigNumber.sum(BigNumber(row?.gauge?.derivedAPR).div(100).times(40),
                                        BigNumber(row?.gauge?.additionalApr0),
                                        BigNumber(row?.gauge?.additionalApr1)
                                    ),3)
                                }%` : '-'}
                              </Typography>
                              <Typography
                                  className={classes.textSpaced}
                                  style={{
                                    fontWeight: 500,
                                    fontSize: 12,
                                    lineHeight: '12px',
                                    color: '#F6F7F9',
                                    whiteSpace: 'nowrap',
                                  }}>
                                {BigNumber(row?.gauge?.apr).gt(0) ? `${
                                    formatCurrency(BigNumber.sum(BigNumber(row?.gauge?.derivedAPR),
                                        BigNumber(row?.gauge?.additionalApr0),
                                        BigNumber(row?.gauge?.additionalApr1)
                                    ),3)
                                }%` : '-'}
                              </Typography>
                            </div>
                            <div
                                className={classes.inlineEnd}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                }}
                            >
                              <Typography
                                  className={`${classes.textSpaced} ${classes.symbol}`}
                                  style={{
                                    marginBottom: 4,
                                    fontWeight: 500,
                                    fontSize: 12,
                                    lineHeight: '12px',
                                    color: '#9A9FAF',
                                    textAlign: 'right',
                                  }}>
                                min
                              </Typography>
                              <Typography
                                  className={`${classes.textSpaced} ${classes.symbol}`}
                                  style={{
                                    fontWeight: 500,
                                    fontSize: 12,
                                    lineHeight: '12px',
                                    color: '#9A9FAF',
                                    textAlign: 'right',
                                  }}>
                                max
                              </Typography>
                            </div>
                          </div>
                        </div>

                        {(expanded === labelId) && (
                            <div>
                              {headCells.map((headCell) => (
                                  <React.Fragment key={headCell.id + '_'}>
                                    {!headCell.isHideInDetails &&
                                        <div
                                            style={{
                                              borderBottom: headCell.id === 'stakedAmount' ? 'none' : '1px solid rgba(104, 114, 122, 0.4)',
                                              borderTop: headCell.id !== 'poolBalance' ? 'none' : '1px solid rgba(104, 114, 122, 0.4)',
                                            }}
                                            className={['g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                                          <Typography
                                              className={classes.cellHeadPaddings}
                                              style={{
                                                borderRight: '1px solid rgba(104, 114, 122, 0.4)',
                                                width: '100px',
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                fontWeight: 500,
                                                fontSize: 12,
                                                lineHeight: '16px',
                                                color: '#9A9FAF',
                                              }}
                                              noWrap>
                                            {headCell.label}
                                          </Typography>

                                          <div
                                              className={classes.cellPaddings}
                                              style={{
                                                width: '50%',
                                                display: 'flex',
                                                justifyContent: 'flex-end',
                                              }}>
                                            <div
                                                className={classes.inlineEnd}
                                                style={{
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  alignItems: 'flex-end',
                                                }}>
                                              <Typography
                                                  className={classes.textSpaced}
                                                  style={{
                                                    marginBottom: 4,
                                                    fontWeight: 500,
                                                    fontSize: 12,
                                                    lineHeight: '12px',
                                                    color: '#F6F7F9',
                                                    whiteSpace: 'nowrap',
                                                  }}>
                                                {headCell.id === 'poolAmount' && formatCurrency(row.reserve0)}
                                                {headCell.id === 'poolBalance' && formatCurrency(BigNumber(row.balance).div(row.totalSupply).times(row.reserve0))}
                                                {headCell.id === 'stakedBalance' && row?.gauge?.address && formatCurrency(BigNumber(row.gauge.balance).div(row.gauge.totalSupply).times(row.gauge.reserve0))}
                                                {headCell.id === 'stakedBalance' && !row?.gauge?.address && 'No gauge'}
                                                {headCell.id === 'stakedAmount' && row?.gauge?.address && formatCurrency(row.gauge.reserve0)}
                                                {headCell.id === 'stakedAmount' && !row?.gauge?.address && 'No gauge'}
                                              </Typography>

                                              <Typography
                                                  className={classes.textSpaced}
                                                  style={{
                                                    fontWeight: 500,
                                                    fontSize: 12,
                                                    lineHeight: '12px',
                                                    color: '#F6F7F9',
                                                    whiteSpace: 'nowrap',
                                                  }}>
                                                {headCell.id === 'poolAmount' && formatCurrency(row.reserve1)}
                                                {headCell.id === 'poolBalance' && formatCurrency(BigNumber(row.balance).div(row.totalSupply).times(row.reserve1))}
                                                {headCell.id === 'stakedBalance' && row?.gauge?.address && formatCurrency(BigNumber(row.gauge.balance).div(row.gauge.totalSupply).times(row.gauge.reserve1))}
                                                {headCell.id === 'stakedBalance' && !row?.gauge?.address && 'No gauge'}
                                                {headCell.id === 'stakedAmount' && row?.gauge?.address && formatCurrency(row.gauge.reserve1)}
                                                {headCell.id === 'stakedAmount' && !row?.gauge?.address && 'No gauge'}
                                              </Typography>
                                            </div>

                                            <div
                                                className={classes.inlineEnd}
                                                style={{
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  alignItems: 'flex-end',
                                                  paddingLeft: 10,
                                                }}>
                                              <Typography
                                                  className={`${classes.textSpaced} ${classes.symbol}`}
                                                  style={{
                                                    marginBottom: 4,
                                                    fontWeight: 500,
                                                    fontSize: 12,
                                                    lineHeight: '12px',
                                                    color: '#9A9FAF',
                                                    textAlign: 'right',
                                                  }}>
                                                {formatSymbol(row.token0.symbol)}
                                              </Typography>

                                              <Typography
                                                  className={`${classes.textSpaced} ${classes.symbol}`}
                                                  style={{
                                                    fontWeight: 500,
                                                    fontSize: 12,
                                                    lineHeight: '12px',
                                                    color: '#9A9FAF',
                                                    textAlign: 'right',
                                                  }}>
                                                {formatSymbol(row.token1.symbol)}
                                              </Typography>
                                            </div>
                                          </div>
                                        </div>
                                    }
                                  </React.Fragment>
                              ))}
                            </div>
                        )}
                      </div>



                      <div
                          onClick={(e) => {
                            console.log('test')
                            handleChangeAccordion(e, labelId)
                          }}
                        style={{ padding: '10px 20px', }}
                        className={[classes.cellHeadPaddings, 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                        <Typography
                          style={{
                            fontWeight: 700,
                            fontSize: 16,
                            lineHeight: '16px',
                            color: '#EAE8E1',
                          }}
                          noWrap>
                          {expanded !== labelId ? 'Show' : 'Hide'} more details
                        </Typography>

                        <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M0.979238 5.27094C2.36454 3.19808 5.26851 0 9.99995 0C14.7314 0 17.6354 3.19808 19.0207 5.27094C19.4855 5.96655 19.718 6.31435 19.6968 6.95691C19.6757 7.59948 19.4088 7.94688 18.8752 8.64168C17.2861 10.7107 14.1129 14 9.99995 14C5.88699 14 2.71384 10.7107 1.12471 8.64168C0.591062 7.94688 0.324239 7.59948 0.303083 6.95691C0.281927 6.31435 0.514364 5.96655 0.979238 5.27094ZM9.99995 11C12.2091 11 13.9999 9.20914 13.9999 7C13.9999 4.79086 12.2091 3 9.99995 3C7.79081 3 5.99995 4.79086 5.99995 7C5.99995 9.20914 7.79081 11 9.99995 11Z" fill="#7DB857"/>
                        </svg>
                      </div>
                    </div>
                  </AccordionSummary>

                  <AccordionDetails
                    style={{
                      padding: 0,
                    }}>

                  </AccordionDetails>
                </Accordion>
              );
            })
          }

              <TablePagination
                  className={'g-flex-column__item-fixed'}
                  style={{
                    width: '100%',
                    // marginTop: 20,
                    padding: '0',
                    background: '#131313',
                    // borderTop: '1px solid #d3f85a',
                    borderRadius: 16,
                    color: '#8191B9',
                  }}
                  component="div"
                  count={filteredPairs.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  labelRowsPerPage={window.innerWidth < 550 ? null : 'Rows per page:'}
                  rowsPerPageOptions={window.innerWidth < 435 ? [] : [5, 10, 25]}
                  ActionsComponent={TablePaginationActions}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  classes={{
                    root: css.paginationRoot,
                    toolbar: css.paginationToolbar,
                    spacer: css.paginationSpacer,
                    selectLabel: css.selectLabel,
                    selectRoot: css.selectRoot,
                    select: css.select,
                    selectIcon: css.selectIcon,
                    input: css.input,
                    menuItem: css.menuItem,
                    displayedRows: css.displayedRows,
                    actions: css.actions,
                  }}
              />
          
        </div>
      }
      </>
      }
    </div>
  );
}
