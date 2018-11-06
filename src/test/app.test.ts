import supertest = require('supertest');
// import XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

// describe('http', () => {
//   it('http-test', () => {
//     const request = supertest('http://localhost:3000');

//     const xhr = new XMLHttpRequest();

//     xhr.open('GET', url, true);
//     xhr.send();

//     xhr.onreadystatechange = () => {
//       if (xhr.readyState === 4) {
//         console.log(xhr.responseText);
//       }
//     };

//     request
//       .get('/project/test')
//       .expect({ message: 'this is the result' })
//       .expect(200, (err, res) => {
//         console.log(err);
//         console.log(res.body);
//       });
//   });
// });

import request from 'supertest-as-promised';
import Server from '../server';

describe('Flow API', () => {
  it('hello test', async () => {
    const res = await request('http://localhost:3000/nowy')
      .get('/a')
      .expect(200);
    // console.log('TCL: res', res);
    expect(typeof res.body).toBe('object');
    expect(res.body.single).toBe('forever alone');
  });
});
