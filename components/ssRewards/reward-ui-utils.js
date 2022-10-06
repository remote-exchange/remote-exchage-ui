import BigNumber from "bignumber.js";

export function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

export function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export function descendingComparator(a, b, orderBy) {
  if (!a || !b) {
    return 0;
  }

  let aAmount = 0;
  let bAmount = 0;

  switch (orderBy) {
    case "reward":
      if (b?.rewardType < a?.rewardType) {
        return -1;
      }
      if (b?.rewardType > a?.rewardType) {
        return 1;
      }
      if (b?.symbol < a?.symbol) {
        return -1;
      }
      if (b?.symbol > a?.symbol) {
        return 1;
      }
      return 0;

    case "balance":
      if (a?.rewardType === "Bribe") {
        aAmount = a?.gauge?.balance;
      } else {
        aAmount = a?.balance;
      }

      if (b?.rewardType === "Bribe") {
        bAmount = b?.gauge?.balance;
      } else {
        bAmount = b?.balance;
      }

      if (BigNumber(bAmount).lt(aAmount)) {
        return -1;
      }
      if (BigNumber(bAmount).gt(aAmount)) {
        return 1;
      }
      return 0;

    case "earned":
      if (a?.rewardType === "Bribe") {
        aAmount = a?.gauge?.bribesEarned?.length;
      } else {
        aAmount = 2;
      }

      if (b.rewardType === "Bribe") {
        bAmount = b?.gauge?.bribesEarned?.length;
      } else {
        bAmount = 2;
      }

      if (BigNumber(bAmount).lt(aAmount)) {
        return -1;
      }
      if (BigNumber(bAmount).gt(aAmount)) {
        return 1;
      }
      return 0;

    default:
      return 0;
  }
}

export const headCells = [
  {
    id: "reward",
    numeric: false,
    disablePadding: false,
    label: "Reward Source",
    isSticky: true,
    isHideInDetails: true,
  },
  {
    id: "balance",
    numeric: true,
    disablePadding: false,
    label: "Your Position",
  },
  {
    id: "earned",
    numeric: true,
    disablePadding: false,
    label: "You Earned",
    isHideInDetails: true,
  },
  {
    id: "bruh",
    numeric: true,
    disablePadding: false,
    label: "Actions",
    isHideInDetails: true,
  },
];
