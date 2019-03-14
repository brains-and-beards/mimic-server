interface IExternalProject {
  readonly uuid: string;
  readonly name: string;
  readonly endpoints: ReadonlyArray<IEndpoint>;
}
