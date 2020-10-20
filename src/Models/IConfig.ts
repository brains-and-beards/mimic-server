interface IConfig {
  entities: {
    endpoints: Readonly<any>;
    projects: Readonly<any>;
  };
  result: {
    httpPort: number;
    httpsPort: number;
  };
}
