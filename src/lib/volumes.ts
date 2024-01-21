import {
  DescribeVolumesCommand,
  CreateSnapshotCommand,
  EC2Client,
  VolumeAttachment,
  TagSpecification,
  CreateTagsCommand,
  DetachVolumeCommand,
  DeleteVolumeCommand,
} from "@aws-sdk/client-ec2";
import { getConfiguration } from "../configuration";
import { TerminatingWarning } from "./errors";

export interface DetachableVolume {
  volumeId: string;
  device: string;
}

export interface SnapshottedAndDeletedVolume extends DetachableVolume {
  snapshotId: string;
}

export async function getDetachableVolumes(
  instanceId: string,
): Promise<DetachableVolume[]> {
  //  Create an EC2 client.
  const { aws: awsConfig } = await getConfiguration();
  const client = new EC2Client(awsConfig);

  //  Get the volumes for the box.
  const response = await client.send(
    new DescribeVolumesCommand({
      Filters: [
        {
          Name: "attachment.instance-id",
          Values: [instanceId],
        },
      ],
    }),
  );

  //  If there are no volumes, we're done.
  if (!response.Volumes) {
    return [];
  }

  //  Filter down the volumes to ones which are attached.
  const volumeAttachments = response.Volumes.flatMap((volume) => {
    return volume?.Attachments?.[0];
  }).filter((va): va is VolumeAttachment => !!va);

  //  Grab the detachable volumes from the response.
  const detachableVolumes = volumeAttachments.reduce(
    (result: DetachableVolume[], attachment) => {
      if (!attachment.VolumeId || !attachment.Device) {
        return result;
      }
      result.push({
        volumeId: attachment.VolumeId,
        device: attachment.Device,
      });
      return result;
    },
    [],
  );

  return detachableVolumes;
}

export async function snapshotTagDeleteVolumes(
  instanceId: string,
  volumes: DetachableVolume[],
  tags: Record<string, string>[],
): Promise<SnapshottedAndDeletedVolume[]> {
  //  Create an EC2 client.
  const { aws: awsConfig } = await getConfiguration();
  const client = new EC2Client(awsConfig);
  const awsTags = tags.map((tag) => ({
    Key: tag.key,
    Value: tag.value,
  }));

  //  Detach each volume. No useful results are returned, but the client will
  //  throw on an error.
  //  TODO we may need to 'wait' as well, no built in parameter for this.
  await Promise.all(
    volumes.map(async (volume) => {
      return await client.send(
        new DetachVolumeCommand({ VolumeId: volume.volumeId }),
      );
    }),
  );

  //  Snapshot each volume.
  //  TODO we may need to 'wait' as well, no built in parameter for this.
  const snapshots = await Promise.all(
    volumes.map(async (volume) => {
      const response = await client.send(
        new CreateSnapshotCommand({
          VolumeId: volume.volumeId,
          TagSpecifications: [
            {
              ResourceType: "snapshot",
              Tags: awsTags,
            },
          ],
        }),
      );

      if (!response.SnapshotId) {
        throw new TerminatingWarning(
          `Failed to get a snapshot ID when snaphotting volume ${volume}, aborting to prevent data loss`,
        );
      }

      return {
        ...volume,
        snapshotId: response.SnapshotId,
      };
    }),
  );

  //  Now we must tag the instance with the details of the snapshots, so that
  //  we can later restore them. Note that there is no response for this call,
  //  it will just throw for errors.
  const snapshotDetails = snapshots.map((snapshot) => ({
    snapshotId: snapshot.snapshotId,
    device: snapshot.device,
  }));
  const snapshotDetailsTag = {
    Key: "boxes.volumesnapshots",
    Value: JSON.stringify(snapshotDetails),
  };
  await client.send(
    new CreateTagsCommand({
      Resources: [instanceId],
      Tags: [snapshotDetailsTag],
    }),
  );

  //  We've created the snapshots, now we can delete the volumes.
  await Promise.all(
    volumes.map(async (volume) => {
      await client.send(new DeleteVolumeCommand({ VolumeId: volume.volumeId }));
    }),
  );

  return snapshots;
}
