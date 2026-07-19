/**
 * After `husky` installs `.husky/_/*`, harden the runner for Windows:
 * 1) Point hook shebangs at Git for Windows `sh.exe` (avoid WSL bash stub).
 * 2) Prepend Git usr/bin to PATH inside wrappers so `dirname`/`sh` resolve.
 * 3) Prefer Git `sh.exe` for the nested hook invocation inside `h`.
 *
 * Root cause: default WSL distro `docker-desktop` has no `/bin/bash`, so
 * `C:\\Windows\\System32\\bash.exe` fails with CreateProcessCommon/execvpe.
 */
/* global console, process */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const huskyDir = join(process.cwd(), '.husky', '_');
const gitSh = 'C:/Progra~1/Git/usr/bin/sh.exe';
const gitShUnix = '/c/Program Files/Git/usr/bin/sh.exe';
const pathExport = 'export PATH="/c/Program Files/Git/usr/bin:/c/Program Files/Git/bin:$PATH"';
const marker = '# banal: prefer Git Bash sh on Windows';
const wrapperMarker = '# banal: windows git-bash wrapper';

if (!existsSync(huskyDir)) {
  console.warn('[patch-husky-runner] .husky/_ missing — skip');
  process.exit(0);
}

const patchWrapper = (filePath) => {
  const name = filePath.split(/[/\\]/).pop();
  if (name === 'h' || name === 'husky.sh' || name === '.gitignore') {
    return false;
  }

  const desired = `#!${gitSh}
${wrapperMarker}
${pathExport}
. "$(dirname "$0")/h"
`;

  const raw = readFileSync(filePath, 'utf8');
  if (raw.includes(wrapperMarker) && raw.startsWith(`#!${gitSh}`)) {
    return false;
  }

  // Only patch husky's tiny shim wrappers (shebang + source h)
  if (!raw.includes('/h') && !raw.includes('husky.sh')) {
    return false;
  }

  writeFileSync(filePath, desired, 'utf8');
  return true;
};

const patchH = () => {
  const hPath = join(huskyDir, 'h');
  if (!existsSync(hPath)) {
    return false;
  }

  let original = readFileSync(hPath, 'utf8');

  // Ensure Git tools are on PATH even when the outer shell is minimal
  if (!original.includes(pathExport)) {
    original = original.replace(
      'export PATH="node_modules/.bin:$PATH"',
      `${pathExport}\nexport PATH="node_modules/.bin:$PATH"`,
    );
  }

  if (!original.includes(marker)) {
    if (!original.includes('sh -e "$s" "$@"')) {
      console.warn('[patch-husky-runner] unexpected husky h format — skip nested sh patch');
    } else {
      const replacement = `${marker}
if [ -x "${gitShUnix}" ]; then
	"${gitShUnix}" -e "$s" "$@"
elif [ -x "/usr/bin/sh" ]; then
	/usr/bin/sh -e "$s" "$@"
else
	sh -e "$s" "$@"
fi`;
      original = original.replace('sh -e "$s" "$@"', replacement);
    }
  }

  writeFileSync(hPath, original, 'utf8');
  return true;
};

let wrapperCount = 0;
for (const name of readdirSync(huskyDir)) {
  if (patchWrapper(join(huskyDir, name))) {
    wrapperCount += 1;
  }
}

patchH();
console.log(`[patch-husky-runner] wrappers=${wrapperCount}, h patched`);
