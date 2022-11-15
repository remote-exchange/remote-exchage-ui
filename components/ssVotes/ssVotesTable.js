import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles, styled } from '@mui/styles';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Typography,
  Slider,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails, Button, DialogTitle, DialogContent, Dialog, InputBase, MenuItem, Select, AccordionActions,
} from '@mui/material';
import numeral from "numeral";
import BigNumber from 'bignumber.js';

import { formatCurrency } from '../../utils';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import TablePaginationActions from '../table-pagination/table-pagination';
import SortSelect from '../select-sort/select-sort';
import { formatSymbol } from '../../utils';
import css from "./ssVotesTable.module.css";
import cssVoteModal from "./voteModal.module.css";
import cssTokenSelect from '../select-token/select-token.module.css';

const CustomSlider = styled(Slider)(({theme, appTheme, disabled}) => {
  const MuiSliderthumb = {
    backgroundColor: '#C0E255',
  }

  const MuiSliderTrack = {}

  const MuiSliderRail = {
    background: 'linear-gradient(to left, rgba(69, 155, 14, 0.12) 50%, rgba(155, 14, 14, 0.12) 50%)',
  }

  if (disabled) {
    MuiSliderthumb.backgroundColor = appTheme === 'dark' ? '#7F828B' : '#A3A9BA'
    MuiSliderTrack.backgroundColor = '#D4D5DB'
    MuiSliderRail.background = 'rgb(210 210 210)'
  }

  return ({
    height: 8,
    padding: '10px 0',

    '& .MuiSlider-thumb': {
      height: 20,
      width: 20,
      borderRadius: '50%',
      backgroundColor: '#B1F1E3',
      boxShadow: 'none',

      '&:focus, &:hover, &.Mui-active': {
        boxShadow: 'none',
        '@media (hover: none)': {
          boxShadow: 'none',
        },
      },
    },
    '& .MuiSlider-valueLabel': {
      display: 'none',
    },
    '& .MuiSlider-track': {
      border: 'none',
      backgroundColor: MuiSliderTrack.backgroundColor,
      opacity: 0,
    },
    '& .MuiSlider-rail': {
      height: 8,
      border: '1px solid #353A42',
      borderRadius: '8px 8px',
      opacity: 1,
      background: MuiSliderRail.background,
    },
    '& .MuiSlider-mark': {
      opacity: 0,
      backgroundColor: "transparent",
      height: 2,
      width: 2,
      '&.MuiSlider-markActive': {
        opacity: 0,
      },
    },
    '& .MuiSlider-mark:nth-of-type(20n)': {
      opacity: 1,

      '&.MuiSlider-markActive': {
        opacity: 1,
      }
    },
  });
});

function descendingComparator(a, b, orderBy, sliderValues) {
  if (!a || !b) {
    return 0;
  }

  switch (orderBy) {
    case 'asset':
      return formatSymbol(a.symbol).localeCompare(formatSymbol(b.symbol));

    case 'tvl':
      if (BigNumber(b?.tvl).lt(a?.tvl)) {
        return -1;
      }
      if (BigNumber(b?.tvl).gt(a?.tvl)) {
        return 1;
      }
      return 0;

    case 'balance':
      if (BigNumber(b?.gauge?.balance).lt(a?.gauge?.balance)) {
        return -1;
      }
      if (BigNumber(b?.gauge?.balance).gt(a?.gauge?.balance)) {
        return 1;
      }
      return 0;

    case 'liquidity':
      let reserveA = BigNumber(a?.reserve0).plus(a?.reserve1).toNumber();
      let reserveB = BigNumber(b?.reserve0).plus(b?.reserve1).toNumber();

      if (BigNumber(reserveB).lt(reserveA)) {
        return -1;
      }
      if (BigNumber(reserveB).gt(reserveA)) {
        return 1;
      }
      return 0;

    case 'totalVotes':
      if (BigNumber(b?.gauge?.weight).lt(a?.gauge?.weight)) {
        return -1;
      }
      if (BigNumber(b?.gauge?.weight).gt(a?.gauge?.weight)) {
        return 1;
      }
      return 0;

    case 'apy':
      let apyA = a?.gaugebribes.bribeTokens.length ? (
        a?.gaugebribes.bribeTokens.map((bribe, idx) => {
          return BigNumber(bribe.left).toNumber()
        }).reduce((partialSum, a) => partialSum + a, 0)
      ) : 0;

      let apyB = b?.gaugebribes.bribeTokens.length ? (
        b?.gaugebribes.bribeTokens.map((bribe, idx) => {
          return BigNumber(bribe.left).toNumber()
        }).reduce((partialSum, a) => partialSum + a, 0)
      ) : 0;

      return apyA - apyB;

    case 'myVotes':
    case 'mvp':
      // BigNumber(sliderValue).div(100).times(token?.lockValue)
      let sliderValueA = sliderValues.find((el) => el.address === a?.address)?.value;
      if (sliderValueA) {
        sliderValueA = BigNumber(sliderValueA).toNumber(0);
      } else {
        sliderValueA = 0;
      }

      let sliderValueB = sliderValues.find((el) => el.address === b?.address)?.value;
      if (sliderValueB) {
        sliderValueB = BigNumber(sliderValueB).toNumber(0);
      } else {
        sliderValueB = 0;
      }

      return sliderValueA - sliderValueB;

    default:
      return 0;
  }

}

function getComparator(order, orderBy, sliderValues) {
  return order === 'desc' ? (a, b) => descendingComparator(a, b, orderBy, sliderValues) : (a, b) => -descendingComparator(a, b, orderBy, sliderValues);
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
    id: 'asset',
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
    label: 'TVL',
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
    id: 'balance',
    numeric: true,
    disablePadding: false,
    label: 'My Stake',
    isHideInDetails: false,
  },
  {
    id: 'liquidity',
    numeric: true,
    disablePadding: false,
    label: 'Total Liquidity',
    isHideInDetails: false,
  },
  {
    id: 'bribes',
    numeric: true,
    disablePadding: false,
    label: 'Bribes',
    isHideInDetails: false,
  },
  {
    id: 'bribesApy',
    numeric: true,
    disablePadding: false,
    label: 'Bribes apr %',
    isHideInDetails: false,
  },
  {
    id: 'totalVotes',
    numeric: true,
    disablePadding: false,
    label: 'Total Votes',
    isHideInDetails: false,
  },
  {
    id: 'myVotes',
    numeric: true,
    disablePadding: false,
    label: 'My Votes',
    isHideInDetails: false,
  },
];

