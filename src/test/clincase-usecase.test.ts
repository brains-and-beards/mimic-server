import request from 'supertest-as-promised';

import Server from '../server';
import { startMimicServer } from './utils/helpers';

describe('Tests for Clincase case', () => {
  let server: Server | undefined;

  beforeAll(async () => {
    server = await startMimicServer();
  });

  afterAll(async () => {
    await server!.stopServerSync();
  });

  it('[POST] - Should return 200 on an auto-mocked POST request', async () => {
    const res = await request('http://localhost:3000/ePRO-test').post('/camepro/device').send({}).expect(200);
    expect(JSON.parse(res.text)).toEqual({ someField: 'unimportant value' });
  });
});
