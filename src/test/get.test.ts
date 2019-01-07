import request from 'supertest-as-promised';
import {
  projectBasePath,
  contentTypeJSON,
  contentTypeText,
  basePathWithoutProjectValue,
  projectWithoutEndpointsBasePath,
} from './config';

describe('Tests for testmocker.json - GET', () => {
  it('[GET] - Should return 200 for empty body', async () => {
    const res = await request(projectBasePath)
      .get('/empty')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(res.body).toEqual({});
  });
  it('[GET] - Should return 200 with object as body with specific string value', async () => {
    const res = await request(projectBasePath)
      .get('/object')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.hey).toBe('string');
    expect(res.body.hey).toBe('I am working');
  });
  it('[GET] - Should return 200 with object as body with specific number value', async () => {
    const res = await request(projectBasePath)
      .get('/object')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.num).toBe('number');
    expect(res.body.num).toBe(4);
  });
  it('[GET] - Should return 200 with object as body with specific boolean value', async () => {
    const res = await request(projectBasePath)
      .get('/object')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.valid).toBe('boolean');
    expect(res.body.valid).toBe(true);
  });
  it('[GET] - Should return 200 with raw response with specific string', async () => {
    const res = await request(projectBasePath)
      .get('/string')
      .expect(200)
      .expect('Content-Type', contentTypeText);
    expect(res.text).toBe('response');
  });
  it('[GET] - Should return 404', async () => {
    const res = await request(projectBasePath)
      .get('/unknown')
      .expect(404);
  });
  it('[GET - params] - Should return 200 for empty body', async () => {
    const res = await request(projectBasePath)
      .get('/empty?param=value')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(res.body).toEqual({});
  });
  it('[GET - params] - Should return 200 with JSON response with specific string value', async () => {
    const res = await request(projectBasePath)
      .get('/object?param=value')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.hey).toBe('string');
    expect(res.body.hey).toBe('I am working with params');
  });
  it('[GET - params] - Should return 200 with JSON response with specific number value', async () => {
    const res = await request(projectBasePath)
      .get('/object?param=value')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.num).toBe('number');
    expect(res.body.num).toBe(8);
  });
  it('[GET - params] - Should return 200 with JSON response with specific boolean value', async () => {
    const res = await request(projectBasePath)
      .get('/object?param=value')
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.valid).toBe('boolean');
    expect(res.body.valid).toBe(false);
  });
  it('[GET - params] - Should return 200 with wrong parameters when fallback option available - JSON response', async () => {
    const res = await request(projectBasePath)
      .get('/object?parameter=value_is_not_correct')
      .expect(200);
  });
  it('[GET - params] - Should return 200 with raw response with specific string', async () => {
    const res = await request(projectBasePath)
      .get('/string?param=value')
      .expect(200)
      .expect('Content-Type', contentTypeText);
    expect(res.text).toBe('response with params');
  });
  it('[GET - params] - Should return 200 with wrong parameters when fallback option available - raw response', async () => {
    const res = await request(projectBasePath)
      .get('/string?parameter=value_is_not_correct')
      .expect(200);
  });
  it('[GET - params] - Should return 404', async () => {
    const res = await request(projectBasePath)
      .get('/unknown?param=value')
      .expect(404);
  });
  it('[GET - no project value] - Should return 404', async () => {
    const res = await request(basePathWithoutProjectValue)
      .get('/endpoint')
      .expect(404);
  });
  it('[GET - project without endpoints] - Should return 404', async () => {
    const res = await request(projectWithoutEndpointsBasePath)
      .get('/endpoint')
      .expect(404);
  });
});
