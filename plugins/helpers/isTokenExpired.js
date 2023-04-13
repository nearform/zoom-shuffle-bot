export default function isTokenExpired(tokenData) {
  return tokenData.expiresOn <= Date.now() / 1000
}
