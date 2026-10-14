// Netlify Function: save-data
// Recibe data.json del admin y lo sube a GitHub usando el token
// guardado en las variables de entorno de Netlify (GITHUB_TOKEN).
//
// Esto evita que el token quede en el código del repositorio.
//
// Endpoint: /.netlify/functions/save-data
// Método: POST
// Body: { content: "JSON string", message: "commit message" }

const https = require('https');

const GITHUB_REPO = process.env.GITHUB_REPO || 'andrescuesta19/megafragancia-web';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'mega2026';

function readBody(event) {
  return new Promise((resolve, reject) => {
    if (event.body) {
      if (event.isBase64Encoded) {
        const buf = Buffer.from(event.body, 'base64');
        resolve(buf.toString('utf8'));
      } else {
        resolve(event.body);
      }
    } else {
      reject(new Error('No body'));
    }
  });
}

function githubRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'api.github.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': 'token ' + GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'megafragancia-netlify-function',
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(opts, function (res) {
      let data = '';
      res.on('data', function (chunk) { data += chunk; });
      res.on('end', function () {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

exports.handler = async function (event) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Verificar contraseña del admin
  const password = event.headers['x-admin-password'] || event.headers['X-Admin-Password'];
  if (password !== ADMIN_PASSWORD) {
    return {
      statusCode: 401,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Contraseña incorrecta' })
    };
  }

  if (!GITHUB_TOKEN) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'GITHUB_TOKEN no configurado en Netlify' })
    };
  }

  let body;
  try {
    body = JSON.parse(await readBody(event));
  } catch (e) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'JSON inválido' })
    };
  }

  const content = body.content;
  const message = body.message || 'Update data.json from admin';
  const filePath = 'data.json';

  if (!content) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Falta content' })
    };
  }

  try {
    // 1. Obtener SHA actual del archivo
    const getRes = await githubRequest('GET', '/repos/' + GITHUB_REPO + '/contents/' + filePath + '?ref=' + GITHUB_BRANCH);

    let sha = null;
    if (getRes.status === 200 && getRes.body && getRes.body.sha) {
      sha = getRes.body.sha;
    } else if (getRes.status !== 404) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Error leyendo data.json: ' + (getRes.body && getRes.body.message || getRes.status) })
      };
    }

    // 2. Subir/actualizar el archivo
    const putBody = {
      message: message,
      branch: GITHUB_BRANCH,
      content: Buffer.from(content, 'utf8').toString('base64')
    };
    if (sha) putBody.sha = sha;

    const putRes = await githubRequest('PUT', '/repos/' + GITHUB_REPO + '/contents/' + filePath, putBody);

    if (putRes.status === 200 || putRes.status === 201) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ ok: true, commit: putRes.body.commit && putRes.body.commit.sha })
      };
    } else {
      return {
        statusCode: putRes.status,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: (putRes.body && putRes.body.message) || 'Error al subir' })
      };
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message || 'Error interno' })
    };
  }
};
