const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const migrationDir = path.join(rootDir, 'supabase', 'migrations');
const seedDir = path.join(rootDir, 'supabase', 'seed');
const sqlFilePattern = /^\d{12}_.+\.sql$/;

function readSqlFiles(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    throw new Error(`Missing directory: ${directoryPath}`);
  }

  return fs
    .readdirSync(directoryPath)
    .filter((fileName) => fileName.endsWith('.sql'))
    .sort();
}

function validateFiles(label, files) {
  if (files.length === 0) {
    throw new Error(`No SQL files found for ${label}.`);
  }

  const invalidFiles = files.filter(
    (fileName) => !sqlFilePattern.test(fileName),
  );

  if (invalidFiles.length > 0) {
    throw new Error(
      `${label} contains files that do not follow the YYYYMMDDHHMM_description.sql convention: ${invalidFiles.join(', ')}`,
    );
  }
}

function main() {
  const migrationFiles = readSqlFiles(migrationDir);
  const seedFiles = readSqlFiles(seedDir);

  validateFiles('migrations', migrationFiles);
  validateFiles('seed files', seedFiles);

  console.log('Supabase bootstrap files verified.');
  console.log(`Migrations: ${migrationFiles.length}`);
  console.log(`Seeds: ${seedFiles.length}`);
  console.log(`Latest migration: ${migrationFiles[migrationFiles.length - 1]}`);
  console.log(`Latest seed: ${seedFiles[seedFiles.length - 1]}`);
}

main();
