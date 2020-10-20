import request from 'supertest-as-promised';

describe('Tests for Clincase case', () => {
  it('[POST] - Should return 200 on an auto-mocked POST request', async () => {
    const res = await request('http://localhost:3000/ePRO-test')
      .post('/camepro/device')
      .send({})
      .expect(200);
    expect(JSON.parse(res.text)).toEqual({ someField: 'unimportant value' });
  });
});