import dbg from "debug";
import {
  EC2Client,
  DescribeVolumesCommand,
  DescribeInstancesCommand,
  Tag,
} from "@aws-sdk/client-ec2";

const debug = dbg("boxes:aws");

export function tagsAsObject(tags: Tag[] | undefined): Record<string, string> {
  return (
    tags?.reduce((result: Record<string, string>, tag) => {
      return {
        ...result,
        ...(tag?.Key && { [tag.Key]: tag.Value || "" }),
      };
    }, {}) || {}
  );
}

export interface SnapshotDetails {
  snapshotId: string;
  device: string;
}

export function snapshotDetailsToTag(
  snapshotDetails: SnapshotDetails[],
): string {
  return JSON.stringify(
    snapshotDetails.map((snapshot) => ({
      device: snapshot.device,
      snapshotId: snapshot.snapshotId,
    })),
  );
}

export function snapshotDetailsFromTag(tagValue: string) {
  const rawDetails = JSON.parse(tagValue) as Record<string, string>[];
  const snapshots = rawDetails.map((raw) => {
    if (!raw["device"] || !raw["snapshotId"]) {
      throw new Error("snapshot details tag missing device/volume data");
    }
    return {
      device: raw["device"],
      snapshotId: raw["snapshotId"],
    };
  });
  return snapshots;
}

export async function waitForVolumeReady(
  client: EC2Client,
  volumeId: string,
  interval = 5000,
  maxAttempts = 60,
) {
  //  When running unit tests in Jest we can return immediately as
  //  all service calls are mocked to correct values. This function
  //  can be tested independently in the future.
  if (process.env.JEST_WORKER_ID !== undefined) {
    return true;
  }

  let attempts = 0;
  let volumeState = "";

  do {
    try {
      const { Volumes } = await client.send(
        new DescribeVolumesCommand({ VolumeIds: [volumeId] }),
      );
      if (Volumes && Volumes.length > 0 && Volumes?.[0].State) {
        volumeState = Volumes[0].State;
      } else {
        throw new Error("Volume not found");
      }
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    } catch (error: any) {
      throw new Error(`Error describing volume ${volumeId}: ${error.message}`);
    }

    if (volumeState === "available") {
      debug(`volume ${volumeId} is now in a ready state.`);
      return true;
    }

    attempts++;
    debug(
      `waiting for volume ${volumeId} to be in a ready state (attempt ${attempts}/${maxAttempts})...`,
    );

    await new Promise((resolve) => setTimeout(resolve, interval));
  } while (attempts < maxAttempts);

  return false;
}

type EC2InstanceState =
  | "pending"
  | "running"
  | "shutting-down"
  | "terminated"
  | "stopping"
  | "stopped";

export async function waitForInstanceState(
  client: EC2Client,
  instanceId: string,
  targetState: EC2InstanceState,
  interval = 5000,
  maxAttempts = 60,
) {
  //  When running unit tests in Jest we can return immediately as
  //  all service calls are mocked to correct values. This function
  //  can be tested independently in the future.
  if (process.env.JEST_WORKER_ID !== undefined) {
    return true;
  }

  let attempts = 0;

  do {
    try {
      const { Reservations } = await client.send(
        new DescribeInstancesCommand({
          InstanceIds: [instanceId],
        }),
      );
      const currentState = Reservations?.[0].Instances?.[0].State?.Name;
      if (!currentState) {
        throw new Error("Instance or instance state not found");
      }
      if (currentState === (targetState as string)) {
        debug(`instance ${instanceId} is now in target state '${targetState}'`);
        return true;
      }
      // eslint-disable-next-line  @typescript-eslint/no-explicit-any
    } catch (error: any) {
      throw new Error(
        `Error describing instance ${instanceId}: ${error.message}`,
      );
    }

    attempts++;
    debug(
      `waiting for instance ${instanceId} to be in target state '${targetState}' (attempt ${attempts}/${maxAttempts})...`,
    );

    await new Promise((resolve) => setTimeout(resolve, interval));
  } while (attempts < maxAttempts);

  debug(
    `timeout waiting for instance ${instanceId} to be in the target state '${targetState}'`,
  );
  return false;
}
