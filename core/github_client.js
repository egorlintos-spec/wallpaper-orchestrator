// core/github_client.js
// Uploads/deletes binary files in a GitHub repo via the REST Contents API.
// Runs on the user's machine with a Personal Access Token (repo scope).
const fs = require('fs');
const config = require('../config');

function gh() {
  const { owner, repo, token } = config.github;
  if (!token) throw new Error('Missing GITHUB_TOKEN in .env (needs a PAT with "repo" scope).');
  return { owner, repo, token, branch: config.github.branch };
}
async function api(method, urlPath, body) {
  const { token } = gh();
  const res = await fetch('https://api.github.com' + urlPath, {
    method,
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) throw new Error('GitHub ' + method + ' ' + urlPath + ' → ' + res.status + ': ' + (json.message || text.slice(0,200)));
  return json;
}

// Look up an existing file's sha (so we can overwrite/delete). null if absent.
async function getSha(repoPath) {
  const { owner, repo, branch } = gh();
  try {
    const j = await api('GET', '/repos/' + owner + '/' + repo + '/contents/' + encodeURI(repoPath) + '?ref=' + branch);
    return j.sha || null;
  } catch (e) { if (/→ 404/.test(e.message)) return null; throw e; }
}

// Upload (create or overwrite) a local binary file. Returns the public raw URL.
async function uploadFile(localPath, repoPath, onStatus = () => {}) {
  const { owner, repo, branch } = gh();
  const content = fs.readFileSync(localPath).toString('base64');
  const sha = await getSha(repoPath);
  await api('PUT', '/repos/' + owner + '/' + repo + '/contents/' + encodeURI(repoPath), {
    message: 'pack: add ' + repoPath,
    content, branch, ...(sha ? { sha } : {}),
  });
  const rawUrl = 'https://raw.githubusercontent.com/' + owner + '/' + repo + '/' + branch + '/' +
    repoPath.split('/').map(encodeURIComponent).join('/');
  onStatus('⬆️ uploaded ' + repoPath);
  return { rawUrl, repoPath };
}

// Delete a file by path (looks up sha automatically).
async function deleteFile(repoPath, onStatus = () => {}) {
  const { owner, repo, branch } = gh();
  const sha = await getSha(repoPath);
  if (!sha) { onStatus('• already gone: ' + repoPath); return false; }
  await api('DELETE', '/repos/' + owner + '/' + repo + '/contents/' + encodeURI(repoPath), {
    message: 'pack: delete ' + repoPath, sha, branch,
  });
  onStatus('🗑️ deleted ' + repoPath);
  return true;
}

module.exports = { uploadFile, deleteFile, getSha };
