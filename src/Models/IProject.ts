interface IProject {
  readonly uuid: string;
  readonly name: string;
  readonly endpoints: ReadonlyArray<IEndpoint>;
}
