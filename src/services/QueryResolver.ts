import _ from 'lodash';

/**
 * This method extracts the project name from the query string.
 * @param query url of the request
 * @returns a string containing the extracted project name
 */
export const getNameFromQuery = (query: string) => query.split('/')[1];

/**
 * This method finds the project that matches the request.
 * @param projects a list of projects that we're trying to match against
 * @param query url of the request
 * @returns an IProject object that was found, or undefined
 */
export const findProject = (projects: ReadonlyArray<IProject>, queryUrl: string) => {
  const projectName = getNameFromQuery(queryUrl);
  return _.find(projects, proj => proj.name === projectName);
};
