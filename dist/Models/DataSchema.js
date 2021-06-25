"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigSchema = exports.ProjectSchema = exports.EndpointSchema = void 0;
const normalizr_1 = require("normalizr");
exports.EndpointSchema = new normalizr_1.schema.Entity('endpoints', {}, { idAttribute: 'uuid', processStrategy: (value, parent, key) => (Object.assign(Object.assign({}, value), { projectId: parent.uuid })) });
exports.ProjectSchema = new normalizr_1.schema.Entity('projects', {
    endpoints: [exports.EndpointSchema],
}, { idAttribute: 'uuid' });
exports.ConfigSchema = { projects: new normalizr_1.schema.Array(exports.ProjectSchema) };
//# sourceMappingURL=DataSchema.js.map