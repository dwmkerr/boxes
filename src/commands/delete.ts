import dbg from "debug";
import {
  EC2Client,
  TerminateInstancesCommand,
  DescribeSnapshotsCommand,
  DeleteSnapshotCommand,
  DescribeInstancesCommand,
} from "@aws-sdk/client-ec2";
import { TerminatingWarning } from "../lib/errors";
import { getBoxes } from "../lib/get-boxes";
import { getConfiguration } from "../lib/configuration";
import { tagNames } from "../lib/constants";
import * as aws from "../lib/aws-helpers";

const debug = dbg("boxes:delete");

export type DeleteOptions = {
  boxId: string;
};

export type DeleteResult = {
  boxId: string;
  instanceId: string;
  deletedSnapshots: string[];
};

export async function deleteBox(options: DeleteOptions): Promise<DeleteResult> {
  const { boxId } = options;

  //  Get the box, fail with a warning if it is not found.
  const boxes = await getBoxes();
  const box = boxes.find((b) => b.boxId === boxId);
  if (!box) {
    throw new TerminatingWarning(`Unable to find box with id '${boxId}'`);
  }

  //  If the box has no instance id, fail.
  if (!box.instanceId) {
    throw new TerminatingWarning(
      `Box with id '${boxId}' has no associated AWS instance ID`,
    );
  }

  //  Create an EC2 client.
  const { aws: awsConfig } = await getConfiguration();
  const client = new EC2Client({ ...awsConfig });

  //  First, find any snapshots tagged with this box id.
  debug(`searching for snapshots tagged with ${tagNames.boxId}=${boxId}...`);
  const snapshotsResponse = await client.send(
    new DescribeSnapshotsCommand({
      Filters: [
        {
          Name: `tag:${tagNames.boxId}`,
          Values: [boxId],
        },
      ],
    }),
  );
  const snapshots = snapshotsResponse.Snapshots || [];
  debug(`found ${snapshots.length} snapshot(s) to delete`);

  //  Delete each snapshot.
  const deletedSnapshots: string[] = [];
  for (const snapshot of snapshots) {
    if (snapshot.SnapshotId) {
      debug(`deleting snapshot ${snapshot.SnapshotId}...`);
      await client.send(
        new DeleteSnapshotCommand({
          SnapshotId: snapshot.SnapshotId,
        }),
      );
      deletedSnapshots.push(snapshot.SnapshotId);
    }
  }

  //  Now terminate the instance.
  debug(`terminating instance ${box.instanceId}...`);
  await client.send(
    new TerminateInstancesCommand({
      InstanceIds: [box.instanceId],
    }),
  );
  debug(`instance ${box.instanceId} terminated`);

  return {
    boxId,
    instanceId: box.instanceId,
    deletedSnapshots,
  };
}
