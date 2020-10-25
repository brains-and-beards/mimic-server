import request from 'supertest-as-promised';

import Server from '../server';
import {
  basePathWithoutProjectValue,
  contentTypeJSON,
  contentTypeText,
  projectBasePath,
  projectWithoutEndpointsBasePath,
} from './utils/config';
import { startMimicServer } from './utils/helpers';

describe('Tests for testmocker.json - GET', () => {
  let server: Server | undefined;

  beforeAll(async () => {
    server = await startMimicServer();
  });

  afterAll(async () => {
    await server!.stopServerSync();
  });

  it('[PUT] - Should return 200 with empty body', async () => {
    const res = await request(projectBasePath)
      .put('/empty')
      .send({ data: 'value' })
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(res.body).toEqual({});
  });

  it('[PUT - send JSON] - Should return 200 with JSON response and with specific string value', async () => {
    const res = await request(projectBasePath)
      .put('/object')
      .send({ data: 'value' })
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.hey).toBe('string');
    expect(res.body.hey).toBe('I am working');
  });

  it('[PUT - send raw] - Should return 200 with JSON response and with specific string value', async () => {
    const res = await request(projectBasePath)
      .put('/object')
      .send('raw text')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.hey).toBe('string');
    expect(res.body.hey).toBe('I am working with raw data');
  });

  it('[PUT - send JSON] - Should return 200 with JSON response and with specific number value', async () => {
    const res = await request(projectBasePath)
      .put('/object')
      .send({ data: 'value' })
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.num).toBe('number');
    expect(res.body.num).toBe(4);
  });

  it('[PUT - send raw] - Should return 200 with JSON response and with specific number value', async () => {
    const res = await request(projectBasePath)
      .put('/object')
      .send('raw text')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.num).toBe('number');
    expect(res.body.num).toBe(8);
  });

  it('[PUT - send JSON] - Should return 200 with JSON response and with specific boolean value', async () => {
    const res = await request(projectBasePath)
      .put('/object')
      .send({ data: 'value' })
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.valid).toBe('boolean');
    expect(res.body.valid).toBe(true);
  });

  it('[PUT - send raw] - Should return 200 with JSON response and with specific boolean value', async () => {
    const res = await request(projectBasePath)
      .put('/object')
      .send('raw text')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.valid).toBe('boolean');
    expect(res.body.valid).toBe(false);
  });

  it('[PUT - send JSON] - Should return 200 with raw response and with specific string', async () => {
    const res = await request(projectBasePath)
      .put('/string')
      .send({ data: 'value' })
      .expect(200)
      .expect('Content-Type', contentTypeText);
    expect(res.text).toBe('response');
  });

  it('[PUT - send raw] - Should return 200 with raw response and with specific string', async () => {
    const res = await request(projectBasePath)
      .put('/string')
      .send('raw text')
      .expect(200)
      .expect('Content-Type', contentTypeText);
    expect(res.text).toBe('response with raw request');
  });

  it('[PUT] - Should return 404', async () => {
    await request(projectBasePath).put('/unknown').expect(404);
  });

  it('[PUT - send JSON] - Should return 200 with wrong request data', async () => {
    await request(projectBasePath).put('/object').send({ data: 'wrong value' }).expect(200);
  });

  it('[PUT - send raw] - Should return 200 with wrong request data', async () => {
    await request(projectBasePath).put('/object').send('wrong raw text').expect(200);
  });

  it('[PUT] - Should return 404', async () => {
    await request(projectBasePath).put('/unknown').expect(404);
  });

  it('[PUT - send JSON] - Should return 404', async () => {
    await request(projectBasePath).put('/unknown').send({ data: 'wrong value' }).expect(404);
  });

  it('[PUT - send raw] - Should return 404', async () => {
    await request(projectBasePath).put('/unknown').send('wrong raw text').expect(404);
  });

  it('[PUT - no project value] - Should return 404', async () => {
    await request(basePathWithoutProjectValue).put('/endpoint').expect(404);
  });

  it('[PUT - project without endpoints] - Should return 404', async () => {
    await request(projectWithoutEndpointsBasePath).put('/endpoint').expect(404);
  });
});
