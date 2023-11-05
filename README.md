# boxes

Quick access to your cloud instances.

## Work in Progress

This is a simple CLI I use to control a few of my cloud instances, such as an OpenVPN server, a box with Steam installed for gaming, a box for torrents and so on.

This is a personal project but it is possible with a few adaptations you might be able to use it to manage your own instances. In time I may add more functionality to the project.

## Quickstart

Clone the repo, install dependencies, link, then the `boxes` command will be available:

```bash
git clone git@github.com:dwmkerr/boxes.git
npm link

# Now run boxes commands such as:
boxes list

# Clean up when you are done...
npm unlink
```

The CLI uses the current local AWS configuration and will manage any EC2 instances with the tag `boxes.cluster` that have the value `boxes`.

## AWS Configuration

Boxes will use whatever is the currently set local AWS configuration.

Boxes manages EC2 instances that have the `boxes.cluster` tag set. The following tags are used:

| Tag             | Usage                                                                |
|-----------------|----------------------------------------------------------------------|
| `boxes.cluster` | Used to group boxes resources into a 'cluster' of related resources. |
| `boxes.boxid`   | The identifier of the box.                                           |

The Boxes CLI defaults to managing boxes with a cluster name of `boxes` by default.

## TODO

Quick and dirty task-list.

- [ ] add support for openvpn server to save $10/month
