import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
} from "@aws-sdk/client-ec2";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import { stop } from "./stop";

import describeInstancesResponse from "../fixtures/aws-ec2-describe-instances.json";
import describeVolumesTorrentBoxResponse from "../fixtures/aws-ec2-describe-volumes-torrent-box.json";

describe("stop", () => {
  test("can stop boxes", async () => {
    //  Record fixtures with:
    //  AWS_PROFILE=dwmkerr aws ec2 describe-instances --filters "Name=tag:boxes.boxid,Values=*" > ./src/fixtures/aws-ec2-describe-instances.json
    //  aws ec2 describe-volumes --filters Name=attachment.instance-id,Values=i-08fec1692931e31e7 > ./src/fixtures/aws-ec2-describe-volumes-torrent-box.json
    const ec2Mock = mockClient(EC2Client)
      .on(DescribeInstancesCommand)
      .resolves(describeInstancesResponse)
      .on(DescribeVolumesCommand)
      .resolves(describeVolumesTorrentBoxResponse);

    await stop("torrentbox", true);

    expect(ec2Mock).toHaveReceivedCommand(DescribeInstancesCommand);
    expect(ec2Mock).toHaveReceivedCommand(DescribeVolumesCommand);
  });
});
