import express from 'express';

import { constructURL, createBuffer, lengthForBuffer } from '../helpers/mockRequestAssembler';

describe('Tests for Mock Request Assembler', () => {
  it('Test creating Buffer when body is missing', async () => {
    const expected = undefined;
    const buffer = createBuffer(undefined);
    expect(buffer).toEqual(expected);
  });
  it('Test creating Buffer when body is empty', async () => {
    const expected = undefined;
    const buffer = createBuffer('');
    expect(buffer).toEqual(expected);
  });
  it('Test creating Buffer when body is valid', async () => {
    const buffer = createBuffer('body');
    expect(buffer).toBeDefined();
  });
  it('Test creating Buffer when body is valid', async () => {
    const buffer = createBuffer('body');
    expect(buffer).toBeDefined();
  });
  it('Test Buffer length calculation when body is missing', async () => {
    const expected = 0;
    const length = lengthForBuffer('GET', undefined);
    expect(length).toEqual(expected);
  });
  it('Test Buffer length calculation when method is GET and body is valid', async () => {
    const expected = 0;
    const length = lengthForBuffer('GET', 'body');
    expect(length).toEqual(expected);
  });
  it('Test Buffer length calculation when method is DELETE and body is valid', async () => {
    const expected = 0;
    const length = lengthForBuffer('DELETE', 'body');
    expect(length).toEqual(expected);
  });
  it('Test Buffer length calculation when body is valid', async () => {
    const expected = 6;
    const length = lengthForBuffer('PUT', 'body');
    expect(length).toEqual(expected);
  });
});
