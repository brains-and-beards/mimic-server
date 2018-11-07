import request from 'supertest-as-promised';

describe('Tests for testmocker.json', () => {
  it('[GET] Should return 200 for empty body', async () => {
    const res = await request('http://localhost:3000/test')
      .get('/abc')
      .expect(200);
    expect(typeof res.body).toBe('object');
    expect(res.body).toEqual({});
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
