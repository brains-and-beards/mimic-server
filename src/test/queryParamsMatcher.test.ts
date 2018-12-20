import { extractPathForURL, endpointsInProject, findQueryMatches, simplifyBody } from '../helpers/queryParamsMatcher';

const testEndpoints = {
  '71ac9340-d616-11e8-b6fb-555fa73c0bbd': {
    uuid: '71ac9340-d616-11e8-b6fb-555fa73c0bbd',
    path: '/,',
    method: 'GET',
    response: {},
    request: {
      body: {},
      params: '',
    },
    statusCode: 200,
    timeout: 0,
    projectId: '7088acb0-d616-11e8-b6fb-555fa73c0bbd',
  },
  '79bb6930-d616-11e8-b6fb-555fa73c0bbd': {
    uuid: '79bb6930-d616-11e8-b6fb-555fa73c0bbd',
    path: '/test',
    method: 'GET',
    response: {
      hey: 'I am working',
    },
    request: {
      body: {},
      params: '?region=europe',
    },
    statusCode: 200,
    timeout: 0,
    projectId: '7088acb0-d616-11e8-b6fb-555fa73c0bbd',
  },
};

const testProject = {
  uuid: '7088acb0-d616-11e8-b6fb-555fa73c0bbd',
  name: 'nowy',
  endpoints: ['71ac9340-d616-11e8-b6fb-555fa73c0bbd'],
};

describe('Tests for Query Params matcher', () => {
  it('Test removing query parameters', async () => {
    const url = 'http://localhost:3000/nowy?q=211&p=23';
    const expected = 'http:/localhost:3000/nowy';
    const path = extractPathForURL(url);
    expect(path).toEqual(expected);
  });
  it('Finding endpoints for project', async () => {
    const endpoints = endpointsInProject(testEndpoints, testProject);
    const expected = [
      {
        uuid: '71ac9340-d616-11e8-b6fb-555fa73c0bbd',
        path: '/,',
        method: 'GET',
        response: {},
        request: {
          body: {},
          params: '',
        },
        statusCode: 200,
        timeout: 0,
        projectId: '7088acb0-d616-11e8-b6fb-555fa73c0bbd',
      },
    ];
    expect(expected).toEqual(endpoints);
  });
  it('Finding endpoints if endpoint list is empty', async () => {
    const endpoints = endpointsInProject([], testProject);
    expect([]).toEqual(endpoints);
  });
  it('Finding endpoints if not matching endpoint found', async () => {
    const notFoundEndpoints = {
      'fake id': {
        uuid: '',
        path: '/,',
        method: 'GET',
        response: {},
        request: {
          body: {},
          params: '',
        },
        statusCode: 200,
        timeout: 0,
        projectId: '7088acb0-d616-11e8-b6fb-555fa73c0bbd',
      },
    };
    const endpoints = endpointsInProject(notFoundEndpoints, testProject);
    expect([]).toEqual(endpoints);
  });
  it('Test simple query match', async () => {
    const endpointQuery = '?region=europe';
    const requestQuery = { region: 'europe' };
    const match = findQueryMatches(endpointQuery, requestQuery);
    expect(match).toEqual(true);
  });
  it('Test non-matching query', async () => {
    const endpointQuery = '?nonMatch=europe';
    const requestQuery = { region: 'europe' };
    const match = findQueryMatches(endpointQuery, requestQuery);
    expect(match).toEqual(false);
  });
  it('Test empty request query', async () => {
    const endpointQuery = '';
    const requestQuery = { region: 'europe' };
    const match = findQueryMatches(endpointQuery, requestQuery);
    expect(match).toEqual(true);
  });
  it('Test multiple query matching', async () => {
    const endpointQuery = '?region=europe&test=10';
    const requestQuery = { region: 'europe', test: 10 };
    const match = findQueryMatches(endpointQuery, requestQuery);
    expect(match).toEqual(true);
  });
  it('Test if only some parameters dont match', async () => {
    const endpointQuery = '?region=europe&noMatch=10';
    const requestQuery = { region: 'europe', test: 10 };
    const match = findQueryMatches(endpointQuery, requestQuery);
    expect(match).toEqual(false);
  });
  it('Test if values dont match', async () => {
    const endpointQuery = '?region=europe&test=10';
    const requestQuery = { region: 'europe', test: 12 };
    const match = findQueryMatches(endpointQuery, requestQuery);
    expect(match).toEqual(false);
  });
  it('Body simplifier - empty test', async () => {
    const body = undefined;
    const simplified = simplifyBody(body);
    expect(simplified).toEqual(undefined);
  });
  it('Body simplifier - simple string test', async () => {
    const body = 'test';
    const simplified = simplifyBody(body);
    expect(simplified).toEqual('test');
  });
  it('Body simplifier - simple body test', async () => {
    const body = 'test: 23';
    const simplified = simplifyBody(body);
    expect(simplified).toEqual('test: 23');
  });
  it('Body simplifier - quote test', async () => {
    const body = '\"test\": \"23\"';
    const simplified = simplifyBody(body);
    expect(simplified).toEqual('test: 23');
  });
  it('Body simplifier - white space test', async () => {
    const body = '     test: 23' +
      '';
    const simplified = simplifyBody(body);
    expect(simplified).toEqual('test: 23');
  });
});
