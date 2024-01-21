import { Tag } from "@aws-sdk/client-ec2";

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
