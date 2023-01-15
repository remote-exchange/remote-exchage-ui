import React, { useState } from "react";
import PropTypes from "prop-types";
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
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { makeStyles, styled, useTheme } from "@mui/styles";
import { useRouter } from "next/router";
import BigNumber from "bignumber.js";
import { formatCurrency } from "../../utils";
import stores from "../../stores";
import { ACTIONS } from "../../stores/constants";
import { useAppThemeContext } from "../../ui/AppThemeProvider";
import { ArrowDropDown, ExpandLess, ExpandMore } from "@mui/icons-material";
import TablePaginationActions from "../table-pagination/table-pagination";
import { formatSymbol } from "../../utils";
import css from './ssRewardsTable.module.css';
import {descendingComparator, getComparator, stableSort, headCells} from "./reward-ui-utils";

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

const StickyTableCell = styled(TableCell)(({ theme, appTheme }) => ({
  color: appTheme === "dark" ? "#C6CDD2 !important" : "#325569 !important",
  width: 310,
  left: 0,
  position: "sticky",
  // zIndex: 5,
  whiteSpace: "nowrap",
  padding: "15px 24px 16px",
}));

const StyledTableCell = styled(TableCell)(({ theme, appTheme }) => ({
  background: appTheme === "dark" ? "#24292D" : "#CFE5F2",
  width: "auto",
  whiteSpace: "nowrap",
  padding: "15px 24px 16px",
}));

