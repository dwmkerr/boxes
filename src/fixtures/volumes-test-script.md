torrentbox (i-08fec1692931e31e7)
boxes debug test-detach i-08fec1692931e31e7
[
    {"volumeId":"vol-0582d7fc0f3d797fc","device":"/dev/xvda"},
    {"volumeId":"vol-0987a9ce9bb4c7b1d","device":"/dev/xvdf"}
]


AWS_REGION=us-west-2 aws ec2 create-snapshot --volume-id vol-0582d7fc0f3d797fc

//  detach...
aws ec2 detach-volume --volume-id vol-0582d7fc0f3d797fc >> ./src/fixtures/volumes-detach-volume1.json
aws ec2 detach-volume --volume-id vol-0987a9ce9bb4c7b1d >> ./src/fixtures/volumes-detach-volume2.json

//  snapshot...
aws ec2 create-snapshot --volume-id vol-0582d7fc0f3d797fc >> ./src/fixtures/create-snaphshot-volume1.json
aws ec2 create-snapshot --volume-id vol-0987a9ce9bb4c7b1d >> ./src/fixtures/create-snaphshot-volume2.json

//  delete - no response needs to be recorded for fixtures.
aws ec2 delete-volume --volume-id vol-0582d7fc0f3d797fc
aws ec2 delete-volume --volume-id vol-0987a9ce9bb4c7b1d
