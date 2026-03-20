const fs = require('fs');
const http = require('http');

function parseEnv(path) {
  const txt = fs.readFileSync(path, 'utf8');
  const lines = txt.split(/\r?\n/);
  const out = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = parseEnv(__dirname + '/../.env');
const JWT_SECRET = env.JWT_SECRET || env.JWT_Secret || 'any_random_secret';

function base64url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function sign(payloadObj) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = payloadObj;
  const data = base64url(JSON.stringify(header)) + '.' + base64url(JSON.stringify(payload));
  const crypto = require('crypto');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return data + '.' + sig;
}

(async () => {
  const now = Math.floor(Date.now() / 1000);
  const token = sign({ userId: '64b7c2f4e8f1a2b3c4d5e6f7', iat: now, exp: now + 7 * 24 * 3600 });

  console.log('Generated token:', token);

  const postData = JSON.stringify({ title: 'Test Resume From Script' });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/resumes/create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Authorization': 'Bearer ' + token
    }
  };

  const req = http.request(options, (res) => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', JSON.stringify(res.headers));
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      console.log('BODY:', body || '<empty>');
    });
  });

  req.on('error', (e) => {
    console.error('problem with request:', e.message);
  });

  req.write(postData);
  req.end();
})();
