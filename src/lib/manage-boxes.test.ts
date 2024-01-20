import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import { getBoxes } from "./get-boxes";

import describeInstancesResponse from "../fixtures/aws-ec2-describe-instances.json";

describe("manage-boxes", () => {
  test("throws an unknown box id warning if a box is not found", async () => {
    //  Record fixture with:
    //  AWS_PROFILE=dwmkerr aws ec2 describe-instances --filters "Name=tag:boxes.boxid,Values=*" > ./src/fixtures/aws-ec2-describe-instances.json
    const ec2Mock = mockClient(EC2Client)
      .on(DescribeInstancesCommand)
      .resolves(describeInstancesResponse);

    const boxes = await getBoxes();

    expect(ec2Mock).toHaveReceivedCommand(DescribeInstancesCommand);
    expect(boxes[0]).toMatchObject({
      boxId: "torrentbox",
      instanceId: "i-08fec1692931e31e7",
      name: "Torrent Box",
      status: "stopped",
      // we don't care too much about the 'instance' object..
    });
  });
});
