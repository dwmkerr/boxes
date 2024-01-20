{
  aws: {
    region: configuration("string")
      .optional()
      .default(null)
      .fromConfigFile("aws/region")
      .fromParam("awsRegion");
  }
}
