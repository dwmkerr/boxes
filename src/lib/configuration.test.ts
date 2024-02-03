import path from "path";
import mock from "mock-fs";
import { getConfiguration } from "./configuration";

describe("configuration", () => {
  //  Mock the config file.
  beforeEach(() => {
    const boxesPath = path.join(path.resolve(), "./boxes.json");
    mock({
      [boxesPath]: mock.load(
        path.join(path.resolve(), "./src/fixtures/boxes.json"),
      ),
    });
  });

  afterEach(() => {
    mock.restore();
  });

  test("can load configuration", async () => {
    const configuration = await getConfiguration();

    expect(configuration).toMatchObject({
      boxes: {
        steambox: {
          connectUrl: "dcv://${host}:8443",
          username: "Administrator",
          password: "<secret>",
          sshCommand: "open rdp://${host}",
          commands: {
            dcv: {
              command: "dcv://${host}:8443",
              copyCommand: "password",
            },
          },
        },
        torrentbox: {
          connectUrl: "http://${username}@${host}:9091/transmission/web/",
          username: "admin",
          password: "<secret>",
          sshCommand: "ssh -i ~/.ssh/mykey.pem ec2-user@${host}",
        },
      },
      commands: {
        ssh: {
          command: "ssh ${host}",
          copyCommand: "ssh ${host}",
        },
      },
      aws: {
        region: "us-west-2",
      },
    });
  });
});
