import { parseHost } from '../helpers/host-parser';

describe('Tests for Host Parser', () => {
  it('Subdomain test', async () => {
    const url = 'http://www.blog.classroom.me.uk/index.php';
    const expected = 'classroom.me.uk';
    const parsedHost = parseHost(url);
    expect(parsedHost).toEqual(expected);
  });
  it('Simple URL test', async () => {
    const url = 'http://www.youtube.com/watch?v=ClkQA2Lb_iE';
    const expected = 'youtube.com';
    const parsedHost = parseHost(url);
    expect(parsedHost).toEqual(expected);
  });
  it('HTTPS test', async () => {
    const url = 'https://www.youtube.com/watch?v=ClkQA2Lb_iE';
    const expected = 'youtube.com';
    const parsedHost = parseHost(url);
    expect(parsedHost).toEqual(expected);
  });
  it('WWW test', async () => {
    const url = 'www.youtube.com/watch?v=ClkQA2Lb_iE';
    const expected = 'youtube.com';
    const parsedHost = parseHost(url);
    expect(parsedHost).toEqual(expected);
  });
  it('FTP test', async () => {
    const url = 'ftps://ftp.websitename.com/dir/file.txt';
    const expected = 'websitename.com';
    const parsedHost = parseHost(url);
    expect(parsedHost).toEqual(expected);
  });
  it('Missing HTTP test', async () => {
    const url = 'example.com?param=value';
    const expected = 'example.com';
    const parsedHost = parseHost(url);
    expect(parsedHost).toEqual(expected);
  });
  it('// test', async () => {
    const url = '//youtube.com/watch?v=ClkQA2Lb_iE';
    const expected = 'youtube.com';
    const parsedHost = parseHost(url);
    expect(parsedHost).toEqual(expected);
  });
});
