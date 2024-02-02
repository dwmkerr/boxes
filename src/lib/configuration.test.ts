import path from "path";
import mock from "mock-fs";
import { getConfiguration } from "./configuration";

describe("configuration", () => {
  //  Mock the config file.
  beforeEach(() => {
    const boxesPath = path.join(path.resolve(), "./boxes.json");
    console.log("Mocking config at", boxesPath);
    mock({
      [boxesPath]: mock.load(
        path.join(path.resolve(), "./src/fixtures/boxes.json"),
      ),
    });
  });

  afterEach(() => {
    mock.restore();
  });

  test("can load configuration", () => {
    const configuration = getConfiguration();

    expect(configuration).toMatchObject({
      boxes: {
        steambox: {
          connectUrl: "dcv://${host}:8443",
          username: "Administrator",
          password: "<secret>",
          sshCommand: "open rdp://${host}",
        },
        torrentbox: {
          connectUrl: "http://${username}@${host}:9091/transmission/web/",
          username: "admin",
          password: "<secret>",
          sshCommand: "ssh -i ~/.ssh/mykey.pem ec2-user@${host}",
        },
      },
      aws: {
        region: "us-west-2",
      },
    });
  });
});
