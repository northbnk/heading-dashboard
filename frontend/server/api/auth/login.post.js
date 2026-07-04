export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  if (body.password === 'admin330') {
    setCookie(event, 'admin_session', 'authenticated', {
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
      httpOnly: false, // Allow client-side verification if needed
      sameSite: 'lax'
    })
    return { success: true }
  } else {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password'
    })
  }
})
