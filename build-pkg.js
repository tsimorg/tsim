/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { exec } = require('node:child_process');
const { writeFileSync, rmSync, copyFileSync } = require('node:fs');
const process = require('node:process');
const { promisify } = require('node:util');

const execAsync = promisify(exec);
const package = process.argv[2];

function clearBuild() {
  rmSync(`./build/${package}/`, { force: true, recursive: true });
}

async function buildCjs() {
  const { stderr } = await execAsync(`npx tsc --project packages/${package}/tsconfig.cjs.json`);
  if (stderr) throw stderr;
}

async function buildEsm() {
  const { stderr } = await execAsync(`npx tsc --project packages/${package}/tsconfig.esm.json`);
  if (stderr) throw stderr;
}

function buildPackage() {
  const root = require('./package.json');
  const pkgFile = require(`./packages/${package}/package.json`);

  const pkg = { name: pkgFile.name };
  pkg.author = root.author;
  pkg.description = root.description;
  pkg.license = root.license;
  pkg.version = pkgFile.version;
  pkg.repository = {
    type: 'git',
    url: 'https://github.com/tsimorg/tsim.git',
    directory: `packages/${package}`,
  };
  pkg.main = './cjs/index.js';
  pkg.module = './esm/index.js';
  pkg.typings = './types/index.d.ts';
  pkg.dependencies = pkgFile.dependencies;
  pkg.peerDependencies = pkgFile.peerDependencies;

  const pkgContent = JSON.stringify(pkg, null, 2) + '\n';
  writeFileSync(`./build/${package}/package.json`, pkgContent, { encoding: 'utf8' });
}

function copyAssets() {
  copyFileSync(`./packages/${package}/README.md`, `./build/${package}/README.md`);
}

async function main() {
  clearBuild();
  await buildCjs();
  await buildEsm();
  buildPackage();
  copyAssets();
}

main().catch(console.error);
