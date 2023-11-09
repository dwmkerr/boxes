# boxes

[![main](https://github.com/dwmkerr/boxes/actions/workflows/main.yml/badge.svg)](https://github.com/dwmkerr/boxes/actions/workflows/main.yml) ![npm (scoped)](https://img.shields.io/npm/v/%40dwmkerr/boxes) [![codecov](https://codecov.io/gh/dwmkerr/boxes/graph/badge.svg?token=uGVpjGFbDf)](https://codecov.io/gh/dwmkerr/boxes)

Quickly turn on, turn off, list and connect to your AWS instances. Great for saving costs by running servers in the cloud and starting them only when needed.

TODO demo recording

## Quickstart

Tag any AWS instance you want to control with a tag named `boxes.boxid`:

TODO smaller screenshot

![Screenshot: The AWS EC2 Instances console showing two boxes and the boxid tag](./docs/aws-instance-tags.png)

In this screenshot I have two instances tagged, one with the value `steambox` (used for gaming) and one with `torrentbox` (for fast BitTorrent downloads).

Install the Boxes CLI with:

```bash
npm install @dwmkerr/boxes
```

You can now list your boxes with `list` and start or stop them with `start` and `stop`:

![Screen recording: TODO]()

The following commands are available for `boxes`:

- [`boxes list`](#boxes-list) - shows all boxes and their status
- [`boxes start`](#boxes-list) - starts a box
- [`boxes stop`](#boxes-list) - stops a box
- [`boxes info`](#boxes-list) - shows info on a box
- [`boxes connect`](#boxes-list) - opens a box
- [`boxes ssh`](#boxes-list) - helps initiate an SSH connection to a box

### `boxes list`

Run `boxes list` to show the details of boxes:

```bash
$ boxes list
steambox: stopped
  Name: Steam Box
torrentbox: running
  Name: Torrent Box
  DNS: ec2-34-221-110-58.us-west-2.compute.amazonaws.com
  IP: 34.221.110.58
```

### `boxes start`

Run `boxes start <id>` to start a box:

```bash
$ boxes start steambox
  steambox (i-098e8d30d5e399b03): stopped -> pending
```

### `boxes stop`

Run `boxes start <id>` to stop a box:

```bash
$ boxes stop steambox
  steambox (i-098e8d30d5e399b03): running -> stopping
```

### `boxes info`

Run `boxes info <id>` to show detailed info on a box:

```bash
$ boxes info steambox
{
  boxId: 'steambox',
  instanceId: 'i-098e8d30d5e399b03',
  name: 'Steam Box',
  status: 'stopping',
  instance: {
    AmiLaunchIndex: 0,
    ImageId: 'ami-0fae5ac34f36d5963',
    InstanceId: 'i-098e8d30d5e399b03',
    InstanceType: 'g4ad.xlarge',
...
```

### `boxes connect`

The `boxes connect` command can be used to open an interface to a box. For this command to work, you need a `boxes.json` file that specifies _how_ to connect. As an example, the following configuration file shows how to connect to a Torrent Box:

```json
{
  "boxes": {
    "torrentbox": {
      "connectUrl": "http://${username}@${host}:9091/transmission/web/",
      "username": "dwmkerr"
    }
  }
}
```

When you run `boxes connect torrentbox` the `connectUrl` will be expanded with the actual hostname of the running instance, as well as any other parameters in the configuration file (such as the username). Pass the `--open` flag to open the connect URL directly:

```bash
% boxes connect --open torrentbox
{
  url: 'http://dwmkerr@ec2-34-221-110-58.us-west-2.compute.amazonaws.com:9091/transmission/web/',
  username: 'dwmkerr'
}
# the system configured browser will open with the url above...
```

### `boxes ssh`

The `boxes ssh` command can be used to quickly ssh into a box. Provide the ssh command that should be used in the `boxes.json` file:

```json
{
  "boxes": {
    "torrentbox": {
      "sshCommand": "ssh -i /Users/dwmkerr/repos/github/dwmkerr/dwmkerr/tf-aws-dwmkerr/dwmkerr_aws_key.pem ec2-user@${host}"
"
    }
  }
}
```

Running `boxes ssh torrentbox` will expand the command with the host. You can then copy the output and paste into the shell, or run a new shell with this output directly:


```bash
% bash -c "${boxes ssh torrentbox}"
Last login: Thu Nov  9 06:13:09 2023 from 135-180-121-112.fiber.dynamic.sonic.net
...
```

## Developer Guide

Clone the repo, install dependencies, link, then the `boxes` command will be available:

```bash
git clone git@github.com:dwmkerr/boxes.git
# optionally use the latest node with:
# nvm use --lts
npm install
npm link

# Now run boxes commands such as:
boxes list

# Clean up when you are done...
npm unlink
```

The CLI uses the current local AWS configuration and will manage any EC2 instances with a tag named `boxes.boxid`. The value of the tag is the identifier used to manage the specific box.

## AWS Configuration

Boxes will use whatever is the currently set local AWS configuration.

Boxes manages EC2 instances that have a tag with the name `boxes.boxid`.

## Terminal Recording / asciinema

The recording at the top of the README file is an SVG based on an [asciinema](https://asciinema.org/) recording that has been converted to SVG with [svg-term-cli](https://github.com/marionebl/svg-term-cli).

To update the recording:

1. Install asciinema `brew install asciinema`

To record a Tmux session, you will need to start _detached_ from Tmux and then attach. You can do this by hand, simply using `tmux attach`, but this adds some noise to the beginning of the recording. A better way is to use the command below:

```bash
asciinema rec --command "tmux attach [-t session-name]"
```

## Dependencies

Runtime dependencies are:

- `@aws-sdk/client-ec2` - AWS APIs
- `colors` - to add colour to console output
- `commander` - for quickly scaffold CLI apps
- `open` - to open browsers / applications cross-platform

## TODO

Quick and dirty task-list.

- [x] npm badge download link
- [x] bug: package.json path
- [x] build / lint / test / deploy pipeline
- [ ] screen recording of boxes list / stop / start / connect
- [ ] document how 'connect' works
- [ ] feat: ssh connect
- [ ] docs: make AWS screenshot a bit smaller in readme
- [ ] Cost management tags configuration to allow pricing info
- [ ] docs: create and share blogpost
- [ ] refactor: extract and test the parameter expansion for 'connect'
- [ ] add support for OpenVPN server to save $10/month
