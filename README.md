# boxes

[![main](https://github.com/dwmkerr/boxes/actions/workflows/main.yml/badge.svg)](https://github.com/dwmkerr/boxes/actions/workflows/main.yml) ![npm (scoped)](https://img.shields.io/npm/v/%40dwmkerr/boxes) [![codecov](https://codecov.io/gh/dwmkerr/boxes/graph/badge.svg?token=uGVpjGFbDf)](https://codecov.io/gh/dwmkerr/boxes)

Quickly turn on, turn off, list, show costs and connect to your AWS instances. Great for saving costs by running servers in the cloud and starting them only when needed.

![Recording of a terminal session that shows the boxes CLI in action](./docs/democast.svg)

## Quickstart

Tag any AWS instance you want to control with a tag named `boxes.boxid`:

<img alt="Screenshot: The AWS EC2 Instances console showing two boxes and the boxid tag" src="https://github.com/dwmkerr/boxes/raw/main/docs/aws-instance-tags.png" width="480">

In this screenshot I have two instances tagged, one with the value `steambox` (used for gaming) and one with `torrentbox` (for fast BitTorrent downloads).

If you want to be able to report on costs, follow the instructions at [Enabling Cost Reporting](#enabling-cost-reporting).

Install the Boxes CLI with:

```bash
npm install @dwmkerr/boxes
```

The following commands are available for `boxes`:

- [`boxes list`](#boxes-list) - shows all boxes and their status
- [`boxes run`](#boxes-run) - run a command on a box
- [`boxes start`](#boxes-list) - starts a box
- [`boxes stop`](#boxes-list) - stops a box
- [`boxes info`](#boxes-list) - shows info on a box
- [`boxes costs`](#boxes-costs) - shows the costs accrued by each both this month
- [`boxes import`](#boxes-import) - import and AWS instance and tag as a box

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

### `boxes run`

The `run` command can be used to run any configured operation on a box. You can use it to quickly SSH into boxes, open pages in a browser or run any other command that can be run from a shell. Commands themselves are defined in the configuration file, either at the level of a box or globally for all boxes.

The syntax to run a command is below:

```
boxes run <boxId> <commandName> <parameters...>
```

Commands can be executed by providing the `-e` or `--exec` flag, and commands can copy data to the clipboard with the `-c` or `--copy-command` parameter.

Some examples for the configuration file are:


```
{
  "ssh": {
    "command": "ssh -i ${identity} ec2-user@${host} ${*}",
    "copyCommand": "ssh -i ${identity} ec2-user@${host} ${*}"
    "parameters": {
      "identity": "mykey.pem "
  },
  "dcv": {
    "command": "open -i mykey.pem dcv://Administrator@${host}:8443",
    "copyCommand": "${password}"
    "parameters": {
      "password": "<password>"
    }
  }
}
```

To SSH into a box and run `whoami` use:

```
boxes run ubuntu ssh 'whoami' -e
```

This will execute the `ssh` command. Pass `-c` to also copy that SSH command to the clipboard.

To open a DCV application to connect to a box use:

```
boxes run steambox dcv 'whoami' -ec
```

This will open the user's DCV app and copy a password to the clipboard.

Parameters for commands can be specified in the commands configuration or provided as arguments to the `run` command. Some parameter examples are:

| Parameter                   | Description                                               |
|-----------------------------|-----------------------------------------------------------|
| `${password}`               | The value of the `password` parameter in the config file. |
| `${0:user}`                 | The value of the first argument, which is called `user`.  |
| `${*}`                      | All arguments passed to the `run` command.                |
| `${instance.PublicDnsName}` | The host name of the AWS instance.                        |
| `${host}`                   | Shorthand for `${instance.PublicDnsName}`.                |
| `${ip}`                     | Shorthand for `${instance.PublicIpAddress}`.              |

Any of the variables on the AWS Instance object can be provided with an `instance` parameter, such as `${instance.PublicDnsName}`. Nested parameters from the AWS Instance are not yet supported.

Options:

- `--exec`: run the command in the current shell
- `--copy-command`: copy the `copyCommand` from the command configuration to the clipboard

Be cautious with the `--copy-command` parameter as the copy command will be shown in the console.

### `boxes start`

Run `boxes start <id>` to start a box:

```bash
$ boxes start steambox
  steambox (i-098e8d30d5e399b03): stopped -> pending
```

Options:

- `--wait`: wait for instance to complete startup
- `--yes`: [experimental] confirm restoration of archived volumes

Note that the restoration of archived volumes option is experimental and may cause data loss.

### `boxes stop`

Run `boxes start <id>` to stop a box:

```bash
$ boxes stop steambox
  steambox (i-098e8d30d5e399b03): running -> stopping
```

Options:

- `--wait`: wait for instance to complete shutdown
- `--archive-volumes`: [experimental] detach, snapshot and delete instance volumes

Note that the `--archive-volumes` option is experimental and may cause data loss.

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

### `boxes costs`

The `boxes costs` command shows the current costs accrued for each both this month. Note that calling the AWS API that gets these costs comes with a charge of $0.01 per call (at time of writing). To continue with the charge, pass the `--yes` parameter to this command.

You must ensure that the `boxes.boxId` tag is set up as a [Cost Allocation Tag](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html) for costs to be reported, more information is at [Enabling Cost Reporting](#enabling-cost-reporting).

```bash
% boxes costs --yes
steambox: stopped
  Costs (this month): ~ 0.53 USD
torrentbox: stopped
  Costs (this month): ~ 0.05 USD
Non-box costs
  Costs (this month): ~ 36.92 USD
```

Additional parameters for `costs` are available:

| Parameter               | Description                                       |
|-------------------------|---------------------------------------------------|
| `-m`, `--month <month>` | Get costs for a specific month. 1=Jan, 2=Feb etc. |

### `boxes config`

Shows the current configuration that has been loaded for `boxes`. Can be helpful for troubleshooting whether things like the region are set properly:

```bash
% boxes config
{
  "boxes": ...
  "aws": {
    "region": "us-west-2"
  }
}
```

### `boxes import`

Imports an AWS instance and tags as a box, also tags its attached volumes.

```bash
% boxes import i-066771b1f0f0668af ubuntubox
  ubox (i-066771b1f0f0668af): imported successfully
```

Options:

- `--overwrite`: overwrite tags on existing instances/volumes

## Configuration

A local `boxes.json` file can be used for configuration. The following values are supported:

```
{
  "boxes": {
    /* box configuration */
  },
  "aws": {
    "region": "us-west-2"
  },
  "archiveVolumesOnStop": true,
  "debugEnable": "boxes*"
}
```

Box configuration is evolving rapidly and the documentation will be updated. The AWS configuration is more stable.

## Enabling Cost Reporting

If you want to be able to show the costs that are associated with each box, you will need to:

1. Tag each box and the resources associated with the box with the `boxes.boxid` tag
2. Activate the `boxes.boxid` tag as a cost allocation tag
3. Re-create all of the resources associated with the tag, so that AWS starts collecting cost information
4. Wait 24 hours for AWS to start processing data

## AWS Configuration

Boxes will use whatever is the currently set local AWS configuration.

Boxes manages EC2 instances that have a tag with the name `boxes.boxid`.

## Managing and Reducing Costs

As long as you have followed the [Enable Cost Reporting](#enabling-cost-reporting) guide, then most of the costs associated with a box should be tracked. However, some costs which seem to not be tracked but potentially can be material are:

- EBS instances

### Snapshot Storage

When you turn off EC2 instances, EBS devices will still be attached. Although the instance will no longer accrue charges, you EBS devices will.

To save costs, you can detach EBS devices from stopped instances, snapshot it, delete the device, then re-create the device and re-attach as needed before you restart the instance. However, this is fiddle and time consuming.

Boxes can take care of this for you - when you stop a box, just pass the `-d` or `--detach-and-archive` flag to detach and block storage devices. They will be snapshotted and boxes will restore and re-attach the devices automatically when you restart them.

Boxes puts tags on the instance to track the details of the devices which must be restored - not that if you restart the instance yourself you will have to recreate the devices yourself too, so detaching/archiving is easier if you only use Boxes to manage the device.

## Developer Guide

Clone the repo, install dependencies, build, link, then the `boxes` command will be available:

```bash
git clone git@github.com:dwmkerr/boxes.git
# optionally use the latest node with:
# nvm use --lts
npm install
npm run build
npm link boxes # link the 'boxes' command.

# Now run boxes commands such as:
boxes list

# Clean up when you are done...
npm unlink
```

The CLI uses the current local AWS configuration and will manage any EC2 instances with a tag named `boxes.boxid`. The value of the tag is the identifier used to manage the specific box.

Note that you will need to rebuild the code if you change it, so run `npm run build` before using the `boxes` alias. A quick way to do this is to run:

```bash
npm run relink
```

If you are developing and would like to run the `boxes` command without relinking, just build, link, then run:

```bash
npm run build:watch
```

This will keep the `./build` folder up-to-date and the `boxes` command will use the latest compiled code. This will *sometimes* work but it might miss certain changes, so `relink` is the safer option. `build:watch` works well if you are making small changes to existing files, but not if you are adding new files (it seems).

### Debugging

The [`debug`](https://github.com/debug-js/debug) library is used to make it easy to provide debug level output. Debug logging to the console can be enabled with:

```bash
DEBUG='boxes*' boxes list
```

### Error Handling

To show a warning and terminate the application, throw a `TerminatingWarning` error:

```js
import { TerminatingWarning } from "./errors.js";
throw new TerminatingWarning("Your AWS profile is not set");
```

### Terminal Recording / asciinema

To create a terminal recording for the documentation:

- Install [asciinema](https://asciinema.org/) `brew install asciinema`
- Check that you have your profiles setup as documented in `./scripts/record-demo.sh`
- Run the script to start a 'clean' terminal `./scripts/record-demo.sh`
- Download your recording, e.g. to `./docs/620124.cast`
- Install [svg-term-cli](https://github.com/marionebl/svg-term-cli) `npm install -g svg-term-cli`
- Convert to SVG: `svg-term --in ./docs/620124.cast --out docs/democast.svg --window --no-cursor --from=1000`

The demo script is currently:

- `boxes ls`
- `boxes start steambox`
- `boxes costs --yes`
- `boxes ssh torrentbox`
- `boxes stop steambox`
- `boxes ls`

### Dependencies

Runtime dependencies are:

- `@aws-sdk/client-ec2` - AWS APIs
- `colors` - to add colour to console output
- `commander` - to quickly scaffold CLI apps
- `open` - to open browsers / applications cross-platform

Development dependencies:

- [`aws-sdk-client-mock-jest`](https://github.com/m-radzikowski/aws-sdk-client-mock) mocks for the AWS V3 CLI as well as matchers for Jest

### Troubleshooting

`Argument of type... Types of property '...' are incompatible`

Typically occurs if AWS SDK packages are not at the exact same number as the `@ask-sdk/types` version number. Update the package.json to use exactly the same version between all `@aws-sdk` libraries. Occasionally these libraries are still incompatible, in this case downgrade to a confirmed version that works such as `3.10.0`.

## TODO

Quick and dirty task-list.

### Alpha

- [ ] don't colorise output when non-terminal, e.g. run `watch -n 5 boxes ls` to see bug
- [x] feat: archive volumes by default flag in config
- [ ] refactor: use node-configuration
- [x] feat: 'import' option to tag a box and associated volumes
- [x] refactor: check use of 'interface' which should be 'type'
- [ ] testing: check ubox cost allocation tags for volumes
- [ ] refactor: rename all 'archive' to 'archive volumes'? Also check against what we will call 'Load/Unload'

### Beta

- [x] 'wait' flag for start/stop to wait until operation complete - default to 1hr and document the timeout info

### Publish Blog

- [ ] documentation on cost savings via archival

### Later

- [ ] refactor: 'wait' functions can be generalised to take a predicate that uses AWS calls and then share the same loop/logging/etc
- [ ] feat: boxes aws-console opens link eg (https://us-west-2.console.aws.amazon.com/ec2/home?region=us-west-2#InstanceDetails:instanceId=i-043a3c1ce6c9ea6ad)
- [ ] refactor: make 'debug' command local/debug build only?
- [ ] feat: 'import' command to take an instance ID and create local box config for it and tag the instance
- [ ] docs: cost allocation tags blog post
- [ ] docs: create and share blogpost
- [ ] docs: blog post showing step-by-step how to enable cost reporting, add the link to the docs here
- [ ] refactor: extract and test the parameter expansion for 'connect'
- [ ] feat: autocomplete
- [ ] feat: aws profile in config file
- [ ] epic: 'boxes create' to create from a template
- [ ] refactor: find a better way to mock / inject config (rather than importing arbitrarily)
- [ ] feat(import): save/update local config file

### Epic - Interactive Setup

Run `boxes init` - lets you choose a region, select instances, give a name.
Will add the tags - but will also add the tags to the volumes and will notify if the cost explorer tag is not setup.
Creates the local config.

This would be demo-able.

### Epic - Load/Unload

- [ ] feat: unload box to AMI image
- [ ] feat: create box from AMI image
- [ ] feat: cross-region support? Example: move steambox to Australia or UK

### Epic - Interactive Commands

Run `boxes` to run commands interactively.

### Fix - Costs

Show month/year before report
Check 'other' values, should actually be assigned to EC2-other but for the box
