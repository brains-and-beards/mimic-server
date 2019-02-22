interface IConfig {
  entities: {
    endpoints: ReadonlyArray<IEndpoint>;
    projects: ReadonlyArray<IProject>;
    externalProjects: ReadonlyArray<IProject>;
  };
  result: {
    httpPort: number;
    httpsPort: number;
  };
}
