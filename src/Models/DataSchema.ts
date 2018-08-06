import { schema } from 'normalizr';

export const ResponseSchema = new schema.Entity('response');
export const RequestSchema = new schema.Entity('request');
export const EndpointSchema = new schema.Entity('endpoints', {
  response: ResponseSchema,
  request: RequestSchema,
});
export const ProjectSchema = new schema.Entity('project', {
  endpoints: [EndpointSchema],
});
export const ConfigSchema = new schema.Array(ProjectSchema);
