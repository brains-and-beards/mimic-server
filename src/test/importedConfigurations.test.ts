import request from 'supertest-as-promised';
import {
  importedConfigPath,
  contentTypeText,
} from './config';

describe('Tests for importing configurations', () => {
  it('[GET] - Should return 200 imported endpoint', async () => {
    const res = await request(importedConfigPath)
      .get('/test')
      .expect(200)
      .expect('Content-Type', contentTypeText);
    expect(res.text).toBe('test');
  });
  it('[GET] - Should return 404 for not existing imported project', async () => {
    const res = await request(importedConfigPath)
      .get('/missing')
      .expect(404)
  });
  it('[GET] - Should return 404 for disabled imported project', async () => {
    const res = await request(importedConfigPath)
      .get('/disabled')
      .expect(404)
  });
});
