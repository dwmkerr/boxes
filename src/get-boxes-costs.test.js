/**
 * @jest-environment-options {"timezone": "j"}
 */
import { jest } from "@jest/globals";
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from "@aws-sdk/client-cost-explorer"; // ES Modules import
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import { getBoxesCosts } from "./get-boxes-costs";

import getMonthlyCostsResponse from "../monthly-costs.json";

describe("get-boxes-costs", () => {
  beforeAll(() => {
    //  Set the time to the end of the month UTC - this means that if we are
    //  running in any local which is > 0 from UTC the localisation must be
    //  working properly (otherwise this'll show as december, not november).
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2023-11-30T23:59:59.000Z").getTime());
  });
  afterAll(() => {
    jest.useRealTimers();
  });
  test("can get boxes costs", async () => {
    const ecMock = mockClient(CostExplorerClient)
      .on(GetCostAndUsageCommand)
      .resolves(getMonthlyCostsResponse);
    const boxCosts = await getBoxesCosts();

    //  TODO this only works if the local time zone is set properly, e.g:
    //  pacific time. Need a better way.
    expect(ecMock).toHaveReceivedCommandWith(GetCostAndUsageCommand, {
      TimePeriod: { Start: "2023-11-01", End: "2023-11-30" },
      Metrics: ["UNBLENDED_COST"],
      Granularity: "MONTHLY",
      GroupBy: [{ Type: "TAG", Key: "boxes.boxid" }],
    });

    expect(boxCosts).toMatchObject({
      "*": "~ 33.78 USD",
      steambox: "~ 0.53 USD",
      torrentbox: "~ 0.05 USD",
    });
  });
});
