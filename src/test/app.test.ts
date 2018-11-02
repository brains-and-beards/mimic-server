import supertest = require('supertest');

describe('http', () => {
  it('http-test', () => {
    const request = supertest('http://localhost:3000');

    const xhr = new XMLHttpRequest();

    xhr.open('GET', url, true);
    xhr.send();

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        console.log(xhr.responseText);
      }
    };

    request
      .get('/project/test')
      .expect({ message: 'this is the result' })
      .expect(200, (err, res) => {
        console.log(err);
        console.log(res.body);
      });
  });
});