const StickyTableCell = styled(TableCell)(({theme, appTheme}) => ({
  color: appTheme === 'dark' ? '#C6CDD2 !important' : '#325569 !important',
  width: 310,
  left: 0,
  position: "sticky",
  zIndex: 5,
  whiteSpace: 'nowrap',
  padding: '15px 24px 16px',
}));

const StyledTableCell = styled(TableCell)(({theme, appTheme}) => ({
  background: appTheme === 'dark' ? '#24292D' : '#CFE5F2',
  width: 'auto',
  whiteSpace: 'nowrap',
  padding: '15px 24px 16px',
}));

const sortIcon = (sortDirection) => {
  const {appTheme} = useAppThemeContext();

  return (
    <>
      <svg
        style={{
          marginRight: 10,
          transform: sortDirection === 'desc' ? 'rotate(0deg)' : 'rotate(180deg)',
        }}
        width="11"
        height="13"
        viewBox="0 0 11 13"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M5.5 1.66663L4.79289 0.959519L5.5 0.252412L6.20711 0.959519L5.5 1.66663ZM6.5 11.6666C6.5 12.2189 6.05229 12.6666 5.5 12.6666C4.94772 12.6666 4.5 12.2189 4.5 11.6666L6.5 11.6666ZM0.792893 4.95952L4.79289 0.959519L6.20711 2.37373L2.20711 6.37373L0.792893 4.95952ZM6.20711 0.959519L10.2071 4.95952L8.79289 6.37373L4.79289 2.37373L6.20711 0.959519ZM6.5 1.66663L6.5 11.6666L4.5 11.6666L4.5 1.66663L6.5 1.66663Z" fill="#353A42"/>
      </svg>
    </>
  );
};

function EnhancedTableHead(props) {
  const {classes, order, orderBy, onRequestSort} = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  const {appTheme} = useAppThemeContext();

  return (
    <TableHead>
      <TableRow style={{ whiteSpace: 'nowrap' }}>
        {headCells.map((headCell) => (
          <>
            {headCell.isSticky ? (
              <StickyTableCell
                className={css.headCell}
                appTheme={appTheme}
                key={headCell.id}
                align={headCell.numeric ? 'right' : 'left'}
                padding={'normal'}
                sortDirection={orderBy === headCell.id ? order : false}
                style={{
                  // zIndex: 10,
                }}
              >
                <TableSortLabel
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : 'asc'}
                  IconComponent={() => orderBy === headCell.id ? sortIcon(order) : null}
                  onClick={createSortHandler(headCell.id)}
                >
                  <div className={css.headerText}>
                    {headCell.label}
                  </div>
                </TableSortLabel>
              </StickyTableCell>
            ) : (
              <StyledTableCell
                className={css.headCell}
                key={headCell.id}
                align={headCell.numeric ? 'right' : 'left'}
                padding={'normal'}
                sortDirection={orderBy === headCell.id ? order : false}
              >
                <TableSortLabel
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : 'asc'}
                  IconComponent={() => orderBy === headCell.id ? sortIcon(order) : null}
                  onClick={createSortHandler(headCell.id)}
                >
                  <div className={css.headerText}>
                    {headCell.label}
                  </div>
                </TableSortLabel>
              </StyledTableCell>
            )}
          </>
        ))}
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

