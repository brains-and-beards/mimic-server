import Server from '../../server';

const testConfigPath = './testmocker.json';

export const startMimicServer = async (): Promise<Server> => {
  const server = new Server(testConfigPath);
  await server.run();

  return server;
};
