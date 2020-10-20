import request from 'supertest-as-promised';

import { projectBasePath } from './config';

describe('Tests for testmocker.json - Disabled', () => {
  it('Should return 404 for disabled endpoint', async () => {
    await request(projectBasePath).get('/disabled').expect(404);
  });
});
