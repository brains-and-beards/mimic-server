import request from 'supertest-as-promised';

import {
  basePathWithoutProjectValue,
  contentTypeJSON,
  contentTypeText,
  projectBasePath,
  projectWithoutEndpointsBasePath,
} from './config';

describe('Tests for testmocker.json - POST', () => {
  it('[POST] - Should return 200 for empty body', async () => {
    const res = await request(projectBasePath).post('/empty').expect(200).expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(res.body).toEqual({});
  });
  it('[POST] - Should return 200 with object as body with specific string value', async () => {
    const res = await request(projectBasePath).post('/object').expect(200).expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.hey).toBe('string');
    expect(res.body.hey).toBe('I am working');
  });
  it('[POST] - Should return 200 with object as body with specific number value', async () => {
    const res = await request(projectBasePath).post('/object').expect(200).expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.num).toBe('number');
    expect(res.body.num).toBe(4);
  });
  it('[POST] - Should return 200 with object as body with specific boolean value', async () => {
    const res = await request(projectBasePath).post('/object').expect(200).expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.valid).toBe('boolean');
    expect(res.body.valid).toBe(true);
  });
  it('[POST] - Should return 200 with raw response with specific string', async () => {
    const res = await request(projectBasePath).post('/string').expect(200).expect('Content-Type', contentTypeText);
    expect(res.text).toBe('response');
  });
  it('[POST] - Should return 404', async () => {
    await request(projectBasePath).post('/unknown').expect(404);
  });
  it('[POST - body request] - Should return 200 for empty body', async () => {
    const res = await request(projectBasePath)
      .post('/empty')
      .send({})
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(res.body).toEqual({});
  });
  it('[POST - body request] - Should return 200 with JSON response with body JSON request', async () => {
    const res = await request(projectBasePath)
      .post('/object')
      .send({ param: 'value' })
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.hey).toBe('string');
    expect(res.body.hey).toBe('I am working with body');
  });
  it('[POST - body request] - Should return 200 with JSON response with specific number value', async () => {
    const res = await request(projectBasePath)
      .post('/object')
      .send({ param: 'value' })
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.num).toBe('number');
    expect(res.body.num).toBe(8);
  });
  it('[POST - body request] - Should return 200 with JSON response with specific boolean value', async () => {
    const res = await request(projectBasePath)
      .post('/object')
      .send({ param: 'value' })
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(typeof res.body.valid).toBe('boolean');
    expect(res.body.valid).toBe(false);
  });
  it('[POST - body request] - Should return 200 with wrong parameters - JSON response', async () => {
    await request(projectBasePath).post('/object').send({ param: 'value1' }).expect(200);
  });
  it('[POST - body request] - Should return 200 with raw response with specific string', async () => {
    const res = await request(projectBasePath)
      .post('/string')
      .send({ param: 'value' })
      .expect(200)
      .expect('Content-Type', contentTypeText);
    expect(res.text).toBe('response with params');
  });
  it('[POST - body request] - Should return 200 with wrong request body - raw response', async () => {
    await request(projectBasePath).post('/string').send({ param: 'value1' }).expect(200);
  });
  it('[POST - body request] - Should return 404', async () => {
    await request(projectBasePath).post('/unknown').send({ param: 'value1' }).expect(404);
  });
  it('[POST - no project value] - Should return 404', async () => {
    await request(basePathWithoutProjectValue).post('/endpoint').expect(404);
  });
  it('[POST - project without endpoints] - Should return 404', async () => {
    await request(projectWithoutEndpointsBasePath).post('/endpoint').expect(404);
  });

  it('[POST - body request] - Should return 200 with long JSON response with body JSON request', async () => {
    const res = await request(projectBasePath)
      .post('/longResponse')
      .send({ param: 'value' })
      .expect(200)
      .expect('Content-Type', contentTypeJSON);
    expect(typeof res.body).toBe('object');
    expect(res.body.guys.length).toEqual(11);
    expect(res.body.guys[9].age).toEqual(39);
  });

  it('[POST - body request] - Should return 200 with long JSON response with wrong body JSON request', async () => {
    await request(projectBasePath).post('/longResponse').send({ param: 'value1' }).expect(200);
  });
});
