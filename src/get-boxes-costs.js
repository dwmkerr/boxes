import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from "@aws-sdk/client-cost-explorer"; // ES Modules import

function dateToLocalDateString(date) {
  const year = `${date.getFullYear()}`.padStart(4, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getBoxesCosts(options) {
  const client = new CostExplorerClient();

  //  Get the firt day of the current month OR the specified month.
  const now = new Date(Date.now());
  const startOfMonth = options.monthNumber
    ? new Date(now.getFullYear(), options.monthNumber - 1, 10)
    : new Date(now);
  startOfMonth.setDate(1);

  //  Get the next month, then 'zero-th' date, which is the last day of the
  //  month before.
  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(startOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  const start = dateToLocalDateString(startOfMonth);
  const end = dateToLocalDateString(endOfMonth);
  const response = await client.send(
    new GetCostAndUsageCommand({
      TimePeriod: { Start: start, End: end },
      Metrics: ["UNBLENDED_COST"],
      Granularity: "MONTHLY",
      GroupBy: [{ Type: "TAG", Key: "boxes.boxid" }],
    }),
  );

  //  Get the groups.
  const groups = response.ResultsByTime[0].Groups;
  const estimated = response.ResultsByTime[0].Estimated;

  //  Map each group - each group looks like this:
  // {
  //   "Keys": [
  //     "boxes.boxid$steambox"
  //   ],
  //     "Metrics": {
  //       "UnblendedCost": {
  //         "Amount": "0.5264341375",
  //         "Unit": "USD"
  //       }
  //     }
  // },
  //  We need to make the set look like this:
  //  {
  //    "*": "~ 33.78 USD",
  //    steambox: "~ 0.53 USD",
  //    torrentbox: "~ 0.05 USD",
  //  }
  const printCost = (estimated, stringAmount, unit) => {
    const lead = estimated ? "~ " : "";
    const amount = Number.parseFloat(stringAmount, 10).toFixed(2);
    return `${lead}${amount} ${unit}`;
  };
  const costs = groups.map((g) => {
    const boxId = g.Keys[0].split("$")[1];
    const amount = printCost(
      estimated,
      g.Metrics.UnblendedCost.Amount,
      g.Metrics.UnblendedCost.Unit,
    );
    return {
      boxId,
      amount,
    };
  });
  const costsObject = costs.reduce((agg, cost) => {
    agg[cost.boxId || "*"] = cost.amount;
    return agg;
  }, {});

  return costsObject;
}
