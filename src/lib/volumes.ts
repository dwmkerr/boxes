import {
  DescribeVolumesCommand,
  CreateSnapshotCommand,
  EC2Client,
  VolumeAttachment,
  CreateTagsCommand,
  DetachVolumeCommand,
  DeleteVolumeCommand,
  DescribeTagsCommand,
  CreateVolumeCommand,
  DescribeInstancesCommand,
  AttachVolumeCommand,
} from "@aws-sdk/client-ec2";
import { getConfiguration } from "../configuration";
import { TerminatingWarning } from "./errors";
import * as aws from "./aws-helpers";

export interface DetachableVolume {
  volumeId: string;
  device: string;
}

export interface SnapshottedAndDeletedVolume extends DetachableVolume {
  snapshotId: string;
}

export interface RecreatedVolume extends DetachableVolume {
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
  const snapshotDetailsTag = {
    Key: "boxes.volumesnapshots",
    Value: aws.snapshotDetailsToTag(snapshots),
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

export async function recreateVolumesFromSnapshotTag(instanceId: string) {
  //  Create an EC2 client.
  const { aws: awsConfig } = await getConfiguration();
  const client = new EC2Client(awsConfig);

  //  Get the details of the instance, we'll need the tags and AZ.
  const result = await client.send(
    new DescribeInstancesCommand({
      InstanceIds: [instanceId],
    }),
  );
  const instance = result?.Reservations?.[0].Instances?.[0];
  if (!instance) {
    throw new TerminatingWarning(
      `Cannot restore volumes - unable to get instance details for instance '${instanceId}'`,
    );
  }
  const availabilityZone = instance?.Placement?.AvailabilityZone;
  if (!availabilityZone) {
    throw new TerminatingWarning(
      `Cannot restore volumes - unable to find availability zone for instance instance '${instanceId}'`,
    );
  }

  //  Get the tags.
  const tags = aws.tagsAsObject(instance.Tags);

  //  If we don't have the required snapshots tag, we must fail.
  const snapshotDetailsTag = tags["boxes.volumesnapshots"];
  if (!snapshotDetailsTag) {
    throw new TerminatingWarning(
      "unable to restore volume snapshots - required tags are missing",
    );
  }

  //  From the snapshot details tag, load the actual snapshot details.
  const snapshotDetails = aws.snapshotDetailsFromTag(snapshotDetailsTag);

  //  For each snapshot, create a volume and reattach.
  const createVolumeResults = await Promise.all(
    snapshotDetails.map((snapshot) => {
      return client
        .send(
          new CreateVolumeCommand({
            SnapshotId: snapshot.snapshotId,
            AvailabilityZone: availabilityZone,
          }),
        )
        .then((createVolumeResult) => {
          return client.send(
            new AttachVolumeCommand({
              InstanceId: instanceId,
              VolumeId: createVolumeResult.VolumeId,
              Device: snapshot.device,
            }),
          );
        });
    }),
  );

  return {};
}
