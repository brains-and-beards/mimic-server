interface IProject {
  readonly uuid: string;
  readonly name: string;
  readonly slug: string;
  readonly endpoints: ReadonlyArray<string>;
}
