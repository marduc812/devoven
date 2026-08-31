const { execSync } = require('child_process')

// Short commit SHA of the build. Vercel exposes the commit it built from;
// locally we fall back to git, and to 'dev' when git isn't available.
function getCommitSha() {
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
        return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
    }
    try {
        return execSync('git rev-parse --short=7 HEAD').toString().trim()
    } catch {
        return 'dev'
    }
}

function getBuildVersion() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    return `${date}_${getCommitSha()}`
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_BUILD_VERSION: getBuildVersion(),
    },
    async redirects() {
        return [
            // The duplicate Markdown to HTML route; the marked-based tool lives here.
            {
                source: '/converting/markdown-html',
                destination: '/converting/markdown-to-html',
                permanent: true,
            },
        ]
    },
}

module.exports = nextConfig
