import request from 'supertest-as-promised';

import Server from '../server';
import { projectBasePath } from './utils/config';
import { startMimicServer } from './utils/helpers';

describe('Tests for testmocker.json - Disabled', () => {
  let server: Server | undefined;

  beforeAll(async () => {
    server = await startMimicServer();
  });

  afterAll(async () => {
    await server!.stopServerSync();
  });

  it('Should return 404 for disabled endpoint', async () => {
    await request(projectBasePath).get('/disabled').expect(404);
  });
});
