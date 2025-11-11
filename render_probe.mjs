import https from 'node:https';

const options = {
  hostname: 'api.render.com',
  path: '/v1/services',
  method: 'GET',
  headers: {
    Accept: 'application/json',
    Authorization: 'Bearer rnd_Y11eQZI91Tm0IVwktemlc1r6J0kR'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => (data += chunk));
  res.on('end', () => {
    console.log('status', res.statusCode);
    console.log('ratelimit-remaining', res.headers['ratelimit-remaining']);
    console.log('bodySnippet', data.slice(0, 200));
  });
});

req.on('error', err => {
  console.error('error', err);
});

req.end();

