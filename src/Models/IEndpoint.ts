interface IEndpoint {
  readonly uuid: string;
  readonly path: string;
  readonly request: IRequest;
  readonly response: IResponse;
  readonly statusCode: number;
  readonly timeout: number;
}
