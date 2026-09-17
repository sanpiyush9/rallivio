export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json({
    sha: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? 'local',
    message: process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null,
    builtAt: process.env.VERCEL_DEPLOYMENT_ID ?? null,
  })
}
