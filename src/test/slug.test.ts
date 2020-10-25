import request from 'supertest-as-promised';

import Server from '../server';
import { contentTypeText, projectSlugBasePath } from './utils/config';
import { startMimicServer } from './utils/helpers';

describe('Tests for testmocker.json - SLUG', () => {
  let server: Server | undefined;

  beforeAll(async () => {
    server = await startMimicServer();
  });

  afterAll(async () => {
    await server!.stopServerSync();
  });

  it('[SLUG] - Should return 404 for missing endpoint', async () => {
    const res = await request(projectSlugBasePath).get('/missing').expect(404);
    expect(res.text).toBe('URL endpoint not found');
  });
  it('[SLUG] - Should return 404 when using project name instead of slug', async () => {
    const res = await request('http://localhost:3000/slug_name_test')
      .get('/missing')
      .expect(404)
      .expect('Content-Type', contentTypeText);
    expect(res.text).toBe('Project "slug_name_test" not found');
  });
  it('[SLUG] - Should return 200 when using project slug', async () => {
    const res = await request(projectSlugBasePath).get('/test').expect(200).expect('Content-Type', contentTypeText);
    expect(res.text).toBe('slug test');
  });
});
