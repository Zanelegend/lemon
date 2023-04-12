const BASE_URL = 'https://api.lemonsqueezy.com';

function getLemonSqueezyClient() {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;

  if (!apiKey) {
    throw new Error('Missing LEMON_SQUEEZY_API_KEY environment variable');
  }

  const request = async function <Data = unknown>(params: {
    path: string;
    body?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  }) {
    const url = [BASE_URL, params.path].join('/');

    const response = await fetch(url, {
      headers: getHeaders(apiKey),
      body: params.body,
      method: params.method,
    });

    if (!response.ok) {
      throw new Error(
        `Request failed with status code ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    return data as Data;
  };

  return {
    request,
  };
}

function getHeaders(apiKey: string) {
  return {
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    Authorization: `Bearer ${apiKey}`,
  };
}

export default getLemonSqueezyClient;