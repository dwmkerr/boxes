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
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  test("time zone is set properly for tests", () => {
    expect(process.env.TZ).toEqual("America/Los_Angeles");
    expect(new Date().toString()).toMatch(/Pacific Standard Time/);
  });

  test("can get boxes costs", async () => {
    const ecMock = mockClient(CostExplorerClient)
      .on(GetCostAndUsageCommand)
      .resolves(getMonthlyCostsResponse);
    const boxCosts = await getBoxesCosts();

    //  Set the time to the end of the month UTC - this means that if we are
    //  running in any locale which is > 0 from UTC the localisation must be
    //  working properly (otherwise this'll show as december, not november).
    //  We explicitly run our tests in Los Angeles (UTC+8 or UTC+7) to allow
    //  us to test edge cases like this.
    jest.setSystemTime(new Date("2023-11-30T23:59:59.000Z").getTime());

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
