export const checkAdmin = (event) => {
  const adminSession = getCookie(event, 'admin_session')
  if (adminSession !== 'authenticated') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized. Admin login required.'
    })
  }
}
