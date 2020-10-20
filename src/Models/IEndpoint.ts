interface IEndpoint {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  readonly path: string;
  readonly projectId: string;
  readonly request: IRequest;
  readonly response: IResponse;
  readonly statusCode: number;
  readonly timeout: number;
  readonly uuid: string;
  readonly enable: boolean;
}
