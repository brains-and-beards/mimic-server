import request from 'supertest-as-promised';
import {
  projectBasePath,
  contentTypeJSON,
  contentTypeText,
  basePathWithoutProjectValue,
  projectWithoutEndpointsBasePath,
} from './config';

describe('Tests for testmocker.json - PATCH', () => {
  it('[PATCH] - Should return 200 for empty body', async () => {
    const res = await request(projectBasePath)
      .patch('/empty')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(res.body).toEqual({});
  });
  it('[PATCH] - Should return 200 with object as body with specific string value', async () => {
    const res = await request(projectBasePath)
      .patch('/object')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.hey).toBe('string');
    expect(res.body.hey).toBe('I am working');
  });
  it('[PATCH] - Should return 200 with object as body with specific number value', async () => {
    const res = await request(projectBasePath)
      .patch('/object')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.num).toBe('number');
    expect(res.body.num).toBe(4);
  });
  it('[PATCH] - Should return 200 with object as body with specific boolean value', async () => {
    const res = await request(projectBasePath)
      .patch('/object')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.valid).toBe('boolean');
    expect(res.body.valid).toBe(true);
  });
  it('[PATCH] - Should return 200 with raw response with specific string', async () => {
    const res = await request(projectBasePath)
      .patch('/string')
      .expect(200)
      .expect('Content-Type', contentTypeText);
    expect(res.text).toBe('response');
  });
  it('[PATCH] - Should return 404', async () => {
    const res = await request(projectBasePath)
      .patch('/unknown')
      .expect(404);
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
    const res = await request(projectBasePath)
      .patch('/object')
      .send({ param: 'value' })
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.num).toBe('number');
    expect(res.body.num).toBe(8);
  });
  it('[PATCH - body request] - Should return 200 with JSON response with specific boolean value', async () => {
    const res = await request(projectBasePath)
      .patch('/object')
      .send({ param: 'value' })
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.valid).toBe('boolean');
    expect(res.body.valid).toBe(false);
  });
  it('[PATCH - body request] - Should return 404 with wrong parameters - JSON response', async () => {
    const res = await request(projectBasePath)
      .patch('/object')
      .send({ param: 'value1' })
      .expect(404);
  });
  it('[PATCH - body request] - Should return 200 with raw response with specific string', async () => {
    const res = await request(projectBasePath)
      .patch('/string')
      .send({ param: 'value' })
      .expect(200)
      .expect('Content-Type', contentTypeText);
    expect(res.text).toBe('response with params');
  });
  it('[PATCH - body request] - Should return 404 with wrong request body - raw response', async () => {
    const res = await request(projectBasePath)
      .patch('/string')
      .send({ param: 'value1' })
      .expect(404);
  });
  it('[PATCH - body request] - Should return 404', async () => {
    const res = await request(projectBasePath)
      .patch('/unknown')
      .send({ param: 'value1' })
      .expect(404);
  });
  it('[PATCH - no project value] - Should return 404', async () => {
    const res = await request(basePathWithoutProjectValue)
      .patch('/endpoint')
      .expect(404);
  });
  it('[PATCH - project without endpoints] - Should return 404', async () => {
    const res = await request(projectWithoutEndpointsBasePath)
      .patch('/endpoint')
      .expect(404);
  });
});