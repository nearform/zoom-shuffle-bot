export default function isTokenExpired(tokenData) {
  return tokenData.expires_on <= Date.now() / 1000
}
