interface IConfig {
  entities: {
    endpoints: Readonly<any>;
    projects: Readonly<any>;
    httpPort: number;
    httpsPort: number;
  };
  result: any;
}
