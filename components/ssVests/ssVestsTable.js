import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles, styled } from '@mui/styles';
import {
  Paper,
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
  Toolbar,
  Skeleton, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import { useRouter } from "next/router";
import {
  ArrowDropDown, ExpandLess, ExpandMore,
  LockOutlined,
} from '@mui/icons-material';
import moment from 'moment';
import { formatCurrency } from '../../utils';
import { useAppThemeContext } from '../../ui/AppThemeProvider';
import TablePaginationActions from '../table-pagination/table-pagination';
import SortSelect from '../select-sort/select-sort';
import BigNumber from 'bignumber.js';
import css from './ssVests.module.css'

function descendingComparator(a, b, orderBy) {
  if (!a || !b) {
    return 0;
  }

  switch (orderBy) {
    case 'NFT':
      return Number(a.id) - Number(b.id);

    case 'Locked Amount':
      let amountA = BigNumber(a?.lockAmount).toNumber();
      let amountB = BigNumber(b?.lockAmount).toNumber();

      if (BigNumber(amountB).lt(amountA)) {
        return -1;
      }
      if (BigNumber(amountB).gt(amountA)) {
        return 1;
      }
      return 0;

    case 'Lock Value':
      let valueA = BigNumber(a?.lockValue).toNumber();
      let valueB = BigNumber(b?.lockValue).toNumber();

      if (BigNumber(valueB).lt(valueA)) {
        return -1;
      }
      if (BigNumber(valueB).gt(valueA)) {
        return 1;
      }
      return 0;

    case 'Lock Expires':
      let expiresA = a?.lockEnds;
      let expiresB = b?.lockEnds;

      if (expiresA < expiresB) {
        return -1;
      }
      if (expiresB < expiresA) {
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
    id: 'NFT',
    numeric: false,
    disablePadding: false,
    label: 'Locked NFT',
    isSticky: true,
    isHideInDetails: true,
  },
  {
    id: 'Locked Amount',
    numeric: true,
    disablePadding: false,
    label: 'Vest Amount',
  },
  {
    id: 'Lock Value',
    numeric: true,
    disablePadding: false,
    label: 'Voting Power',
  },
  {
    id: 'Lock Expires',
    numeric: true,
    disablePadding: false,
    label: 'Vest Expires',
    isHideInDetails: false,
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
                appTheme={appTheme}
                key={headCell.id}
                align={headCell.numeric ? 'right' : 'left'}
                padding={'normal'}
                sortDirection={orderBy === headCell.id ? order : false}
                className={css.headCell}
                style={{ zIndex: 10 }}
              >
                <TableSortLabel
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : 'asc'}
                  onClick={createSortHandler(headCell.id)}
                  IconComponent={() => orderBy === headCell.id ? sortIcon(order) : null}
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
                  <div className={css.headerText}>{headCell.label}</div>
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

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  assetTableRow: {
    '&:hover': {
      background: 'rgba(104,108,122,0.05)',
    },
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
  icon: {
    marginRight: '12px',
  },
  textSpaced: {
    lineHeight: '1.5',
    fontWeight: '200',
    fontSize: '12px',
  },
  inlineEnd: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  headerText: {
    fontWeight: '500 !important',
    fontSize: '14px !important',
    lineHeight: '100% !important',
    color: '#8191B9 !important',
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
  img1Logo: {
    borderRadius: '30px',
  },
  img2Logo: {
    zIndex: '1',
  },
  overrideTableHead: {
    borderBottom: '1px solid rgba(104,108,122,0.2) !important',
  },
  doubleImages: {
    display: 'flex',
    position: 'relative',
    marginRight: 12,
  },
  buttonOverride: {
    color: 'rgb(6, 211, 215)',
    background: 'rgb(23, 52, 72)',
    fontWeight: '700',
    width: '100%',
    '&:hover': {
      background: 'rgb(19, 44, 60)',
    },
  },
  table: {
    tableLayout: 'auto',
  },
  accordionSummaryContent: {
    margin: 0,
    padding: 0,
  },
  sortSelect: {},
  cellPaddings: {
    padding: '11px 20px',
  },
  cellHeadSmallPaddings: {
    padding: '8px 16px',
  },
  cellHeadPaddings: {
    padding: '12px',
  },
}));

const EnhancedTableToolbar = (props) => {
  const classes = useStyles();
  const router = useRouter();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [search, setSearch] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  const options = [
    {id: 'Locked Amount--desc', labelPart1: 'Vest Amount', labelPart2: 'high to low'},
    {id: 'Locked Amount--asc', labelPart1: 'Vest Amount', labelPart2: 'low to high'},
    {id: 'Lock Value--desc', labelPart1: 'Vest Value', labelPart2: 'high to low'},
    {id: 'Lock Value--asc', labelPart1: 'Vest Value', labelPart2: 'low to high'},
    {id: 'Lock Expires--desc', labelPart1: 'Vest Expires', labelPart2: 'high to low'},
    {id: 'Lock Expires--asc', labelPart1: 'Vest Expires', labelPart2: 'low to high'},
  ];

  const [sortValueId, setSortValueId] = useState('Locked Amount--desc');

  const onSearchChanged = (event) => {
    setSearch(event.target.value);
  };

  const onCreate = () => {
    router.push('/vest/create');
  };

  const onMerge = () => {
    router.push('/vest/merge');
  };

  const handleChangeSort = ({target: {value}}) => {
    const property = value.substring(0, value.indexOf('--'));
    const event = value.substring(value.indexOf('--') + 2);

    setSortValueId(value);
    setSortDirection(event);

    props.handleRequestSort(event, property);
  };

  const handleResize = () => {
    setWindowWidth(window.innerWidth);
  }

  window.addEventListener('resize', handleResize);

  return (
    <div>
      <div className={css.toolbarContainer}>
        <div className={css.toolbarContainerRow}>
          <div className={css.pageTitle}>Vest</div>
          {windowWidth <= 660 && (
            <div className={css.sortSelect}>
              {SortSelect({value: sortValueId, options, handleChange: handleChangeSort, sortDirection})}
            </div>
          )}

          <div className={css.mergeButton} onClick={onMerge}>
            MERGE MY LOCKED NFTs
          </div>

          <div className={css.addButton} onClick={onCreate}>
            <div className={css.actionButtonText}>Create Lock</div>
          </div>
        </div>

        <div className={[css.controls, 'g-flex', 'g-flex--align-baseline'].join(' ')}>
          <div className={css.toolbarInfoContainer}>
            <div className={css.toolbarInfo}>
              Lock NF to get voting power, staking rewards, and Boost on your LP rewards.
            </div>
          </div>

          <div className={css.aprButton}>
            <span>{parseInt(props.veToken?.veDistApr)}%</span>
            <span>veNF Rewards APR</span>
          </div>

          <div
            className={[css.addButtonMobile, 'g-flex', 'g-flex--align-center', 'g-flex--justify-center'].join(' ')}
            onClick={onCreate}
          >
            <Typography
              className={[css.actionButtonText, 'g-flex', 'g-flex--align-center', 'g-flex--justify-center'].join(' ')}
            >
              Create Lock
            </Typography>
          </div>

          <div className={css.mergeButtonMobile} onClick={onMerge}>
            MERGE MY LOCKED NFTs
          </div>
        </div>
      </div>
    </div>
  );
};

export default function EnhancedTable({vestNFTs, govToken, veToken, loading}) {
  const classes = useStyles();
  const router = useRouter();

  const [order, setOrder] = React.useState('desc');
  const [orderBy, setOrderBy] = React.useState('Locked Amount');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [tableHeight, setTableHeight] = useState((window.innerHeight - 50 - 64 - 30 - 60 - 54 - 20 - 30) - (windowWidth < 1280 ? 50 : 0));
  const [sortDirection, setSortDirection] = useState('asc');
  const [expanded, setExpanded] = useState('');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  if (!vestNFTs) {
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

  const onView = (nft) => {
    router.push(`/vest/${nft.id}`);
  };

  const {appTheme} = useAppThemeContext();

  window.addEventListener('resize', () => {
    setWindowWidth(window.innerWidth);
    setTableHeight((window.innerHeight - 50 - 64 - 30 - 60 - 54 - 20 - 30) - (windowWidth < 1280 ? 50 : 0));
  });

  const handleChangeAccordion = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  const isEmptyTable = vestNFTs.length === 0

  return (
    <div>
      <EnhancedTableToolbar
        handleRequestSort={handleRequestSort}
        setSortDirection={setSortDirection}
        veToken={veToken}
      />

      {windowWidth > 660 &&
        <div>
          {isEmptyTable && loading && (
            <div className={css.tvLoading}>
              <img src="/images/tv-loading.png" className={css.tvImage} />
              <p className={css.tvText}>Loading your Lock from the blockchain, please wait</p>
            </div>
          )}
          {!loading && isEmptyTable && (
            <div className={css.tvNotData}>
              <img src="/images/tv-sad.png" className={css.tvImage} />
              <p className={css.tvText}>You have not created any Lock yet</p>
            </div>
          )}

          {isEmptyTable ? null : (
          <>
          <div className={css.tableWrapper}>
            <TableContainer
              className={['g-flex-column__item', css.tableContainer].join(" ")}
              // style={{ maxHeight: isEmptyTable ? 'auto' : tableHeight }}
            >
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

                {/* {isEmptyTable ? null : ( */}
                  <TableBody>
                    {stableSort(vestNFTs, getComparator(order, orderBy))
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row, index) => {
                        if (!row) {
                          return null;
                        }
                        const labelId = `enhanced-table-checkbox-${index}`;

                        return (
                          <TableRow
                            key={labelId}
                            className={css.row}
                          >
                            <StickyTableCell className={css.cell}>
                              <div className={classes.inline}>
                                <div className={classes.doubleImages}>
                                  <img
                                    className={classes.img1Logo}
                                    src={govToken?.logoURI}
                                    width="36"
                                    height="36"
                                    alt=""
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                    }}
                                  />
                                </div>
                                <div>
                                  <div className={css.vaultSourceTitle}>
                                    {row.id}
                                  </div>
                                  <div className={css.vaultSourceSubtitle}>
                                    NFT ID
                                  </div>
                                </div>
                              </div>
                            </StickyTableCell>

                            <TableCell className={css.cell}>
                              <div className={css.cellContentInRow}>
                                <div className={css.itemTitle}>
                                  {formatCurrency(row.lockAmount)}
                                </div>

                                <div className={css.itemText}>
                                  {govToken?.symbol}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className={css.cell}>
                              <div className={css.cellContentInRow}>
                                <div className={css.itemTitle}>
                                  {formatCurrency(row.lockValue)}
                                </div>

                                <div className={css.itemText}>
                                  {veToken?.symbol}
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className={css.cell}>
                              <div style={{ display: 'flex', justifyContent: 'center'}}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', width: 200, maxWidth: '100%' }}>
                                  <div className={css.itemTitle}>
                                    {moment.unix(row.lockEnds).format('YYYY-MM-DD')}
                                  </div>

                                  <div className={css.itemTitle}>
                                    {(BigNumber(row.lockEnds).lt(moment().unix()) &&
                                      BigNumber(row.lockEnds).gt(0)) && (
                                        <img src="/images/ui/info-circle-yellow.svg" width="18px" style={{ marginRight: 10 }} />
                                      )}
                                    {(BigNumber(row.lockEnds).lt(moment().unix()) &&
                                      BigNumber(row.lockEnds).gt(0))
                                        ? `Expired ${moment.unix(row.lockEnds).fromNow()}`
                                        : `Expires ${moment.unix(row.lockEnds).fromNow()}`
                                    }
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className={css.cell}>
                              <Button
                                variant="outlined"
                                color="primary"
                                className={css.action}
                                onClick={() => {
                                  onView(row);
                                }}
                              >
                                {(BigNumber(row.lockEnds).lt(moment().unix()) &&
                                  BigNumber(row.lockEnds).gt(0))
                                    ? 'WITHDRAW'
                                    : 'EDIT'
                                }
                                {/* Manage */}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                {/* )} */}
              </Table>
              {/* {isEmptyTable && emptyMessage} */}
            </TableContainer>
          </div>

          <TablePagination className={"g-flex-column__item-fixed"}
            style={{
              width: "100%",
              padding: "0 20px",
              borderRadius: 20,
              background: '#131313',
              color: '#8191B9',
            }}
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={vestNFTs.length}
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
        </div>
      }

      {windowWidth <= 660 && (
        <>
          {/* {isEmptyTable && emptyMessageMobile} */}

          {isEmptyTable && loading && (
            <div className={css.tvLoading}>
              <img src="/images/tv-loading.png" className={css.tvImage} />
              <p className={css.tvText}>Loading your Lock from the blockchain, please wait</p>
            </div>
          )}
          {!loading && isEmptyTable && (
            <div className={css.tvNotData}>
              <img src="/images/tv-sad.png" className={css.tvImage} />
              <p className={css.tvText}>You have not created any Lock yet</p>
            </div>
          )}

         {!isEmptyTable && (
          <>
          <div style={{ overflow: 'auto' }}>
            {stableSort(vestNFTs, getComparator(order, orderBy))
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => {
                if (!row) {
                  return null;
                }
                const labelId = `accordion-${index}`;

                return (
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
                    <div>
                      <div>
                        <div
                          className={[classes.cellHeadPaddings, 'g-flex', 'g-flex--align-center'].join(' ')}
                          style={{ justifyContent: 'space-between' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div className={classes.doubleImages}>
                              <img
                                  className={classes.img1Logo}
                                  src={govToken?.logoURI}
                                  width="36"
                                  height="36"
                                  alt=""
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                  }}
                              />
                            </div>

                            <div>
                              <div className={css.vaultSourceTitle}>{row.id}</div>
                              <div className={css.vaultSourceSubtitle}>NFT ID</div>
                            </div>
                          </div>

                          <Button
                            variant="outlined"
                            color="primary"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              width: 79,
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

                              onView(row);
                            }}
                          >
                            {(BigNumber(row.lockEnds).lt(moment().unix()) &&
                                  BigNumber(row.lockEnds).gt(0))
                                    ? 'Withdraw'
                                    : 'Edit'
                                }
                          </Button>
                        </div>

                        <div className={css.mobileItem}>
                          <div className={css.mobileItemTable}>
                            {headCells.map((headCell) => (
                              !headCell.isHideInDetails && (
                                <div className={css.mobileItemRow}>
                                  <div className={css.mobileItemCell}>
                                    {headCell.label}
                                  </div>

                                  <div className={css.mobileItemCell}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                      <div className={css.itemTitle} style={{ marginBottom: 4 }}>
                                        {headCell.id === 'Locked Amount' && formatCurrency(row.lockAmount)}
                                        {headCell.id === 'Lock Value' && formatCurrency(row.lockValue)}
                                      </div>
                                      <div className={css.itemTitle} style={{ marginBottom: 4 }}>
                                      </div>
                                    </div>

                                    {headCell.id === 'Lock Expires' ? (
                                      <div className={[classes.cellHeadPaddings, 'g-flex'].join(' ')}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
                                          <div className={css.itemTitle} style={{ marginBottom: 4 }}>
                                            {moment.unix(row.lockEnds).format('YYYY-MM-DD')}
                                          </div>
              
                                          <div className={css.itemTitle}>
                                            {`Expires ${moment.unix(row.lockEnds).fromNow()}`}
                                          </div>
                                        </div>

                                        <div style={{ paddingLeft: 8, display: 'flelx', flexDirection: 'column', alignItems: 'flex-end' }}>
                                          <div className={css.itemText} style={{ marginBottom: 4 }}>current</div>
                                          <div className={css.itemText}>next</div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div style={{ paddingLeft: 8, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                        <div className={css.itemText} style={{ marginBottom: 4 }}>
                                          {headCell.id === 'Locked Amount' && govToken?.symbol}
                                          {headCell.id === 'Lock Value' && veToken?.symbol}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>

          
            <TablePagination
              className={['g-flex-column__item-fixed', css.pagination].join(" ")}
              style={{
                width: "100%",
                padding: "0 20px",
                borderRadius: 20,
                background: '#131313',
                color: '#8191B9',
              }}
              component="div"
              count={vestNFTs.length}
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
      )}
    </div>
  );
}
