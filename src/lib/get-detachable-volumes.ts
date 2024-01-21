import {
  DescribeVolumesCommand,
  EC2Client,
  VolumeAttachment,
} from "@aws-sdk/client-ec2";
import { getConfiguration } from "../configuration";

interface DetachableVolume {
  volumeId: string;
  device: string;
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
