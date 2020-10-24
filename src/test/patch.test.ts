import request from 'supertest-as-promised';

import Server from '../server';
import {
  basePathWithoutProjectValue,
  contentTypeJSON,
  contentTypeText,
  projectBasePath,
  projectWithoutEndpointsBasePath,
} from './config';
import { startMimicServer } from './utils/helpers';

describe('Tests for testmocker.json - PATCH', () => {
  let server: Server | undefined;

  beforeAll(async () => {
    server = await startMimicServer();
  });

  afterAll(async () => {
    await server!.stopServerSync();
  });

  it('[PATCH] - Should return 200 for empty body', async () => {
    const res = await request(projectBasePath).patch('/empty').expect(200).expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(res.body).toEqual({});
  });
  it('[PATCH] - Should return 200 with object as body with specific string value', async () => {
    const res = await request(projectBasePath).patch('/object').expect(200).expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.hey).toBe('string');
    expect(res.body.hey).toBe('I am working');
  });
  it('[PATCH] - Should return 200 with object as body with specific number value', async () => {
    const res = await request(projectBasePath).patch('/object').expect(200).expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.num).toBe('number');
    expect(res.body.num).toBe(4);
  });
  it('[PATCH] - Should return 200 with object as body with specific boolean value', async () => {
    const res = await request(projectBasePath).patch('/object').expect(200).expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.valid).toBe('boolean');
    expect(res.body.valid).toBe(true);
  });
  it('[PATCH] - Should return 200 with raw response with specific string', async () => {
    const res = await request(projectBasePath).patch('/string').expect(200).expect('Content-Type', contentTypeText);
    expect(res.text).toBe('response');
  });
  it('[PATCH] - Should return 404', async () => {
    await request(projectBasePath).patch('/unknown').expect(404);
  });
  it('[PATCH - body request] - Should return 200 for empty body', async () => {
    const res = await request(projectBasePath)
      .patch('/empty')
      .send({ param: 'value' })
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(res.body).toEqual({});
  });
  it('[PATCH - body request] - Should return 200 with JSON response with body JSON request', async () => {
    const res = await request(projectBasePath)
      .patch('/object')
      .send({ param: 'value' })
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.hey).toBe('string');
    expect(res.body.hey).toBe('I am working with body');
  });
  it('[PATCH - body request] - Should return 200 with JSON response with specific number value', async () => {
    const res = await request(projectBasePath).patch('/num').expect(200).expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.num).toBe('number');
    expect(res.body.num).toBe(8);
  });
  it('[PATCH - body request] - Should return 200 with JSON response with specific boolean value', async () => {
    const res = await request(projectBasePath).patch('/object').expect(200).expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.valid).toBe('boolean');
    expect(res.body.valid).toBe(true);
  });
  it('[PATCH - body request] - Should return 200 with wrong parameters when fallback option available  - JSON response', async () => {
    await request(projectBasePath).patch('/object').send({ param: 'value1' }).expect(200);
  });
  it('[PATCH - body request] - Should return 200 with raw response with specific string', async () => {
    const res = await request(projectBasePath)
      .patch('/string')
      .send({ param: 'value' })
      .expect(200)
      .expect('Content-Type', contentTypeText);
    expect(res.text).toBe('response with params');
  });
  it('[PATCH - body request] - Should return 200 with wrong parameters when fallback option available  - raw response', async () => {
    await request(projectBasePath).patch('/string').send({ param: 'value1' }).expect(200);
  });
  it('[PATCH - body request] - Should return 404', async () => {
    await request(projectBasePath).patch('/unknown').send({ param: 'value1' }).expect(404);
  });
  it('[PATCH - no project value] - Should return 404', async () => {
    await request(basePathWithoutProjectValue).patch('/endpoint').expect(404);
  });
  it('[PATCH - project without endpoints] - Should return 404', async () => {
    await request(projectWithoutEndpointsBasePath).patch('/endpoint').expect(404);
  });
});
