import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { getSortedPosts } from '../content/blog'

function BlogPage() {
  const posts = getSortedPosts()

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="blog-page">
      <Helmet>
        <title>Blog — RTCDebug</title>
        <meta name="description" content="Insights about WebRTC debugging, call quality optimization, and real-time communication best practices." />
        <link rel="canonical" href="https://rtcdebug.com/blog" />
      </Helmet>
      <Header />
      <main className="blog-main">
        <div className="container">
          <div className="blog-header">
            <h1>Blog</h1>
            <p>Insights about WebRTC debugging and call quality optimization.</p>
          </div>
          <div className="blog-list">
            {posts.map(post => (
              <Link to={`/blog/${post.slug}`} key={post.slug} className="blog-card">
                <span className="blog-card-date">{formatDate(post.date)}</span>
                <h2 className="blog-card-title">{post.title}</h2>
                <p className="blog-card-description">{post.description}</p>
                <span className="blog-card-link">Read more →</span>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default BlogPage
