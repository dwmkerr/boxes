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

The CLI uses the current local AWS configuration and will manage any EC2 instances with a tag named `boxes.boxid`. The value of the tag is the identifier used to manage the specific box.

## AWS Configuration

Boxes will use whatever is the currently set local AWS configuration.

Boxes manages EC2 instances that have a tag with the name `boxes.boxid`.

## TODO

Quick and dirty task-list.

- [ ] add support for OpenVPN server to save $10/month
- [ ] torrent box is not mounting larger volume for storage
