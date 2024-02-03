import path from "path";
import mock from "mock-fs";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import { run } from "./run";

// jest.mock("../lib/configuration", () => {
//   return { getConfiguration: async () => ({}) };
// });

import describeInstancesResponse from "../fixtures/get-boxes-describe-instances-started.json";

describe("run", () => {
  beforeEach(() => {
    const boxesPath = path.join(path.resolve(), "./boxes.json");
    mock({
      [boxesPath]: mock.load(
        path.join(path.resolve(), "./src/fixtures/boxes.json"),
      ),
    });
  });

  afterEach(() => {
    mock.restore();
  });

  test("can run the dcv command", async () => {
    //  Record fixtures with:
    //  AWS_PROFILE=dwmkerr aws ec2 describe-instances --filters "Name=tag:boxes.boxid,Values=*" > ./src/fixtures/get-boxes-describe-instances-started.json
    const ec2Mock = mockClient(EC2Client)
      .on(DescribeInstancesCommand)
      .resolves(describeInstancesResponse);

    const { command, copyCommand } = await run({
      boxId: "steambox",
      commandName: "dcv",
      copyCommand: true,
    });

    expect(command).toEqual(
      "dcv://ec2-34-215-135-99.us-west-2.compute.amazonaws.com:8443",
    );
    expect(copyCommand).toEqual("password");

    expect(ec2Mock).toHaveReceivedCommand(DescribeInstancesCommand);
  });

  test("can run the shared ssh command", async () => {
    const ec2Mock = mockClient(EC2Client)
      .on(DescribeInstancesCommand)
      .resolves(describeInstancesResponse);

    const { command, copyCommand } = await run({
      boxId: "steambox",
      commandName: "ssh",
      copyCommand: true,
    });

    expect(command).toEqual(
      "ssh ec2-34-215-135-99.us-west-2.compute.amazonaws.com",
    );
    expect(copyCommand).toEqual(
      "ssh ec2-34-215-135-99.us-west-2.compute.amazonaws.com",
    );

    expect(ec2Mock).toHaveReceivedCommand(DescribeInstancesCommand);
  });
});
