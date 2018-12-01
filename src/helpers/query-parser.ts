export const parseQuery = (queryString: string) => {
  if (queryString.length > 0) {
    const query: any = {};
    const pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (const item of pairs) {
      const pair: any = item.split('=');
      query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
  } else {
    return {};
  }
};
