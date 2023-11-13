import {
  EC2Client,
  DescribeInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
} from "@aws-sdk/client-ec2";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import { getBoxes } from "./get-boxes";

describe("get-boxes", () => {
  test("can get boxes", async () => {
    const ec2Mock = mockClient(EC2Client)
      .on(DescribeInstancesCommand)
      .resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: "i-08fec1692931e31e7",
                Tags: [
                  {
                    Key: "Name",
                    Value: "Torrent Box",
                  },
                  {
                    Key: "boxes.boxid",
                    Value: "torrentbox",
                  },
                ],
                State: {
                  Name: "stopped",
                },
              },
            ],
          },
        ],
      });

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
