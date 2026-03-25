const fs = require('fs');
const pdfParse = require('pdf-parse');

const normalize = (text) =>
  String(text || '')
    .replace(/\s+/g, ' ')
    .trim();

const chunkText = (text, chunkSize = 800, overlap = 120) => {
  const clean = normalize(text);
  if (!clean) return [];

  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    chunks.push(clean.slice(start, end));
    if (end >= clean.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
};

const tokenize = (text) => {
  return normalize(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
};

const rankChunks = (question, chunks) => {
  const qTokens = new Set(tokenize(question));

  return chunks
    .map((chunk) => {
      const cTokens = tokenize(chunk);
      const score = cTokens.reduce((acc, token) => acc + (qTokens.has(token) ? 1 : 0), 0);
      return { chunk, score };
    })
    .sort((a, b) => b.score - a.score);
};

exports.retrieveReportContext = async (reportPath, question, topK = 3) => {
  try {
    if (!reportPath || !fs.existsSync(reportPath)) {
      return { context: '', found: false, reason: 'Report file not found' };
    }

    const buffer = fs.readFileSync(reportPath);
    const parsed = await pdfParse(buffer);
    const text = normalize(parsed.text);

    if (!text) {
      return { context: '', found: false, reason: 'No extractable report text' };
    }

    const chunks = chunkText(text);
    if (!chunks.length) {
      return { context: '', found: false, reason: 'No report chunks available' };
    }

    const ranked = rankChunks(question, chunks);
    const matched = ranked.filter((r) => r.score > 0);
    const selected = (matched.length ? matched : ranked).slice(0, topK);

    return {
      context: selected.map((s, i) => `Chunk ${i + 1}: ${s.chunk}`).join('\n\n'),
      found: matched.length > 0,
      reason: matched.length > 0 ? null : 'No direct matching context in uploaded report',
    };
  } catch (error) {
    return { context: '', found: false, reason: error.message };
  }
};
