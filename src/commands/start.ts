import dbg from "debug";
import { EC2Client, StartInstancesCommand } from "@aws-sdk/client-ec2";
import { TerminatingWarning } from "../lib/errors";
import { getBoxes } from "../lib/get-boxes";
import { BoxState, awsStateToBoxState } from "../box";
import { getConfiguration } from "../configuration";

const debug = dbg("boxes:start");

export interface BoxTransition {
  boxId: string;
  instanceId: string | undefined;
  currentState: BoxState;
  previousState: BoxState;
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
  const { aws: awsConfig } = await getConfiguration();
  const client = new EC2Client(awsConfig);

  //  Send the 'stop instances' command. Find the status of the stopping
  //  instance in the respose.
  debug(`preparing to start instance ${box.instanceId}...`);
  const response = await client.send(
    new StartInstancesCommand({
      InstanceIds: [box.instanceId],
    }),
  );
  debug(`...complete, ${response.StartingInstances?.length} instances started`);
  const startingInstances = response.StartingInstances?.find(
    (si) => si.InstanceId === box.instanceId,
  );

  return {
    boxId,
    instanceId: box.instanceId,
    currentState: awsStateToBoxState(startingInstances?.CurrentState?.Name),
    previousState: awsStateToBoxState(startingInstances?.PreviousState?.Name),
  };
}
