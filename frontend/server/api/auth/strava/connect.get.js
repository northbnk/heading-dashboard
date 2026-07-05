import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = query.token

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized. Session token is missing in redirect URL.'
    })
  }

  const config = useRuntimeConfig()
  const supabase = createClient(config.public.supabaseUrl, config.public.supabaseAnonKey)
  
  // Verify user token
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid session token: ' + (error?.message || 'User not found')
    })
  }

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

  console.log(`OAuth Connect. Host: ${host}, Protocol: ${protocol}, Redirect URI: ${redirectUri}, User ID: ${user.id}`)

  // Redirect user to Strava OAuth consent screen with user.id in state
  const scope = 'activity:read_all'
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${user.id}`

  return sendRedirect(event, authUrl)
})
