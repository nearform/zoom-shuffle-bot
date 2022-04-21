export default function sortRandomly(items) {
  return items.sort(() => Math.random() - 0.5)
}
