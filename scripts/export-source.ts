const fs: typeof import('node:fs') = require('node:fs');
const path: typeof import('node:path') = require('node:path');

const INCLUDED_EXTENSIONS = new Set(['.ts', '.tsx', '.sql', '.json']);
const EXCLUDED_DIRECTORIES = new Set([
  '.git',
  '.next',
  '.swc',
  'coverage',
  'dist',
  'exports',
  'node_modules',
  'test-results',
]);
const EXCLUDED_FILENAMES = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']);

function normalizeRelativePath(filePath: string, rootDir: string) {
  return path.relative(rootDir, filePath).split(path.sep).join('/');
}

function isEligibleExportFile(fileName: string, filePath: string) {
  if (EXCLUDED_FILENAMES.has(fileName)) {
    return false;
  }

  return INCLUDED_EXTENSIONS.has(path.extname(filePath));
}

function shouldSkipDirectory(directoryName: string) {
  return EXCLUDED_DIRECTORIES.has(directoryName);
}

function collectExportFiles(rootDir: string, currentDir = rootDir): string[] {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const entryPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      if (shouldSkipDirectory(entry.name)) {
        continue;
      }

      files.push(...collectExportFiles(rootDir, entryPath));
      continue;
    }

    if (!entry.isFile() || !isEligibleExportFile(entry.name, entryPath)) {
      continue;
    }

    files.push(entryPath);
  }

  return files.sort((left, right) => normalizeRelativePath(left, rootDir).localeCompare(normalizeRelativePath(right, rootDir)));
}

function countSourceLines(content: string) {
  if (!content.length) {
    return 0;
  }

  return content.split(/\r?\n/).length;
}

function buildExportArtifact(rootDir: string, files: string[]) {
  let totalLines = 0;
  const sections = files.map((filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    totalLines += countSourceLines(content);
    const relativePath = normalizeRelativePath(filePath, rootDir);
    return `===== FILE: ${relativePath} =====\n${content}`;
  });

  return {
    content: sections.join('\n\n'),
    totalFiles: files.length,
    totalLines,
  };
}

function writeExport(rootDir: string) {
  const exportDir = path.join(rootDir, 'exports');
  fs.mkdirSync(exportDir, { recursive: true });

  const files = collectExportFiles(rootDir);
  const artifact = buildExportArtifact(rootDir, files);
  const outputPath = path.join(exportDir, 'source-export.txt');

  fs.writeFileSync(outputPath, artifact.content, 'utf8');

  return {
    totalFiles: artifact.totalFiles,
    totalLines: artifact.totalLines,
    outputPath,
  };
}

if (require.main === module) {
  const summary = writeExport(process.cwd());
  console.log(`Total files: ${summary.totalFiles}`);
  console.log(`Total lines: ${summary.totalLines}`);
  console.log(`Output path: ${summary.outputPath}`);
}

module.exports = {
  buildExportArtifact,
  collectExportFiles,
  countSourceLines,
  isEligibleExportFile,
  shouldSkipDirectory,
  writeExport,
};