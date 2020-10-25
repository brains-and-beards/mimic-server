import request from 'supertest-as-promised';

import basicConfig from '../../testmocker.json';
import Server from '../server';
import { startMimicServer } from './utils/helpers';

const dynamicProjectSlug = 'dynamic-config-switch';
const dynamicNewConfigPath = 'http://localhost:3000/' + dynamicProjectSlug;
const dynamicProject = {
  uuid: 'a0ed89c9-b5b9-4ecf-817c-c367b4a4be30',
  name: 'dynamic config switch',
  slug: dynamicProjectSlug,
  endpoints: [
    {
      uuid: 's0m3-ID',
      path: '/example',
      method: 'GET',
      response: 'dynami mock test',
      request: { body: {}, params: '' },
      statusCode: 200,
      timeout: 0,
      enable: true,
    },
  ],
};
const dynamicConfig = { ...basicConfig, projects: [dynamicProject] };

describe('Switching configurations dynamically', () => {
  let server: Server | undefined;

  beforeAll(async () => {
    server = await startMimicServer();
  });

  afterAll(async () => {
    await server!.stopServerSync();
  });

  it('Should return 200 from a new endpoint after config switch', async () => {
    server!.switchConfig(dynamicConfig);
    await request(dynamicNewConfigPath).get('/example').expect(200);
  });
});
