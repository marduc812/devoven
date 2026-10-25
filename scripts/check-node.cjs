// The October 2026 Node security fixes start at 22.23.4 on this release line.
function assertSupportedNode(version = process.versions.node) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  const [major, minor, patch] = match ? match.slice(1).map(Number) : [];
  if (major !== 22 || minor < 23 || (minor === 23 && patch < 4)) {
    throw new Error(
      `DevOven requires Node.js >=22.23.4 <23. You are running ${version}. ` +
      'Run nvm install && nvm use, or install a patched Node.js 22 release.',
    );
  }
}

module.exports = { assertSupportedNode };

if (require.main === module) assertSupportedNode();
