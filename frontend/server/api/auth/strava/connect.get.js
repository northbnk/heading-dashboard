export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const clientId = config.public.stravaClientId
  if (!clientId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Strava client_id is not configured on server.'
    })
  }

  // Construct dynamic redirect URL (works on localhost or production)
  const host = event.node.req.headers.host || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const redirectUri = `${protocol}://${host}/api/auth/strava/callback`

  // Generate random state for CSRF protection
  const state = crypto.randomUUID()
  setCookie(event, 'oauth_state', state, {
    httpOnly: true,
    secure: !host.includes('localhost'),
    sameSite: 'lax',
    maxAge: 3600 // 1 hour
  })

  // Redirect user to Strava OAuth consent screen
  const scope = 'activity:read_all'
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`

  return sendRedirect(event, authUrl)
})
