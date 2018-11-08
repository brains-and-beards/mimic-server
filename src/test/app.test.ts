import request from 'supertest-as-promised';

const projectBasePath = 'http://localhost:3000/test';

describe('Tests for testmocker.json', () => {
  it('[GET] - Should return 200 for empty body', async () => {
    const res = await request(projectBasePath)
      .get('/abc')
      .expect(200);
    expect(typeof res.body).toBe('object');
    expect(res.body).toEqual({});
  });
  it('[GET] - Should return 200 with body', async () => {
    const res = await request(projectBasePath)
      .get('/object')
      .expect(200);
  });
  it('[GET] - Should return object as body', async () => {
    const res = await request(projectBasePath).get('/object');
    expect(typeof res.body).toBe('object');
  });
  it('[GET] - Should return a specific value', async () => {
    const res = await request(projectBasePath).get('/object');
    expect(res.body.hey).toBe('I am working');
  });
  it('[GET] - Should return a string', async () => {
    const res = await request(projectBasePath).get('/object');
    expect(typeof res.body.hey).toBe('string');
  });
  it('[GET] - Should return a number', async () => {
    const res = await request(projectBasePath).get('/object');
    expect(typeof res.body.num).toBe('number');
  });
  it('[GET] - Should return a specific value with params', async () => {
    const res = await request(projectBasePath).get('/object?param=value');
    expect(res.body.hey).toBe('I am working with params');
  });

  // TODO: remove comment after merge body validation
  // it('[POST] Should return 200 for empty body', async () => {
  //   const res = await request('http://localhost:3000/test')
  //     .post('/abc')
  //     .send({ param1: 'param1' })
  //     .expect(200);
  //   expect(typeof res.body).toBe('object');
  //   expect(res.body.response).toEqual('response');
  // });

  // it('[POST] Should return 200 and string response for empty body', async () => {
  //   const res = await request('http://localhost:3000/test')
  //     .post('/abc')
  //     .expect(200);
  //   expect(typeof res.body).toBe('string');
  //   expect(res.body).toEqual('response');
  // });
});
