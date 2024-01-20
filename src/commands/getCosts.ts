import { getBoxesCosts } from "../lib/get-boxes-costs";
import { TerminatingWarning } from "../lib/errors";

type BoxCosts = Record<string, string>;

export async function getCosts({
  yes,
  year,
  month,
}: {
  yes: boolean;
  year: string;
  month: string;
}): Promise<BoxCosts> {
  //  If the user hasn't passed the 'yes' parameter to confirm, ask now.
  if (yes !== true) {
    const message = `The AWS cost explorer charges $0.01 per call.
To accept charges, re-run with the '--yes' parameter.`;
    throw new TerminatingWarning(message);
  }

  //  Parse the year/month number if provided.
  const yearNumber = year ? parseInt(year, 10) : undefined;
  const monthNumber = month ? parseInt(month, 10) : undefined;

  //  Get the box costs as an array. Then flatten into an object.
  const boxCosts = await getBoxesCosts({
    yearNumber,
    monthNumber,
  });
  const boxCostsObject = boxCosts.reduce((acc, boxCost) => {
    acc[boxCost.boxId] = boxCost.amount;
    return acc;
  }, {} as BoxCosts);

  return boxCostsObject;
}
