// Blog post registry
// Add new posts here with metadata and lazy import

export const posts = [
  {
    slug: 'hello-world',
    title: 'Welcome to the RTCDebug Blog',
    date: '2025-12-24',
    description: 'Introducing our blog where we share insights about WebRTC debugging and call quality optimization.',
    component: () => import('./hello-world.mdx')
  }
]

// Helper to get posts sorted by date (newest first)
export function getSortedPosts() {
  return [...posts].sort((a, b) => new Date(b.date) - new Date(a.date))
}

// Helper to get a post by slug
export function getPostBySlug(slug) {
  return posts.find(post => post.slug === slug)
}
