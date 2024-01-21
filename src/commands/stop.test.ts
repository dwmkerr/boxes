import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import { stop } from "./stop";

import describeInstancesResponse from "../fixtures/aws-ec2-describe-instances.json";

describe("stop", () => {
  test("can stop boxes", async () => {
    //  Record fixtures with:
    //  AWS_PROFILE=dwmkerr aws ec2 describe-instances --filters "Name=tag:boxes.boxid,Values=*" > ./src/fixtures/aws-ec2-describe-instances.json
    const ec2Mock = mockClient(EC2Client)
      .on(DescribeInstancesCommand)
      .resolves(describeInstancesResponse);

    await stop("torrentbox", true);

    expect(ec2Mock).toHaveReceivedCommand(DescribeInstancesCommand);
  });
});
