interface IProject {
  readonly endpoints: ReadonlyArray<IEndpoint>;
  readonly name: string;
  readonly urlPrefix: string;
  readonly uuid: string;
}
