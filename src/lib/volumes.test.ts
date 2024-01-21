import {
  EC2Client,
  DescribeVolumesCommand,
  CreateSnapshotCommand,
} from "@aws-sdk/client-ec2";
import { mockClient } from "aws-sdk-client-mock";
import "aws-sdk-client-mock-jest";
import {
  DetachableVolume,
  getDetachableVolumes,
  snapshotTagDeleteVolumes,
} from "./volumes";

import describeVolumesTorrentBoxResponse from "../fixtures/volumes-describe-volumes-torrent-box.json";
import createSnapshot1Response from "../fixtures/volumes-create-snapshot-volume1.json";
import createSnapshot2Response from "../fixtures/volumes-create-snapshot-volume2.json";

describe("volumes", () => {
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

  describe("snapshot-and-delete-volumes", () => {
    test("can snapshot with tags and delete volumes", async () => {
      //  Record fixtures with:
      //  aws ec2 create-snapshot --volume-id vol-0582d7fc0f3d797fc --tag-specifications "ResourceType=snapshot,Tags=[{Key=boxes.boxid,Value=torrentbox}]" >> ./src/fixtures/volumes-create-snapshot-volume1.json
      //  aws ec2 create-snapshot --volume-id vol-0987a9ce9bb4c7b1d --tag-specifications "ResourceType=snapshot,Tags=[{Key=boxes.boxid,Value=torrentbox}]" >> ./src/fixtures/volumes-create-snaphshot-volume2.json
      const ec2Mock = mockClient(EC2Client)
        .on(CreateSnapshotCommand, {
          VolumeId: "vol-0582d7fc0f3d797fc",
        })
        .resolves(createSnapshot1Response)
        .on(CreateSnapshotCommand, {
          VolumeId: "vol-0987a9ce9bb4c7b1d",
        })
        .resolves(createSnapshot2Response);

      //  Get the detachable volumes, assert the command was called with the
      //  correct instance id.
      const detachableVolumes: DetachableVolume[] = [
        {
          volumeId: "vol-0582d7fc0f3d797fc",
          device: "/dev/xvda",
        },
        {
          volumeId: "vol-0987a9ce9bb4c7b1d",
          device: "/dev/xvdf",
        },
      ];

      const tags = [{ key: "boxes.boxid", value: "torrentbox" }];
      const result = await snapshotTagDeleteVolumes(detachableVolumes, tags);

      expect(ec2Mock).toHaveReceivedCommandWith(CreateSnapshotCommand, {
        VolumeId: "vol-0582d7fc0f3d797fc",
        TagSpecifications: [
          {
            ResourceType: "snapshot",
            Tags: [
              {
                Key: "boxes.boxid",
                Value: "torrentbox",
              },
            ],
          },
        ],
      });
      expect(ec2Mock).toHaveReceivedCommandWith(CreateSnapshotCommand, {
        VolumeId: "vol-0987a9ce9bb4c7b1d",
        TagSpecifications: [
          {
            ResourceType: "snapshot",
            Tags: [
              {
                Key: "boxes.boxid",
                Value: "torrentbox",
              },
            ],
          },
        ],
      });

      expect(result).toEqual([
        {
          volumeId: "vol-0582d7fc0f3d797fc",
          device: "/dev/xvda",
          snapshotId: "snap-03c3efc7e9254ab0a",
        },
        {
          volumeId: "vol-0987a9ce9bb4c7b1d",
          device: "/dev/xvdf",
          snapshotId: "snap-056afd3da4b3b003b",
        },
      ]);
    });
  });
});
