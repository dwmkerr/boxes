import dbg from "debug";
import { EC2Client, StopInstancesCommand } from "@aws-sdk/client-ec2";
import { TerminatingWarning } from "../lib/errors";
import { getBoxes } from "../lib/get-boxes";
import { awsStateToBoxState } from "../box";
import { getConfiguration } from "../configuration";
import { BoxTransition } from "./start";
import { waitForInstanceState } from "../lib/aws-helpers";

const debug = dbg("boxes:stop");

export interface StopOptions {
  boxId: string;
  wait: boolean;
}

export async function stop(options: StopOptions): Promise<BoxTransition> {
  const { boxId, wait } = options;

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
  debug(`preparing to stop instance ${box.instanceId}...`);
  const response = await client.send(
    new StopInstancesCommand({
      InstanceIds: [box.instanceId],
    }),
  );
  debug(`...complete, ${response.StoppingInstances?.length} instances stopped`);
  const stoppingInstance = response.StoppingInstances?.find(
    (si) => si.InstanceId === box.instanceId,
  );

  //  If the wait flag has been specified, wait for the instance to enter
  //  the 'started' state.
  if (wait) {
    console.log(
      `  waiting for ${boxId} to shutdown - this may take some time...`,
    );
    waitForInstanceState(client, box.instanceId, "stopped");
  }

  return {
    boxId,
    instanceId: box.instanceId,
    currentState: awsStateToBoxState(stoppingInstance?.CurrentState?.Name),
    previousState: awsStateToBoxState(stoppingInstance?.PreviousState?.Name),
  };
}