const useStyles = makeStyles((theme) => {
  return ({
    tokenSelect: {
      marginBottom: 24,
    },
    voteTooltip: {
      background: '#060B17',
      border: '1px solid #D3F85A',
      borderRadius: 12,
      flexDirection: 'column',
      width: 448,
      height: 172,
      position: 'absolute',
      top: 46,
      right: 14,
      zIndex: 1,
      padding: '24px 24px',
    },
    voteTooltipSliderValues: {
      display: 'flex',
      justifyContent: 'space-between',
      color: '#586586',
      fontSize: 16,
      fontWeight: 400,
      marginBottom: 3,
    },
    voteTooltipSlider: {},
    voteTooltipBody: {
      display: 'flex',
      textAlign: 'left',
      marginTop: 3,
      justifyContent: 'space-between',
      height: 56,
    },
    voteTooltipText: {
      width: 160,
      color: '#8191B9',
      fontSize: 16,
      fontWeight: 400,
      display: 'flex',
      alignItems: 'center',
    },
    voteTooltipTextModal: {
      // width: 160,
      color: '#8191B9',
      fontSize: 14,
      fontWeight: 400,
      lineHeight: '20px',
      display: 'flex',
      // alignItems: 'center',
      marginBottom: 12,
    },
    voteTooltipVoteBlock: {
      display: 'flex',
      width: 223,
      border: '1px solid #586586',
      borderRadius: 12,
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
    },
    voteTooltipVoteBlockModal: {
      display: 'flex',
      width: '100%',
      border: '1px solid #586586',
      borderRadius: 12,
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
    },
    voteTooltipVoteBlockTitle: {
      color: '#E4E9F4',
      fontSize: 16,
      fontWeight: 500,
      marginLeft: 14,
    },
    voteTooltipVoteBlockInput: {
      background: '#171D2D',
      border: '1px solid #586586',
      borderRadius: 12,
      width: 113,
      height: 56,
      padding: 0,
      fontSize: 16,
      fontWeight: 400,
      color: '#8191B9',
      paddingLeft: 32,
      boxSizing: 'border-box',
    },
    voteTooltipVoteBlockInputModal: {
      background: '#171D2D',
      border: '1px solid #586586',
      borderRadius: 12,
      width: 193,
      height: 56,
      padding: 0,
      fontSize: 16,
      fontWeight: 400,
      color: '#8191B9',
      paddingLeft: 32,
      boxSizing: 'border-box',
    },
    voteTooltipVoteBlockInputAddornment: {
      position: 'absolute',
      right: 32,
      fontSize: 16,
      fontWeight: 400,
      color: '#8191B9',
    },
    cont: {
      ["@media (min-width:1920px)"]: {
        marginLeft: 400,
      },
    },
    root: {
      width: '100%',
    },
    paper: {
      width: '100%',
      marginBottom: theme.spacing(2),
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
    inlinePair: {
      display: 'flex',
      alignItems: 'center',
      background: '#171D2D',
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      height: 72,
    },
    inlineBetween: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0px',
    },
    icon: {
      marginRight: '12px',
    },
    textSpaced: {
      lineHeight: '1.5',
      fontWeight: '200',
      fontSize: '12px',
    },
    textSpacedFloat: {
      lineHeight: '1.5',
      fontWeight: '200',
      fontSize: '12px',
      float: 'right',
    },
    symbol: {
      minWidth: '40px',
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
      borderBottom: '1px solid rgba(128, 128, 128, 0.32)',
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
      borderBottom: '1px solid rgba(128, 128, 128, 0.32)',
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
    imgLogo: {
      marginRight: '12px',
    },
    tableContainer: {
      overflowX: 'hidden',
    },
    overrideTableHead: {
      borderBottom: '1px solid rgba(104,108,122,0.2) !important',
    },
    headerText: {
      fontWeight: '200',
      fontSize: '12px',
    },
    tooltipContainer: {
      minWidth: '240px',
      padding: '0px 15px',
    },
    infoIcon: {
      color: '#06D3D7',
      fontSize: '16px',
      float: 'right',
      marginLeft: '10px',
    },
    doubleImages: {
      display: 'flex',
    },
    img1Logo: {
      border: '1px solid #131313',
      borderRadius: '30px',
      background: '#13B5EC',
    },
    img2Logo: {
      marginLeft: -16,
      border: '1px solid #131313',
      borderRadius: '30px',
      background: '#13B5EC',
    },
    inlineEnd: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    table: {
      tableLayout: 'auto',
    },
    tableBody: {
      background: '#171D2D',
    },
    sortSelect: {
      position: 'absolute',
      top: 87,
      right: 40,
      ["@media (max-width:680px)"]: {
        top: 68,
        right: 32,
      },
    },
    accordionSummaryContent: {
      margin: 0,
      padding: 0,
    },
    dialogPaper: {
      borderRadius: 12,
      width: 353,
      background: '#060B17',
      border: '1px solid #D3F85A',
    },
    dialogBody: {
      background: 'rgba(0, 0, 0, 0.1) !important',
      backdropFilter: 'blur(10px) !important',
    },
    cellPaddings: {
      padding: '11px 20px',
      ["@media (max-width:530px)"]: {
        // eslint-disable-line no-useless-computed-key
        // padding: 10,
      },
    },
    cellHeadPaddings: {
      padding: '16px 20px',
      ["@media (max-width:530px)"]: {
        // eslint-disable-line no-useless-computed-key
        // padding: '8px 10px',
      },
    },
  });
});

export default function EnhancedTable({gauges, setParentSliderValues, defaultVotes, veToken, token, showSearch, noTokenSelected, handleChangeNFT, vestNFTs}) {
  const classes = useStyles();
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('totalVotes');
  const [sliderValues, setSliderValues] = useState(defaultVotes);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [tableHeight, setTableHeight] = useState(window.innerHeight/* - 50 - 64 - 30 - 60 - 54 - 20 - 30*/);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const options = [
    {id: 'balance--desc', label: 'My Stake: high to low'},
    {id: 'balance--asc', label: 'My Stake: low to high'},
    {id: 'liquidity--desc', label: 'Total Liquidity: high to low'},
    {id: 'liquidity--asc', label: 'Total Liquidity: low to high'},
    {id: 'totalVotes--desc', label: 'Total Votes: high to low'},
    {id: 'totalVotes--asc', label: 'Total Votes: low to high'},
    {id: 'apy--desc', label: 'Bribes: high to low'},
    {id: 'apy--asc', label: 'Bribes: low to high'},
    {id: 'myVotes--desc', label: 'My Votes: high to low'},
    {id: 'myVotes--asc', label: 'My Votes: low to high'},
  ];

  const [sortValueId, setSortValueId] = useState('totalVotes--desc');
  const [sortDirection, setSortDirection] = useState('asc');
  const [expanded, setExpanded] = useState('');
  const [voteDialogOpen, setVoteDialogOpen] = useState(false);

  const {appTheme} = useAppThemeContext();

  useEffect(() => {
    setSliderValues(defaultVotes);
  }, [defaultVotes]);

  const arrowIcon = () => {
    return (
        <svg style={{pointerEvents: 'none', position: 'absolute', right: 16,}} width="18" height="9"
             viewBox="0 0 18 9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M16.9201 0.949951L10.4001 7.46995C9.63008 8.23995 8.37008 8.23995 7.60008 7.46995L1.08008 0.949951"
            stroke="#D3F85A" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round"
            strokeLinejoin="round"/>
        </svg>
    );
  };

  const onSliderChange = (event, value, asset) => {
    let newSliderValues = [...sliderValues];

    newSliderValues = newSliderValues.map((val) => {
      if (asset?.address?.toLowerCase() === val?.address?.toLowerCase()) {
        val.value = value;
      }
      return val;
    });

    setParentSliderValues(newSliderValues);
  };

  const handleChangeSort = ({target: {value}}) => {
    const property = value.substring(0, value.indexOf('--'));
    const event = value.substring(value.indexOf('--') + 2);

    setSortValueId(value);
    setSortDirection(event);

    handleRequestSort(event, property);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (!gauges) {
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

  const marks = [
    {
      value: -100,
      label: '-100',
    },
    {
      value: 0,
      label: '0',
    },
    {
      value: 100,
      label: '100',
    },
  ];

  function tableCellContent(data1, data2, symbol1, symbol2) {
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right" }}>
          <div className={css.itemTitle} style={{ marginBottom: 2 }}>
            {data1}
          </div>

          <div className={css.itemTitle}>
            {data2}
          </div>
        </div>

        {(symbol1 || symbol2) &&
          <div style={{ paddingLeft: 8, display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: 'left' }}>
            <div className={`${css.itemText} ${classes.symbol}`} style={{ marginBottom: 2 }}>
              {symbol1}
            </div>

            <div className={`${css.itemText} ${classes.symbol}`}>
              {symbol2}
            </div>
          </div>
        }
      </div>
    );
  }

  const handleChangeAccordion = (event, newExpanded) => {
    console.log("newExpanded", newExpanded)
    if (newExpanded === expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(newExpanded ? newExpanded : false);
  };

  const closeModal = () => {
    setVoteDialogOpen(false);
  };

  const openVoteDialog = (row) => {
    setVoteDialogOpen(row?.address);
  };

  window.addEventListener('resize', () => {
    setTableHeight(window.innerHeight - 50 - 64 - 30 - 60 - 54 - 20 - 30);
    setWindowWidth(window.innerWidth);
  });

  const [voteTooltipOpen, setVoteTooltipOpen] = useState(false);

  const [openSelectToken, setOpenSelectToken] = useState(false);

  const toggleSelect = (t) => {
    if (openSelectToken) {
      setOpenSelectToken(false)
    } else {
      setOpenSelectToken(t?.address);
    }
  };

  // cssVoteModal
  return (
    <>
      {windowWidth >= 806 &&
        <div>
          <div className={css.tableWrapper}>
            <TableContainer className={['g-flex-column__item', css.tableContainer].join(" ")}>
            <Table
              stickyHeader
              className={classes.table}
              aria-labelledby="tableTitle"
              size={'medium'}
              aria-label="enhanced table"
            >
              <EnhancedTableHead
                classes={classes}
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
              />

              <TableBody classes={{ root: classes.tableBody }}>
                {stableSort(gauges, getComparator(order, orderBy, sliderValues))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row, index) => {
                    if (!row) {
                      return null;
                    }
                    let sliderValue = sliderValues.find((el) => el.address === row?.address)?.value;
                    if (sliderValue) {
                      sliderValue = BigNumber(sliderValue).toNumber(0);
                    } else {
                      sliderValue = 0;
                    }

                    return (
                      <TableRow key={row?.gauge?.address}>
                        <StickyTableCell className={css.cell}>
                          <div className={classes.inline}>
                            <div className={classes.doubleImages}>
                              <img
                                className={classes.img1Logo}
                                src={(row && row.token0 && row.token0.logoURI) ? row.token0.logoURI : ``}
                                width="36"
                                height="36"
                                alt=""
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                }}
                              />
                              <img
                                className={classes.img2Logo}
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
                            <div style={{ marginLeft: 12 }}>
                              <div className={css.vaultSourceTitle}>
                                {formatSymbol(row?.symbol)}
                              </div>
                              <div className={css.vaultSourceSubtitle}>
                                {row?.isStable ? 'Stable Pool' : 'Volatile Pool'}
                              </div>
                            </div>
                          </div>
                        </StickyTableCell>

                        <TableCell className={css.cell}>
                          {tableCellContent(
                            `${(numeral(BigNumber(row?.tvl).toLocaleString()).format('($ 0a)'))}`,
                            null,
                            null,
                            null,
                          )}
                        </TableCell>

                        <TableCell className={css.cell}>
                          {tableCellContent(
                            `${formatCurrency(BigNumber(row?.gauge?.derivedAPR), 0)}%`,
                            `${formatCurrency(BigNumber(row?.gauge?.expectAPRDerived), 0)}%`,
                            'Current',
                            'Next week'
                          )}
                        </TableCell>
                        
                        <TableCell className={css.cell}>
                          {tableCellContent(
                            formatCurrency(BigNumber(row?.gauge?.balance).div(row?.gauge?.totalSupply).times(row?.gauge?.reserve0)),
                            formatCurrency(BigNumber(row?.gauge?.balance).div(row?.gauge?.totalSupply).times(row?.gauge?.reserve1)),
                            row.token0.symbol,
                            row.token1.symbol,
                          )}
                        </TableCell>

                        <TableCell className={css.cell}>
                          {tableCellContent(
                            formatCurrency(BigNumber(row?.reserve0)),
                            formatCurrency(BigNumber(row?.reserve1)),
                            row.token0.symbol,
                            row.token1.symbol,
                          )}
                        </TableCell>

                        <TableCell className={css.cell}>
                          {row?.gaugebribes.bribeTokens.length ? (
                            row?.gaugebribes.bribeTokens
                              .filter(x => !BigNumber(x?.left).isZero())
                              .map((bribe, idx) => {
                                return (
                                  <>
                                    {tableCellContent(
                                      formatCurrency(bribe.left),
                                      null,
                                      bribe.token.symbol,
                                      null,
                                    )}
                                  </>
                                );
                              })
                            ) : null
                          }
                        </TableCell>

                        <TableCell className={css.cell}>
                          {row?.gaugebribes.bribeTokens.length ? (
                            row?.gaugebribes.bribeTokens
                              .filter(x => !BigNumber(x?.left).isZero())
                              .map((bribe, idx) => {
                                return (
                                  <>
                                    {tableCellContent(
                                      `${Number(bribe.apr).toFixed(1)}%`,
                                      null,
                                      bribe.token.symbol,
                                      null,
                                    )}
                                  </>
                                );
                              })
                            ) : null
                          }
                        </TableCell>

                        <TableCell className={css.cell}>
                          {tableCellContent(
                            formatCurrency(row?.gauge?.weight),
                            `${formatCurrency(row?.gauge?.weightPercent)} %`,
                            null,
                            null,
                          )}
                        </TableCell>

                        <TableCell className={css.cell}>
                          <div style={{ display: "flex", justifyContent: 'flex-end', alignItems: 'center' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ display: "flex", justifyContent: "center" }}>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                  <div className={css.itemTitle} style={{ marginBottom: 2 }}>
                                    {formatCurrency(BigNumber(sliderValue).div(100).times(token?.lockValue))}
                                  </div>

                                  <div
                                    className={css.itemTitle}
                                    style={{
                                      color: sliderValue > 0
                                        ? "#459B0E"
                                        : sliderValue < 0 ? "#9B0E0E" : "#9A9FAF"
                                    }}
                                  >
                                    {`${formatCurrency(sliderValue)} %`}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div style={{ paddingLeft: 10 }}>
                              <Button
                                variant="outlined"
                                color="primary"
                                className={css.action}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  event.preventDefault();

                                  if (voteTooltipOpen == row.address) {
                                    setVoteTooltipOpen(false)
                                  } else {
                                    setVoteTooltipOpen(row.address)
                                  }
                                }}
                              >
                                VOTE
                              </Button>

                              <Dialog
                                open={voteTooltipOpen == row.address}
                                PaperProps={{ style: { width: "100%", maxWidth: 520, background: 'transpaarent', borderRadius: 20 } }}
                                onClick={(e) => {
                                  if (e.target.classList.contains('MuiDialog-container')) {
                                    closeModal();
                                  }
                                }}
                                // classes={{
                                  // paperScrollPaper: classesDialog.paperScrollPaper,
                                  // paper: classesDialog.paper,
                                  // scrollPaper: classesDialog.scrollPaper,
                                // }}
                              >
                              <div
                                // className={cssVoteModal.voteTooltip}
                                // style={{display: voteTooltipOpen == row.address ? 'block' : 'none'}}
                              >
                                <div className={cssVoteModal.voteTooltipHeader}>
                                  <span className={cssVoteModal.voteTooltipTitle}>Vote for the Pool</span>
                                  <span className={cssVoteModal.voteTooltipClose} onClick={() => {
                                    setVoteTooltipOpen(false)
                                  }} />
                                </div>

                                <div className={cssVoteModal.voteTooltipBody}>
                                  <div className={classes.tokenSelect}>
                                    <Select
                                      open={openSelectToken === row.address}
                                      onClick={() => {toggleSelect(row)}}
                                      className={[
                                        cssTokenSelect.tokenSelect,
                                        openSelectToken ? cssTokenSelect.tokenSelectOpen : '',
                                        token ? cssTokenSelect.tokenSelectSelected : '',
                                      ].join(' ')}
                                      classes={{
                                        select: cssTokenSelect.selectWrapper,
                                      }}
                                      fullWidth
                                      MenuProps={{
                                        classes: {
                                          list: appTheme === 'dark' ? cssTokenSelect['list--dark'] : cssTokenSelect.list,
                                          paper: cssTokenSelect.listPaper,
                                        },
                                      }}
                                      value={token}
                                      {...{
                                        displayEmpty: token === null ? true : undefined,
                                        renderValue: token === null ? (selected) => {
                                          if (selected === null) {
                                            return (
                                              <div className={cssTokenSelect.placeholder}>
                                                Select veCONE NFT
                                              </div>
                                            );
                                          }
                                        } : undefined,
                                      }}
                                      onChange={handleChangeNFT}
                                      IconComponent={arrowIcon}
                                      inputProps={{
                                        className: appTheme === 'dark' ? cssTokenSelect['tokenSelectInput--dark'] : cssTokenSelect.tokenSelectInput,
                                      }}>
                                      {(!vestNFTs || !vestNFTs.length) &&
                                        <div className={cssTokenSelect.noNFT}>
                                          <div className={cssTokenSelect.noNFTtext}>
                                          You receive NFT by creating a Lock of your CONE for some time, the more CONE you lock and for
                                          the longest time, the more Voting Power your NFT will have.
                                          </div>
                                          <div className={cssTokenSelect.noNFTlinks}>
                                            <span
                                              className={cssTokenSelect.noNFTlinkButton}
                                              onClick={() => {
                                                router.push("/swap")
                                              }}
                                            >
                                              BUY CONE
                                            </span>
                                            <span
                                              className={cssTokenSelect.noNFTlinkButton}
                                              onClick={() => {
                                                router.push("/vest")
                                              }}>
                                                LOCK CONE FOR NFT
                                            </span>
                                          </div>
                                        </div>
                                      }
                                      {vestNFTs?.map((option) => {
                                        return (
                                          <MenuItem key={option.id} value={option}>
                                            <div className={[cssTokenSelect.menuOption, 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                                              <div>
                                                #{option.id}
                                              </div>

                                              <div className={[cssTokenSelect.menuOptionSec, 'g-flex-column'].join(' ')}>
                                                <div>
                                                  {formatCurrency(option.lockValue)}
                                                  {veToken?.symbol ? ' ' + veToken.symbol : ''}
                                                </div>
                                              </div>
                                            </div>
                                          </MenuItem>
                                        );
                                      })}
                                    </Select>
                                  </div>

                                  <div className={cssVoteModal.inlinePair}>
                                    <div className={cssVoteModal.doubleImages}>
                                      <img
                                        className={classes.img1Logo}
                                        src={(row && row.token0 && row.token0.logoURI) ? row.token0.logoURI : ``}
                                        width="52"
                                        height="52"
                                        alt=""
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                        }}
                                      />
                                      <img
                                        className={classes.img2Logo}
                                        src={(row && row.token1 && row.token1.logoURI) ? row.token1.logoURI : ``}
                                        width="52"
                                        height="52"
                                        alt=""
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                        }}
                                      />
                                    </div>

                                    <div style={{ marginLeft: 12 }}>
                                      <div className={css.vaultSourceTitle}>
                                        {formatSymbol(row?.symbol)}
                                      </div>
                                      <div className={css.vaultSourceSubtitle}>
                                        {row?.isStable ? 'Stable Pool' : 'Volatile Pool'}
                                      </div>
                                    </div>
                                  </div>

                                  <div className={cssVoteModal.voteTooltipSlider}>
                                    <div className={cssVoteModal.voteTooltipSliderValues}>
                                      <span style={{width: 36,}}>-100</span>
                                      {/* <span>0</span> */}
                                      <span style={{width: 36,}}>100</span>
                                    </div>
                                    <CustomSlider
                                      appTheme={appTheme}
                                      valueLabelDisplay="on"
                                      value={sliderValue}
                                      onChange={(event, value) => {
                                        onSliderChange(event, value, row);
                                      }}
                                      min={-100}
                                      max={100}
                                      marks
                                      step={1}
                                      disabled={noTokenSelected}
                                    />
                                  </div>

                                  <div className={cssVoteModal.yourVoteTitle}>Your Vote</div>
                                  <div className={cssVoteModal.yourVoteText}>Move slider or edit your vote % in the input below</div>

                                  <div className={cssVoteModal.voteTooltipVoteBlock}>
                                    <InputBase
                                      value={sliderValue}
                                      onChange={(event, value) => {
                                        onSliderChange(event, event.target.value, row);
                                      }}
                                      inputProps={{
                                        className: cssVoteModal.voteTooltipVoteBlockInput,
                                      }}
                                      InputProps={{
                                        disableUnderline: true,
                                      }}
                                    />
                                    <div className={cssVoteModal.voteTooltipVoteBlockInputAddornment}>%</div>
                                  </div>

                                  <div className={cssVoteModal.voteTooltipButton}>
                                    Cast Vote
                                  </div>
                                </div>
                              </div>
                              </Dialog>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
            </TableContainer>
          </div>

          <TablePagination className={'g-flex-column__item-fixed'}
            style={{
              width: '100%',
              padding: '0 20px',
              borderRadius: 20,
              background: '#131313',
              color: '#8191B9',
            }}
            labelRowsPerPage={window.innerWidth < 550 ? '' : 'Rows per page:'}
            rowsPerPageOptions={window.innerWidth < 435 ? [] : [5, 10, 25]}
            component="div"
            count={gauges.length}
            rowsPerPage={rowsPerPage}
            page={page}
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

      <div className={classes.sortSelect} style={{display: windowWidth < 806 ? 'flex' : 'none'}}>
        {SortSelect({value: sortValueId, options, handleChange: handleChangeSort, sortDirection})}
      </div>

      {windowWidth < 806 && (
        <>
          <div style={{ overflow: 'auto' }}>
            {stableSort(gauges, getComparator(order, orderBy, sliderValues))
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                if (!row) {
                  return null;
                }
                const labelId = `accordion-${index}`;

                let sliderValue = sliderValues.find((el) => el.address === row?.address)?.value;
                if (sliderValue) {
                  sliderValue = BigNumber(sliderValue).toNumber(0);
                } else {
                  sliderValue = 0;
                }

                return (
                  <>
                    <Dialog
                      open={voteDialogOpen === row.address}
                      PaperProps={{ style: { width: "100%", maxWidth: 520, background: 'transpaarent', borderRadius: 20 } }}
                      onClose={closeModal}
                      onClick={(e) => {
                        if (e.target.classList.contains('MuiDialog-container')) {
                          closeModal()
                        }
                      }}
                      // fullWidth={false}
                      // fullScreen={false}
                      // BackdropProps={{style: {backgroundColor: 'transparent'}}}
                      // classes={{
                      //   paper: classes.dialogPaper,
                      //   scrollPaper: classes.dialogBody,
                      // }}
                    >
                      <div>
                        <div className={cssVoteModal.voteTooltipHeader}>
                          <span className={cssVoteModal.voteTooltipTitle}>Vote for the Pool</span>
                          <span className={cssVoteModal.voteTooltipClose} onClick={closeModal} />
                        </div>

                        <div className={cssVoteModal.voteTooltipBody}>
                          <div className={classes.tokenSelect}>
                            <Select
                              open={openSelectToken === row.address}
                              onClick={() => {toggleSelect(row)}}
                              className={[
                                cssTokenSelect.tokenSelect,
                                openSelectToken ? cssTokenSelect.tokenSelectOpen : '',
                                token ? cssTokenSelect.tokenSelectSelected : '',
                              ].join(' ')}
                              classes={{
                                select: cssTokenSelect.selectWrapper,
                              }}
                              fullWidth
                              MenuProps={{
                                classes: {
                                  list: appTheme === 'dark' ? cssTokenSelect['list--dark'] : cssTokenSelect.list,
                                  paper: cssTokenSelect.listPaper,
                                },
                              }}
                              value={token}
                              {...{
                                displayEmpty: token === null ? true : undefined,
                                renderValue: token === null ? (selected) => {
                                  if (selected === null) {
                                    return (
                                      <div className={cssTokenSelect.placeholder}>
                                        Select veCONE NFT
                                      </div>
                                    );
                                  }
                                } : undefined,
                              }}
                              onChange={handleChangeNFT}
                              IconComponent={arrowIcon}
                              inputProps={{
                                className: appTheme === 'dark' ? cssTokenSelect['tokenSelectInput--dark'] : cssTokenSelect.tokenSelectInput,
                              }}>
                              {(!vestNFTs || !vestNFTs.length) &&
                                <div className={cssTokenSelect.noNFT}>
                                  <div className={cssTokenSelect.noNFTtext}>
                                    You receive NFT by creating a Lock of your CONE for some time, the more CONE you lock and for
                                    the longest time, the more Voting Power your NFT will have.
                                  </div>
                                  <div className={cssTokenSelect.noNFTlinks}>
                                    <span
                                      className={cssTokenSelect.noNFTlinkButton}
                                      onClick={() => {
                                        router.push("/swap")
                                      }}
                                    >
                                      BUY CONE
                                    </span>
                                    <span
                                      className={cssTokenSelect.noNFTlinkButton}
                                      onClick={() => {
                                        router.push("/vest")
                                      }}
                                    >
                                      LOCK CONE FOR NFT
                                    </span>
                                  </div>
                                </div>
                              }
                              {vestNFTs?.map((option) => {
                                return (
                                  <MenuItem key={option.id} value={option}>
                                    <div className={[cssTokenSelect.menuOption, 'g-flex', 'g-flex--align-center', 'g-flex--space-between'].join(' ')}>
                                      <div>#{option.id}</div>
                                      <div className={[cssTokenSelect.menuOptionSec, 'g-flex-column'].join(' ')}>
                                        <div>
                                          {formatCurrency(option.lockValue)}
                                          {veToken?.symbol ? ' ' + veToken.symbol : ''}
                                        </div>
                                      </div>
                                    </div>
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          </div>

                          <div className={cssVoteModal.inlinePair}>
                            <div className={cssVoteModal.doubleImages}>
                              <img
                                className={classes.img1Logo}
                                src={(row && row.token0 && row.token0.logoURI) ? row.token0.logoURI : ``}
                                width="52"
                                height="52"
                                alt=""
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                }}
                              />
                              <img
                                className={classes.img2Logo}
                                src={(row && row.token1 && row.token1.logoURI) ? row.token1.logoURI : ``}
                                width="52"
                                height="52"
                                alt=""
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                }}
                              />
                            </div>

                            <div style={{ marginLeft: 12 }}>
                              <div className={css.vaultSourceTitle}>
                                {formatSymbol(row?.symbol)}
                              </div>
                              <div className={css.vaultSourceSubtitle}>
                                {row?.isStable ? 'Stable Pool' : 'Volatile Pool'}
                              </div>
                            </div>
                          </div>

                          <div className={cssVoteModal.voteTooltipSlider}>
                            <div className={cssVoteModal.voteTooltipSliderValues}>
                              <span style={{width: 36,}}>-100</span>
                              {/* <span>0</span> */}
                              <span style={{width: 36,}}>100</span>
                            </div>
                            <CustomSlider
                              appTheme={appTheme}
                              valueLabelDisplay="on"
                              value={sliderValue}
                              onChange={(event, value) => {
                                onSliderChange(event, value, row);
                              }}
                              min={-100}
                              max={100}
                              marks
                              step={1}
                              disabled={noTokenSelected}
                            />
                        </div>

                        <div className={cssVoteModal.yourVoteTitle}>Your Vote</div>
                        <div className={cssVoteModal.yourVoteText}>Move slider or edit your vote % in the input below</div>

                        <div className={cssVoteModal.voteTooltipVoteBlock}>
                          <InputBase
                            value={sliderValue}
                            onChange={(event, value) => {
                              onSliderChange(event, event.target.value, row);
                            }}
                            inputProps={{
                              className: cssVoteModal.voteTooltipVoteBlockInput,
                            }}
                            InputProps={{
                              disableUnderline: true,
                            }}
                          />
                          <div className={cssVoteModal.voteTooltipVoteBlockInputAddornment}>%</div>
                        </div>

                        <div className={cssVoteModal.voteTooltipButton}>
                          Cast Vote
                        </div>
                      </div>

                       {/* <Button
                          variant="outlined"
                          color="primary"
                          style={{
                            width: 199,
                            height: 50,
                            marginTop: 20,
                            backgroundImage: 'url("/images/ui/btn-simple.svg")',
                            border: 'none',
                            borderRadius: 0,
                            fontWeight: 700,
                            fontSize: 16,
                            color: appTheme === 'dark' ? '#7F828B' : '#8F5AE8',
                          }}
                          onClick={closeModal}>
                          Save & Close
                        </Button>*/}
                      </div>
                    </Dialog>

                    <div
                      key={labelId}
                      style={{
                        margin: 0,
                        marginBottom: 12,
                        paddingBottom: 12,
                        background: '#131313',
                        borderRadius: 16,
                      }}
                    >
                      <div className={['g-flex-column', 'g-flex-column__item'].join(' ')}>
                        <div
                          style={{ justifyContent: 'space-between' }}
                          className={[classes.cellHeadPaddings, 'g-flex', 'g-flex--align-center'].join(' ')}
                        >
                          <div className={classes.inline}>
                            <div className={classes.doubleImages}>
                              <img
                                className={classes.img1Logo}
                                src={(row && row.token0 && row.token0.logoURI) ? row.token0.logoURI : ``}
                                width="36"
                                height="36"
                                alt=""
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                }}
                              />
                              <img
                                className={classes.img2Logo}
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

                            <div style={{ marginLeft: 12 }}>
                              <div className={css.vaultSourceTitle}>{row?.symbol}</div>
                              <div className={css.vaultSourceSubtitle}>
                                {row?.isStable ? 'Stable Pool' : 'Volatile Pool'}
                              </div>
                            </div>
                          </div>

                          <Button
                            variant="outlined"
                            color="primary"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              width: 69,
                              height: 36,
                              padding: "8px 16px",
                              fontSize: 14,
                              lineHeight: 20,
                              fontWeight: 500,
                              borderRadius: 8,
                              border: "1px solid #7DB857",
                              background: "rgba(125, 184, 87, 0.12)",
                              color: "#7DB857",
                            }}
                            onClick={(event) => {
                              event.stopPropagation();
                              event.preventDefault();

                              openVoteDialog(row);
                            }}
                          >
                            Vote
                          </Button>        
                        </div>

                        <div className={css.mobileItem}>
                          <div className={css.mobileItemTable}>
                            <div className={css.mobileItemRow}>
                              <div className={css.mobileItemCell}>TVL</div>
                              <div className={css.mobileItemCell}>
                                {tableCellContent(
                                  `${(numeral(BigNumber(row?.tvl).toLocaleString()).format('($ 0a)'))}`,
                                  null,
                                  null,
                                  null,
                                )}
                              </div>
                            </div>
                            <div className={css.mobileItemRow}>
                              <div className={css.mobileItemCell}>APR %</div>
                              <div className={css.mobileItemCell}>
                                {tableCellContent(
                                  `${formatCurrency(BigNumber(row?.gauge?.derivedAPR), 0)}%`,
                                  `${formatCurrency(BigNumber(row?.gauge?.expectAPRDerived), 0)}%`,
                                  'Current',
                                  'Next week'
                                )}
                              </div>
                            </div>
                            {(expanded === labelId) && (
                              headCells.map((headCell) => (
                                <>
                                  {!headCell.isHideInDetails &&
                                    <div className={css.mobileItemRow}>
                                      <div className={css.mobileItemCell}>
                                        {headCell.label}
                                      </div>

                                      <div className={css.mobileItemCell}>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                        <div className={css.itemTitle} style={{ marginBottom: 4 }}>
                                          {headCell.id === 'tvl' && `${(numeral(BigNumber(row?.tvl).toLocaleString()).format('($ 0a)'))} `}
                                          {headCell.id === 'apr' && `${formatCurrency(row?.gauge?.derivedAPR, 0)}%`}
                                          {headCell.id === 'balance' && formatCurrency(BigNumber(row?.gauge?.balance).div(row?.gauge?.totalSupply).times(row?.gauge?.reserve0))}
                                          {headCell.id === 'liquidity' && formatCurrency(BigNumber(row?.reserve0))}
                                          {headCell.id === 'apy' && row?.gaugebribes.bribeTokens.length ? (
                                            row?.gaugebribes.bribeTokens
                                              .filter(x => !BigNumber(x?.left).isZero())
                                              .map((bribe, idx) => {
                                                return (
                                                  <div className={['g-flex-column', 'g-flex--align-end'].join(' ')}>
                                                    {`${Number(bribe.apr).toFixed(1)}% APR`}
                                                  </div>
                                                );
                                              })
                                          ) : null}
                                          {headCell.id === 'myVotes' && formatCurrency(BigNumber(sliderValue).div(100).times(token?.lockValue))}
                                        </div>

                                        <div className={css.itemTitle}>
                                          {headCell.id === 'balance' && formatCurrency(BigNumber(row?.gauge?.balance).div(row?.gauge?.totalSupply).times(row?.gauge?.reserve1))}
                                          {headCell.id === 'liquidity' && formatCurrency(BigNumber(row?.reserve1))}
                                          {headCell.id === 'apy' && ''}
                                          {headCell.id === 'myVotes' && `${formatCurrency(sliderValue)} %`}
                                        </div>
                                        </div>

                                        <div style={{ paddingLeft: 8, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                        <div className={css.itemText} style={{ marginBottom: 4 }}>
                                          {headCell.id === 'balance' && formatSymbol(row.token0.symbol)}
                                          {headCell.id === 'liquidity' && formatSymbol(row.token0.symbol)}
                                          {headCell.id === 'apy' && row?.gaugebribes.bribeTokens.length ? (
                                            row?.gaugebribes.bribeTokens
                                              .filter(x => !BigNumber(x?.left).isZero())
                                              .map((bribe, idx) => {
                                                return (
                                                  <div className={['g-flex-column', 'g-flex--align-end'].join(' ')}>
                                                    {formatSymbol(bribe.token.symbol)}
                                                  </div>
                                                );
                                              })
                                          ) : null}
                                          {headCell.id === 'myVotes' && formatSymbol(row.token0.symbol)}
                                        </div>

                                        <div className={css.itemText}>
                                          {headCell.id === 'balance' && formatSymbol(row.token1.symbol)}
                                          {headCell.id === 'liquidity' && formatSymbol(row.token1.symbol)}
                                          {headCell.id === 'apy' && ''}
                                          {headCell.id === 'myVotes' && formatSymbol(row.token1.symbol)}
                                        </div>
                                        </div>
                                      </div>
                                    </div>
                                  }
                                </>
                              ))
                            )}
                          </div>

                          <div
                            className={css.mobileItemHiddenContentToggle}
                            onClick={(e) => {
                              console.log('test')
                              handleChangeAccordion(e, labelId)
                            }
                          }>
                            <div
                              style={{
                                fontFamily: 'PT Root UI',
                                fontWeight: 700,
                                fontSize: 16,
                                lineHeight: '100%',
                                color: '#EAE8E1',
                              }}
                              noWrap
                            >
                              {expanded !== labelId ? 'Show' : 'Hide'} more details
                            </div>

                            {expanded !== labelId &&
                              <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M0.979238 5.27094C2.36454 3.19808 5.26851 0 9.99995 0C14.7314 0 17.6354 3.19808 19.0207 5.27094C19.4855 5.96655 19.718 6.31435 19.6968 6.95691C19.6757 7.59948 19.4088 7.94688 18.8752 8.64168C17.2861 10.7107 14.1129 14 9.99995 14C5.88699 14 2.71384 10.7107 1.12471 8.64168C0.591062 7.94688 0.324239 7.59948 0.303083 6.95691C0.281927 6.31435 0.514364 5.96655 0.979238 5.27094ZM9.99995 11C12.2091 11 13.9999 9.20914 13.9999 7C13.9999 4.79086 12.2091 3 9.99995 3C7.79081 3 5.99995 4.79086 5.99995 7C5.99995 9.20914 7.79081 11 9.99995 11Z" fill="#7DB857"/>
                              </svg>                        
                            }

                            {expanded === labelId &&
                              <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M0.979238 5.27094C2.36454 3.19808 5.26851 0 9.99995 0C14.7314 0 17.6354 3.19808 19.0207 5.27094C19.4855 5.96655 19.718 6.31435 19.6968 6.95691C19.6757 7.59948 19.4088 7.94688 18.8752 8.64168C17.2861 10.7107 14.1129 14 9.99995 14C5.88699 14 2.71384 10.7107 1.12471 8.64168C0.591062 7.94688 0.324239 7.59948 0.303083 6.95691C0.281927 6.31435 0.514364 5.96655 0.979238 5.27094ZM9.99995 11C12.2091 11 13.9999 9.20914 13.9999 7C13.9999 4.79086 12.2091 3 9.99995 3C7.79081 3 5.99995 4.79086 5.99995 7C5.99995 9.20914 7.79081 11 9.99995 11Z" fill="#7DB857"/>
                              </svg>
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })
            }
          </div>

          <TablePagination
            className={'g-flex-column__item-fixed'}
            style={{
              width: "100%",
              padding: "0 20px",
              borderRadius: 20,
              background: '#131313',
              color: '#8191B9',
            }}
            ActionsComponent={TablePaginationActions}
            rowsPerPageOptions={window.innerWidth < 435 ? [] : [5, 10, 25]}
            component="div"
            count={gauges.length}
            rowsPerPage={rowsPerPage}
            page={page}
            labelRowsPerPage={window.innerWidth < 550 ? null : 'Rows per page:'}
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
  );
}
