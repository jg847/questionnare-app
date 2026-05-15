import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';

const {
  buildExportArtifact,
  collectExportFiles,
  countSourceLines,
  isEligibleExportFile,
  writeExport,
} = require('@/scripts/export-source') as {
  buildExportArtifact: (rootDir: string, files: string[]) => {
    content: string;
    totalFiles: number;
    totalLines: number;
  };
  collectExportFiles: (rootDir: string, currentDir?: string) => string[];
  countSourceLines: (content: string) => number;
  isEligibleExportFile: (fileName: string, filePath: string) => boolean;
  writeExport: (rootDir: string) => {
    totalFiles: number;
    totalLines: number;
    outputPath: string;
  };
};

describe('export-source', () => {
  it('filters supported files and excludes lockfiles', () => {
    expect(isEligibleExportFile('file.ts', 'file.ts')).toBe(true);
    expect(isEligibleExportFile('file.md', 'file.md')).toBe(false);
    expect(isEligibleExportFile('package-lock.json', 'package-lock.json')).toBe(false);
  });

  it('counts only source lines, excluding header lines', () => {
    expect(countSourceLines('alpha\nbeta')).toBe(2);
    expect(countSourceLines('')).toBe(0);
  });

  it('collects files deterministically and excludes generated directories', () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'toolmatch-export-'));
    fs.mkdirSync(path.join(rootDir, 'src'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'exports'), { recursive: true });
    fs.writeFileSync(path.join(rootDir, 'src', 'b.ts'), 'export const b = 1;');
    fs.writeFileSync(path.join(rootDir, 'src', 'a.ts'), 'export const a = 1;');
    fs.writeFileSync(path.join(rootDir, 'exports', 'old.txt'), 'ignore me');

    const files = collectExportFiles(rootDir).map((filePath: string) => path.basename(filePath));

    expect(files).toEqual(['a.ts', 'b.ts']);
  });

  it('writes a concatenated artifact with explicit file boundaries', () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'toolmatch-export-write-'));
    fs.mkdirSync(path.join(rootDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(rootDir, 'src', 'index.ts'), 'export const answer = 42;');

    const summary = writeExport(rootDir);
    const content = fs.readFileSync(summary.outputPath, 'utf8');

    expect(summary.totalFiles).toBe(1);
    expect(summary.totalLines).toBe(1);
    expect(content).toContain('===== FILE: src/index.ts =====');
    expect(content).toContain('export const answer = 42;');
  });

  it('builds an empty artifact safely when no eligible files exist', () => {
    const artifact = buildExportArtifact(process.cwd(), []);

    expect(artifact.totalFiles).toBe(0);
    expect(artifact.totalLines).toBe(0);
    expect(artifact.content).toBe('');
  });

  it('supports direct ts-node invocation for the export script', () => {
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'toolmatch-export-cli-'));
    const repoRoot = process.cwd();
    const scriptPath = path.join(repoRoot, 'scripts', 'export-source.ts');
    const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

    fs.mkdirSync(path.join(rootDir, 'src'), { recursive: true });
    fs.mkdirSync(path.join(rootDir, 'exports'), { recursive: true });
    fs.writeFileSync(path.join(rootDir, 'src', 'index.ts'), 'export const answer = 42;');
    fs.writeFileSync(path.join(rootDir, 'exports', 'old.txt'), 'ignore me');

    const quotedRepoRoot = `"${repoRoot}"`;
    const quotedScriptPath = `"${scriptPath}"`;
    const output = execSync(
      `${npxCommand} --prefix ${quotedRepoRoot} ts-node ${quotedScriptPath}`,
      {
        cwd: rootDir,
        encoding: 'utf8',
      },
    );

    expect(output).toContain('Total files: 1');
    expect(output).toContain('Total lines: 1');
    expect(fs.existsSync(path.join(rootDir, 'exports', 'source-export.txt'))).toBe(true);
  });
});