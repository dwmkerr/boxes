import { jest } from "@jest/globals";
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from "@aws-sdk/client-cost-explorer"; // ES Modules import
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import { getBoxesCosts } from "./get-boxes-costs";

import getMonthlyCostsResponse from "./fixtures/aws-ce-get-costs.json";

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
    const mockedCurrentDate = new Date("2023-11-30T23:59:59.000Z");
    jest.setSystemTime(mockedCurrentDate.getTime());

    //  Assert that we've hit the mocked current month from the first date
    //  to the last.
    expect(ecMock).toHaveReceivedCommandWith(GetCostAndUsageCommand, {
      TimePeriod: {
        Start: `${mockedCurrentDate.getFullYear()}-${mockedCurrentDate.getMonth()}-01`,
        End: `${mockedCurrentDate.getFullYear()}-${mockedCurrentDate.getMonth()}-30`,
      },
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

  test("correctly sets the month number if provided", async () => {
    const ecMock = mockClient(CostExplorerClient)
      .on(GetCostAndUsageCommand)
      .resolves(getMonthlyCostsResponse);
    const mockedCurrentDate = new Date("2023-11-13T23:59:59.000Z");
    jest.setSystemTime(mockedCurrentDate.getTime());

    //  Explicitly look for the previous month from the mocked current date.
    const monthNumber = 10;
    debugger;
    await getBoxesCosts({
      monthNumber,
    });

    //  Assert that we've hit the mocked current year with the specified month.
    expect(ecMock).toHaveReceivedCommandWith(GetCostAndUsageCommand, {
      TimePeriod: {
        Start: `${mockedCurrentDate.getFullYear()}-${monthNumber}-01`,
        End: `${mockedCurrentDate.getFullYear()}-${monthNumber}-31`,
      },
      Metrics: ["UNBLENDED_COST"],
      Granularity: "MONTHLY",
      GroupBy: [{ Type: "TAG", Key: "boxes.boxid" }],
    });
  });
});
