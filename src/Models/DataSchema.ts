import { schema } from 'normalizr';

export const EndpointSchema = new schema.Entity(
  'endpoints',
  {},
  { idAttribute: 'uuid', processStrategy: (value, parent, key) => ({ ...value, projectId: parent.uuid }) }
);
export const ProjectSchema = new schema.Entity(
  'projects',
  {
    endpoints: [EndpointSchema],
  },
  { idAttribute: 'uuid' }
);
export const ConfigSchema = { projects: new schema.Array(ProjectSchema) };
