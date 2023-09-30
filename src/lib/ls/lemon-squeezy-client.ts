async function getLemonSqueezyClient() {
  const { default: LemonSqueezyClient } = await import(
    '@lemonsqueezy/lemonsqueezy.js'
  );

  const apiKey = process.env.LEMON_SQUEEZY_API_KEY;

  if (!apiKey) {
    throw new Error('Missing LEMON_SQUEEZY_API_KEY environment variable');
  }

  return new LemonSqueezyClient(apiKey);
}

export default getLemonSqueezyClient;
