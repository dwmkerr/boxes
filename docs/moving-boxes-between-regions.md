# Moving Boxes Between Regions

Migrate a box to a different AWS region for lower latency.

## Prerequisites

- Box must be **stopped** (or use `--no-reboot` for live migration)
- AWS CLI configured with appropriate permissions

## Step 1: Set Variables

```bash
BOX_NAME="ubuntu"
SOURCE_REGION="us-west-2"
TARGET_REGION="eu-west-1"

# Get instance ID from AWS using box name tag
INSTANCE_ID=$(aws ec2 describe-instances \
  --region $SOURCE_REGION \
  --filters "Name=tag:boxes.boxid,Values=$BOX_NAME" \
  --query 'Reservations[0].Instances[0].InstanceId' --output text)

echo "Box: $BOX_NAME -> Instance: $INSTANCE_ID"
```

## Step 2: Stop and Create AMI

```bash
# Stop the box first (recommended for consistency)
boxes stop $BOX_NAME --wait

# Create AMI
AMI_ID=$(aws ec2 create-image \
  --region $SOURCE_REGION \
  --instance-id $INSTANCE_ID \
  --name "${BOX_NAME}-migration-$(date +%Y%m%d)" \
  --no-reboot \
  --query 'ImageId' --output text)

echo "Created AMI: $AMI_ID"

# Wait for AMI to be available
aws ec2 wait image-available --region $SOURCE_REGION --image-ids $AMI_ID
```

## Step 3: Copy AMI to Target Region

```bash
NEW_AMI_ID=$(aws ec2 copy-image \
  --region $TARGET_REGION \
  --source-region $SOURCE_REGION \
  --source-image-id $AMI_ID \
  --name "${BOX_NAME}-${TARGET_REGION}" \
  --query 'ImageId' --output text)

echo "Copying to $TARGET_REGION: $NEW_AMI_ID"

# Wait for copy to complete (~5-15 mins for 20GB)
aws ec2 wait image-available --region $TARGET_REGION --image-ids $NEW_AMI_ID
```

## Step 4: Launch in Target Region

```bash
# Get your key pair and security group in target region (create if needed)
KEY_NAME="boxes"
SECURITY_GROUP="boxes-sg"

# Launch instance
NEW_INSTANCE_ID=$(aws ec2 run-instances \
  --region $TARGET_REGION \
  --image-id $NEW_AMI_ID \
  --instance-type t3.medium \
  --key-name $KEY_NAME \
  --security-groups $SECURITY_GROUP \
  --query 'Instances[0].InstanceId' --output text)

echo "Launched: $NEW_INSTANCE_ID"

# Import to boxes
boxes import $NEW_INSTANCE_ID $BOX_NAME --region $TARGET_REGION
```

## Step 5: Update Config

Add region to the box in `boxes.json`:

```bash
# Using jq to update the region
jq --arg region "$TARGET_REGION" \
  '.boxes.ubuntu.region = $region' boxes.json > tmp.json && mv tmp.json boxes.json
```

Or manually:

```json
{
  "boxes": {
    "ubuntu": {
      "region": "eu-west-1",
      "commands": { ... }
    }
  }
}
```

## Step 6: Cleanup Old Region

```bash
# Terminate old instance
aws ec2 terminate-instances --region $SOURCE_REGION --instance-ids $INSTANCE_ID

# Delete source AMI
aws ec2 deregister-image --region $SOURCE_REGION --image-id $AMI_ID

# Delete associated snapshot
SNAPSHOT_ID=$(aws ec2 describe-images --region $SOURCE_REGION --image-ids $AMI_ID \
  --query 'Images[0].BlockDeviceMappings[0].Ebs.SnapshotId' --output text 2>/dev/null)
aws ec2 delete-snapshot --region $SOURCE_REGION --snapshot-id $SNAPSHOT_ID 2>/dev/null

# Optionally delete target region AMI too (instance has its own volume now)
aws ec2 deregister-image --region $TARGET_REGION --image-id $NEW_AMI_ID
```

## Cost

| Item | Cost |
|------|------|
| AMI copy (20GB) | ~$0.40 one-time |
| Double storage during migration | ~$1/month |
| Instance in new region | Same as before |
