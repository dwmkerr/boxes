import { EC2Client, StartInstancesCommand } from "@aws-sdk/client-ec2";
import { TerminatingWarning } from "../lib/errors";
import { getBoxes } from "../lib/get-boxes";

export interface BoxTransition {
  boxId: string;
  instanceId: string | undefined;
  currentState: string;
  previousState: string;
}

export async function start(boxId: string): Promise<BoxTransition> {
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
  const client = new EC2Client({});

  //  Send the 'stop instances' command. Find the status of the stopping
  //  instance in the respose.
  const response = await client.send(
    new StartInstancesCommand({
      InstanceIds: [box.instanceId],
    }),
  );
  const stoppingInstance = response.StartingInstances?.find(
    (si) => si.InstanceId === box.instanceId,
  );

  return {
    boxId,
    instanceId: box.instanceId,
    currentState: stoppingInstance?.CurrentState?.Name || "unknown",
    previousState: stoppingInstance?.PreviousState?.Name || "unknown",
  };
}