function EnhancedTableHead(props) {
  const { classes, order, orderBy, onRequestSort } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  const { appTheme } = useAppThemeContext();

  return (
    <TableHead>
      <TableRow style={{ whiteSpace: "nowrap" }}>
        {headCells.map((headCell) => (
          <>
            {headCell.isSticky ? (
              <StickyTableCell
                appTheme={appTheme}
                key={headCell.id}
                align={headCell.numeric ? "right" : "left"}
                padding={"normal"}
                sortDirection={orderBy === headCell.id ? order : false}
                className={css.headCell}
              >
                <TableSortLabel
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : "asc"}
                  onClick={createSortHandler(headCell.id)}
                  IconComponent={() => orderBy === headCell.id ? sortIcon(order) : null}
                >
                  <div className={css.headerText}>{headCell.label}</div>
                </TableSortLabel>
              </StickyTableCell>
            ) : (
              <StyledTableCell
                className={css.headCell}
                key={headCell.id}
                align={headCell.numeric ? "right" : "left"}
                padding={"normal"}
                sortDirection={orderBy === headCell.id ? order : false}
              >
                <TableSortLabel
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : "asc"}
                  onClick={createSortHandler(headCell.id)}
                  IconComponent={() => orderBy === headCell.id ? sortIcon(order) : null}
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
  order: PropTypes.oneOf(["asc", "desc"]).isRequired,
  orderBy: PropTypes.string.isRequired,
};

const useStyles = makeStyles((theme) => {
  const { appTheme } = useAppThemeContext();

  return {
    root: {
      width: "100%",
    },
    // assetTableRow: {
    //   "&:hover": {
    //     background: "rgba(104,108,122,0.05)",
    //   },
    // },
    paper: {
      width: "100%",
      marginBottom: theme.spacing(2),
    },
    visuallyHidden: {
      border: 0,
      clip: "rect(0 0 0 0)",
      height: 1,
      margin: -1,
      overflow: "hidden",
      padding: 0,
      position: "absolute",
      top: 20,
      width: 1,
    },
    inline: {
      display: "flex",
      alignItems: "center",
    },
    inlineEnd: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
    },
    icon: {
      marginRight: "12px",
    },
    textSpacedPadded: {
      paddingLeft: "10px",
      lineHeight: "1.5",
      fontWeight: "200",
      fontSize: "12px",
    },
    headerText: {
      fontWeight: "200",
      fontSize: "12px",
    },
    cell: {},
    cellSuccess: {
      color: "#4eaf0a",
    },
    cellAddress: {
      cursor: "pointer",
    },
    aligntRight: {
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
    },
    skelly: {
      marginBottom: "12px",
      marginTop: "12px",
    },
    skelly1: {
      marginBottom: "12px",
      marginTop: "24px",
    },
    skelly2: {
      margin: "12px 6px",
    },
    tableBottomSkelly: {
      display: "flex",
      justifyContent: "flex-end",
    },
    assetInfo: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flex: 1,
      padding: "24px",
      width: "100%",
      flexWrap: "wrap",
      borderBottom: "1px solid rgba(104, 108, 122, 0.25)",
      background:
        "radial-gradient(circle, rgba(63,94,251,0.7) 0%, rgba(47,128,237,0.7) 48%) rgba(63,94,251,0.7) 100%",
    },
    assetInfoError: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flex: 1,
      padding: "24px",
      width: "100%",
      flexWrap: "wrap",
      borderBottom: "1px rgba(104, 108, 122, 0.25)",
      background: "#dc3545",
    },
    infoField: {
      flex: 1,
    },
    flexy: {
      padding: "6px 0px",
    },
    overrideCell: {
      padding: "0px",
    },
    hoverRow: {
      cursor: "pointer",
    },
    statusLiquid: {
      color: "#dc3545",
    },
    statusWarning: {
      color: "#FF9029",
    },
    statusSafe: {
      color: "green",
    },
    imgLogo: {
      marginRight: 10,
      border: "2px solid #DBE6EC",
      background: "#13B5EC",
      borderRadius: "30px",
    },
    img1Logo: {
      position: "absolute",
      left: "0px",
      top: "0px",
      borderRadius: "30px",
    },
    img2Logo: {
      position: "absolute",
      left: "28px",
      zIndex: "1",
      top: "0px",
      borderRadius: "30px",
    },
    overrideTableHead: {
      borderBottom: "1px solid rgba(126,153,176,0.15) !important",
    },
    doubleImages: {
      display: "flex",
      position: "relative",
      width: "74px",
      height: "40px",
    },
    searchContainer: {
      flex: 1,
      minWidth: "300px",
      marginRight: "30px",
    },
    buttonOverride: {
      color: "rgb(6, 211, 215)",
      background: "rgb(23, 52, 72)",
      fontWeight: "700",
      "&:hover": {
        background: "rgb(19, 44, 60)",
      },
    },
    toolbar: {
      margin: "24px 0px",
      padding: "0px",
      minHeight: "auto",
    },
    tableContainer: {
      border: "1px solid rgba(126,153,176,0.2)",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
    },
    filterButton: {
      background: "#111729",
      border: "1px solid rgba(126,153,176,0.3)",
      color: "#06D3D7",
      marginRight: "30px",
    },
    actionButtonText: {
      fontSize: "15px",
      fontWeight: "700",
    },
    filterContainer: {
      background: "#212b48",
      minWidth: "300px",
      marginTop: "15px",
      borderRadius: "10px",
      padding: "20px",
      boxShadow: "0 10px 20px 0 rgba(0,0,0,0.2)",
      border: "1px solid rgba(126,153,176,0.2)",
    },
    alignContentRight: {
      textAlign: "right",
    },
    labelColumn: {
      display: "flex",
      alignItems: "center",
    },
    filterLabel: {
      fontSize: "14px",
    },
    filterListTitle: {
      marginBottom: "10px",
      paddingBottom: "20px",
      borderBottom: "1px solid rgba(126,153,176,0.2)",
    },
    infoIcon: {
      color: "#06D3D7",
      fontSize: "16px",
      marginLeft: "10px",
    },
    symbol: {
      minWidth: "40px",
    },
    table: {
      tableLayout: "auto",
    },
    sortSelect: {
      position: "absolute",
      top: 60,
    },
    cellPaddings: {
      padding: "11px 20px",
      ["@media (max-width:530px)"]: {
        // eslint-disable-line no-useless-computed-key
        padding: 10,
      },
    },
    cellHeadPaddings: {
      padding: "12px 12px",
    },
  };
});

export default function EnhancedTable({ rewards, vestNFTs, tokenID }) {
  const classes = useStyles();
  const router = useRouter();

  const [order, setOrder] = React.useState("desc");
  const [orderBy, setOrderBy] = React.useState("balance");
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [tableHeight, setTableHeight] = useState(
    window.innerHeight - 50 - 64 - 74 - 60 - 54 - 20 - 30
  );
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [expanded, setExpanded] = useState("");

  const { appTheme } = useAppThemeContext();

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  if (!rewards) {
    return (
      <div className={classes.root}>
        <Skeleton
          variant="rect"
          width={"100%"}
          height={40}
          className={classes.skelly1}
        />
        <Skeleton
          variant="rect"
          width={"100%"}
          height={70}
          className={classes.skelly}
        />
        <Skeleton
          variant="rect"
          width={"100%"}
          height={70}
          className={classes.skelly}
        />
        <Skeleton
          variant="rect"
          width={"100%"}
          height={70}
          className={classes.skelly}
        />
        <Skeleton
          variant="rect"
          width={"100%"}
          height={70}
          className={classes.skelly}
        />
        <Skeleton
          variant="rect"
          width={"100%"}
          height={70}
          className={classes.skelly}
        />
      </div>
    );
  }

  const onClaim = (reward) => {
    if (reward.rewardType === "Bribe") {
      stores.dispatcher.dispatch({
        type: ACTIONS.CLAIM_BRIBE,
        content: { pair: reward, tokenID },
      });
    } else if (reward.rewardType === "Fees") {
      stores.dispatcher.dispatch({
        type: ACTIONS.CLAIM_PAIR_FEES,
        content: { pair: reward, tokenID },
      });
    } else if (reward.rewardType === "Reward") {
      stores.dispatcher.dispatch({
        type: ACTIONS.CLAIM_REWARD,
        content: { pair: reward, tokenID },
      });
    } else if (reward.rewardType === "Distribution") {
      stores.dispatcher.dispatch({
        type: ACTIONS.CLAIM_VE_DIST,
        content: { tokenID },
      });
    }
  };

  function tableCellContent(
    data1,
    data2,
    symbol1,
    symbol2,
    imgSource1,
    imgSource2
  ) {
    return (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div className={css.itemTitle} style={{ marginBottom: 2 }}>
            {data1}
          </div>

          <div className={css.itemTitle}>
            {data2}
          </div>
        </div>

        {(symbol1 || symbol2) && (
          <div style={{ paddingLeft: 8, display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: 'left'}}>
            <div className={`${css.itemText} ${classes.symbol}`} style={{ marginBottom: 2 }}>
              {symbol1}
            </div>

            <div className={`${css.itemText} ${classes.symbol}`}>
              {symbol2}
            </div>
          </div>
        )}
      </div>
    );
  }

  const handleChangeAccordion = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  window.addEventListener("resize", () => {
    setTableHeight(window.innerHeight - 50 - 64 - 74 - 60 - 54 - 20 - 30);
    setWindowWidth(window.innerWidth);
  });

  return (
    <>
      {windowWidth >= 806 && (
        <div>
          <div className={css.wrapper}>
            <TableContainer className={["g-flex-column__item-fixed", css.tableContainer].join(" ")}>
              <Table
                stickyHeader
                className={classes.table}
                aria-labelledby="tableTitle"
                size={"medium"}
                aria-label="enhanced table"
              >
                <EnhancedTableHead
                  classes={classes}
                  order={order}
                  orderBy={orderBy}
                  onRequestSort={handleRequestSort}
                />

                <TableBody>
                  {Array.from(rewards).length > 0
                    ? stableSort(rewards, getComparator(order, orderBy))
                        .slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        )
                        .map((row, index) => {
                          if (!row) {
                            return null;
                          }
                          return (
                            <TableRow
                              key={"ssRewardsTable" + index}
                              className={css.row}
                            >
                              <StickyTableCell className={css.cell}>
                                {["Bribe", "Fees", "Reward"].includes(
                                  row.rewardType
                                ) && (
                                  <div className={classes.inline}>
                                    <div className={classes.doubleImages}>
                                      <img
                                        className={classes.img1Logo}
                                        src={
                                          row && row.token0 && row.token0.logoURI
                                            ? row.token0.logoURI
                                            : ``
                                        }
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
                                        src={
                                          row && row.token1 && row.token1.logoURI
                                            ? row.token1.logoURI
                                            : ``
                                        }
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
                                        {formatSymbol(row?.symbol)}
                                      </div>
                                      <div className={css.vaultSourceSubtitle}>
                                        {row?.rewardType}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {["Distribution"].includes(row.rewardType) && (
                                  <div className={classes.inline}>
                                    <div className={classes.doubleImages}>
                                      <img
                                        className={classes.img1Logo}
                                        src={
                                          row &&
                                          row.lockToken &&
                                          row.lockToken.logoURI
                                            ? row.lockToken.logoURI
                                            : ``
                                        }
                                        width="40"
                                        height="40"
                                        alt=""
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          e.target.src = `/tokens/unknown-logo--${appTheme}.svg`;
                                        }}
                                      />
                                    </div>

                                    <div>
                                      <div className={css.vaultSourceTitle}>
                                        {formatSymbol(row?.lockToken?.symbol)}
                                      </div>
                                      <div className={css.vaultSourceSubtitle}>
                                        {row?.rewardType}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </StickyTableCell>

                              <TableCell className={css.cell} align="right">
                                {row &&
                                  row.rewardType === "Bribe" &&
                                  row.gauge &&
                                  row.gauge.balance &&
                                  row.gauge.totalSupply &&
                                  tableCellContent(
                                    formatCurrency(
                                      BigNumber(row.gauge.balance)
                                        .div(row.gauge.totalSupply)
                                        .times(row.gauge.reserve0)
                                    ),
                                    formatCurrency(
                                      BigNumber(row.gauge.balance)
                                        .div(row.gauge.totalSupply)
                                        .times(row.gauge.reserve1)
                                    ),
                                    row.token0.symbol,
                                    row.token1.symbol
                                  )}

                                {row &&
                                  row.rewardType === "Fees" &&
                                  row.balance &&
                                  row.totalSupply &&
                                  tableCellContent(
                                    formatCurrency(
                                      BigNumber(row.balance)
                                        .div(row.totalSupply)
                                        .times(row.reserve0)
                                    ),
                                    formatCurrency(
                                      BigNumber(row.balance)
                                        .div(row.totalSupply)
                                        .times(row.reserve1)
                                    ),
                                    row.token0.symbol,
                                    row.token1.symbol
                                  )}

                                {row &&
                                  row.rewardType === "Reward" &&
                                  row.gauge &&
                                  row.gauge.balance &&
                                  row.gauge.totalSupply &&
                                  tableCellContent(
                                    formatCurrency(
                                      BigNumber(row.gauge.balance)
                                        .div(row.gauge.totalSupply)
                                        .times(row.gauge.reserve0)
                                    ),
                                    formatCurrency(
                                      BigNumber(row.gauge.balance)
                                        .div(row.gauge.totalSupply)
                                        .times(row.gauge.reserve1)
                                    ),
                                    row.token0.symbol,
                                    row.token1.symbol
                                  )}

                                {row &&
                                  row.rewardType === "Distribution" &&
                                  tableCellContent(
                                    formatCurrency(row.token?.lockValue),
                                    null,
                                    row.lockToken.symbol,
                                    null
                                  )}
                              </TableCell>

                              <TableCell className={css.cell} align="right">
                                {row &&
                                  row.rewardType === "Bribe" &&
                                  row.gauge &&
                                  row.gauge.bribesEarned &&
                                  row.gauge.bribesEarned.map((bribe) => {
                                    return tableCellContent(
                                      parseFloat(bribe.earned).toFixed(4),
                                      null,
                                      bribe.token?.symbol,
                                      null,
                                      bribe && bribe.token && bribe.token.logoURI
                                        ? bribe.token.logoURI
                                        : `/tokens/unknown-logo--${appTheme}.svg`
                                    );
                                  })}

                                {row &&
                                  row.rewardType === "Fees" &&
                                  tableCellContent(
                                    parseFloat(row.claimable0).toFixed(4),
                                    parseFloat(row.claimable1).toFixed(4),
                                    row.token0?.symbol,
                                    row.token1?.symbol,
                                    row.token0 && row.token0.logoURI
                                      ? row.token0.logoURI
                                      : `/tokens/unknown-logo--${appTheme}.svg`,
                                    row.token1 && row.token1.logoURI
                                      ? row.token1.logoURI
                                      : `/tokens/unknown-logo--${appTheme}.svg`
                                  )}

                                {row &&
                                  row.rewardType === "Reward" &&
                                  row.gauge &&
                                  row.gauge.rewardTokens &&
                                  row.gauge.rewardTokens.map((rt) => {
                                    return tableCellContent(
                                      parseFloat(rt.rewardsEarned).toFixed(4),
                                      null,
                                      rt.token?.symbol,
                                      null,
                                      rt && rt.token && rt.token.logoURI
                                        ? rt.token.logoURI
                                        : `/tokens/unknown-logo--${appTheme}.svg`
                                    );
                                  })}

                                {row &&
                                  row.rewardType === "Distribution" &&
                                  tableCellContent(
                                    parseFloat(row.earned).toFixed(4),
                                    null,
                                    row.rewardToken.symbol,
                                    null
                                  )}
                              </TableCell>

                              <TableCell className={css.cell} align="right">
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  className={css.action}
                                  onClick={() => {
                                    onClaim(row);
                                  }}
                                >
                                  Claim
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                    : (
                        <TableRow>
                          <td style={{ padding: "30px 12px 16px" }} colSpan={4}>
                            <span
                              style={{
                                fontFamily: 'BalooBhai2',
                                fontWeight: 700,
                                fontSize: 16,
                                lineHeight: "16px",
                                color: '#9a9faf',
                              }}
                            >
                              You don't have any Rewards yet
                            </span>
                          </td>
                        </TableRow>
                      )}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          <TablePagination
            className={"g-flex-column__item-fixed"}
            style={{
              width: "100%",
              padding: "0 20px",
              borderRadius: 20,
              background: '#131313',
              color: '#8191B9',
            }}
            ActionsComponent={TablePaginationActions}
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={rewards.length}
            rowsPerPage={rowsPerPage}
            page={page}
            labelRowsPerPage={window.innerWidth < 550 ? null : "Rows per page:"}
            rowsPerPageOptions={window.innerWidth < 435 ? [] : [5, 10, 25]}
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
      )}

      {windowWidth < 806 && (
        <>
          <div style={{ overflow: "auto" }}>
            {Array.from(rewards).length > 0
              ? stableSort(rewards, getComparator(order, orderBy))
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
                      <div className={["g-flex-column", "g-flex-column__item"].join(" ")}>
                        <div
                          style={{ justifyContent: 'space-between' }}
                          className={[
                            classes.cellHeadPaddings,
                            "g-flex",
                            "g-flex--align-center",
                          ].join(" ")}
                        >
                          {["Bribe", "Fees", "Reward"].includes(
                            row.rewardType
                          ) && (
                            <div className={classes.inline}>
                              <div className={classes.doubleImages}>
                                <img
                                  className={classes.img1Logo}
                                  src={
                                    row && row.token0 && row.token0.logoURI
                                      ? row.token0.logoURI
                                      : ``
                                  }
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
                                  src={
                                    row && row.token1 && row.token1.logoURI
                                      ? row.token1.logoURI
                                      : ``
                                  }
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
                                  {formatSymbol(row?.symbol)}
                                </div>
                                <div className={css.vaultSourceSubtitle}>
                                  {row?.rewardType}
                                </div>
                              </div>
                            </div>
                          )}
                          {["Distribution"].includes(row.rewardType) && (
                            <div className={classes.inline}>
                              <div className={classes.doubleImages}>
                                <img
                                  className={classes.img1Logo}
                                  src={
                                    row &&
                                    row.lockToken &&
                                    row.lockToken.logoURI
                                      ? row.lockToken.logoURI
                                      : ``
                                  }
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
                                  {formatSymbol(row?.lockToken?.symbol)}
                                </div>
                                <div className={css.vaultSourceSubtitle}>
                                  {row?.rewardType}
                                </div>
                              </div>
                            </div>
                          )}
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

                              onClaim(row);
                            }}
                          >
                            Claim
                          </Button>
                        </div>

                        <div className={css.mobileItem}>
                          <div className={css.mobileItemTable}>
                            {headCells.map((headCell) => headCell.id !== 'earned' && (
                              <div className={css.mobileItemRow}>
                                <div className={css.mobileItemCell}>
                                  {headCell.label}
                                </div>

                                <div className={css.mobileItemCell}>
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                    <div className={css.itemTitle} style={{ marginBottom: 4 }}>
                                      {headCell.id === "balance" && row?.gauge &&
                                        formatCurrency(
                                          BigNumber(row?.gauge?.balance)
                                            .div(row?.gauge?.totalSupply)
                                            .times(row?.gauge?.reserve0)
                                        )}
                                    </div>

                                    <div className={css.itemTitle}>
                                      {headCell.id === "balance" && row?.gauge &&
                                        formatCurrency(
                                          BigNumber(row.gauge.balance)
                                            .div(row.gauge.totalSupply)
                                            .times(row.gauge.reserve1)
                                        )}
                                    </div>
                                  </div>

                                  <div style={{ paddingLeft: 8, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                                    <div className={css.itemText} style={{ marginBottom: 4 }}>
                                      {formatSymbol(row?.token0?.symbol)}
                                    </div>

                                    <div className={css.itemText}>
                                      {formatSymbol(row?.token1?.symbol)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div className={css.mobileItemRow}>
                              <div className={css.mobileItemCell}>
                                You Earned
                              </div>
                              <div className={css.mobileItemCell}>
                                <div>
                                  <div>
                                  {row &&
                                    row.rewardType === "Bribe" &&
                                    row.gauge &&
                                    row.gauge.bribesEarned &&
                                    row.gauge.bribesEarned.map((bribe) => {
                                      return tableCellContent(
                                        parseFloat(bribe.earned).toFixed(4),
                                        null,
                                        bribe.token?.symbol,
                                        null,
                                        bribe &&
                                          bribe.token &&
                                          bribe.token.logoURI
                                          ? bribe.token.logoURI
                                          : `/tokens/unknown-logo--${appTheme}.svg`
                                      );
                                    })}
                                  </div>
                                  {row &&
                                    row.rewardType === "Fees" &&
                                    tableCellContent(
                                      parseFloat(row.claimable0).toFixed(4),
                                      parseFloat(row.claimable1).toFixed(4),
                                      row.token0?.symbol,
                                      row.token1?.symbol,
                                      row.token0 && row.token0.logoURI
                                        ? row.token0.logoURI
                                        : `/tokens/unknown-logo--${appTheme}.svg`,
                                      row.token1 && row.token1.logoURI
                                        ? row.token1.logoURI
                                        : `/tokens/unknown-logo--${appTheme}.svg`
                                    )}

                                  <div>
                                    {row &&
                                      row.rewardType === "Reward" &&
                                      row.gauge &&
                                      row.gauge.rewardTokens &&
                                      row.gauge.rewardTokens.map((rt) => {
                                        return tableCellContent(
                                          parseFloat(rt.rewardsEarned).toFixed(4),
                                          null,
                                          rt.token?.symbol,
                                          null,
                                          rt &&
                                          rt.token &&
                                          rt.token.logoURI
                                            ? rt.token.logoURI
                                            : `/tokens/unknown-logo--${appTheme}.svg`
                                        );
                                      })}
                                  </div>

                                  {row &&
                                    row.rewardType === "Distribution" &&
                                    tableCellContent(
                                      parseFloat(row.earned).toFixed(4),
                                      null,
                                      row.rewardToken.symbol,
                                      null
                                    )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            : (
              <div
                style={{
                  marginTop: 20,
                  fontFamily: 'BalooBhai2',
                  fontWeight: 700,
                  fontSize: 20,
                  lineHeight: '28px',
                  textAlign: 'center',
                  color: '#EAE8E1',
                }}
              >
                You do not have rewards yet
              </div>
            )}
          </div>

          {Array.from(rewards).length > 0 ? (
            <TablePagination
              className={"g-flex-column__item-fixed"}
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
              count={rewards.length}
              rowsPerPage={rowsPerPage}
              page={page}
              labelRowsPerPage={window.innerWidth < 550 ? null : "Rows per page:"}
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
          ) : (
            null
          )}
        </>
      )}
    </>
  );
}
