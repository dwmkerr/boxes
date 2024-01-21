import { DescribeVolumesCommand, EC2Client, StopInstancesCommand } from "@aws-sdk/client-ec2";
import { TerminatingWarning } from "../lib/errors";
import { getBoxes } from "../lib/get-boxes";
import { awsStateToBoxState } from "../box";
import { getConfiguration } from "../configuration";

interface DetachedVolumes {
  volumeId: string;
  device: string;
}

export async function stop(boxId: string, detach: boolean) {
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

  //  If we are going to detach, we need to get the state of each attached
  //  volume so that we can store it in a tag on the box, which will be used
  //  when we restart the box later to attach to the correct place.
  //  TODO; actally, all of this should be in 'lib' in a dedicated set of
  //  smaller functions...
  if (detach) {
    console.log("debug: instance will not be stopped, testing detach");
    //
    //  Get the volumes for the box.
    const response = await client.send(
      new DescribeVolumesCommand({
        Filters: [
          {
            Name: "attachment.instance-id",
            Values: [box.instanceId],
          },
        ],
      }),
    );

    console.log(JSON.stringify(response, null, 2));

    return {
      boxId,
      instanceId: box.instanceId,
      currentState: awsStateToBoxState(box.instance?.State?.Name),
      previousState: awsStateToBoxState(box.instance?.State?.Name),
    };

  }

  //  Send the 'stop instances' command. Find the status of the stopping
  //  instance in the respose.
  const response = await client.send(
    new StopInstancesCommand({
      InstanceIds: [box.instanceId],
    }),
  );
  const stoppingInstance = response.StoppingInstances?.find(
    (si) => si.InstanceId === box.instanceId,
  );

  if (detach) {
    throw new TerminatingWarning(
      `'detach' parameter currently not implemented`,
    );
  }
  return {
    boxId,
    instanceId: box.instanceId,
    currentState: awsStateToBoxState(stoppingInstance?.CurrentState?.Name),
    previousState: awsStateToBoxState(stoppingInstance?.PreviousState?.Name),
  };
}
