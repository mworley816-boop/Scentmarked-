export const dynamic = 'force-dynamic'

export async function GET() {
  return Response.json(
    {
      status: 'ok',
      service: 'scentmarked',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}
