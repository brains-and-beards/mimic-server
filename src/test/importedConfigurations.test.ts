import request from 'supertest-as-promised';

import { contentTypeText, importedConfigPath } from './config';

describe('Tests for importing configurations', () => {
  it('[GET] - Should return 200 imported endpoint', async () => {
    const res = await request(importedConfigPath).post('/test').expect(200).expect('Content-Type', contentTypeText);
    expect(res.text).toBe('test');
  });
  it('[GET] - Should return 200 when endpoint exist, but additional query params present', async () => {
    const res = await request(importedConfigPath)
      .post('/test?query=20')
      .expect(200)
      .expect('Content-Type', contentTypeText);
    expect(res.text).toBe('test');
  });
  it('[GET] - Should return 200 when endpoint exist, but additional body present', async () => {
    const res = await request(importedConfigPath)
      .post('/test')
      .send({ param: 'value' })
      .expect(200)
      .expect('Content-Type', contentTypeText);
    expect(res.text).toBe('test');
  });
  it('[GET] - Should return 404 for not existing imported project', async () => {
    const res = await request(importedConfigPath).post('/missing').expect(404);
  });
  it('[GET] - Should return 404 for disabled imported project', async () => {
    const res = await request(importedConfigPath).get('/disabled').expect(404);
  });
});
