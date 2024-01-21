import { EC2Client, DescribeVolumesCommand } from "@aws-sdk/client-ec2";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import { getDetachableVolumes } from "./get-detachable-volumes";

import describeVolumesTorrentBoxResponse from "../fixtures/aws-ec2-describe-volumes-torrent-box.json";

describe("get-detachable-volumes", () => {
  test("can get detachable volumes from 'torrentbox'", async () => {
    //  Record fixtures with:
    //  aws ec2 describe-volumes --filters Name=attachment.instance-id,Values=i-08fec1692931e31e7 > ./src/fixtures/aws-ec2-describe-volumes-torrent-box.json
    const ec2Mock = mockClient(EC2Client)
      .on(DescribeVolumesCommand)
      .resolves(describeVolumesTorrentBoxResponse);

    //  Get the detachable volumes, assert the command was called with the
    //  correct instance id.
    const instanceId = "i-08fec1692931e31e7"; // fixture 'torrentbox' id
    const detachableVolumes = await getDetachableVolumes(instanceId);

    expect(ec2Mock).toHaveReceivedCommandWith(DescribeVolumesCommand, {
      Filters: [
        {
          Name: "attachment.instance-id",
          Values: [instanceId],
        },
      ],
    });

    expect(detachableVolumes).toEqual([
      {
        volumeId: "vol-0582d7fc0f3d797fc",
        device: "/dev/xvda",
      },
      {
        volumeId: "vol-0987a9ce9bb4c7b1d",
        device: "/dev/xvdf",
      },
    ]);
  });
});
