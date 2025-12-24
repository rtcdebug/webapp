import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { getPostBySlug } from '../content/blog'

function BlogPostPage() {
  const { slug } = useParams()
  const post = getPostBySlug(slug)
  const [Content, setContent] = useState(null)

  useEffect(() => {
    if (post) {
      post.component().then(module => {
        setContent(() => module.default)
      })
    }
  }, [post])

  if (!post) {
    return <Navigate to="/blog" replace />
  }

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
        <title>{post.title} — RTCDebug Blog</title>
        <meta name="description" content={post.description} />
        <link rel="canonical" href={`https://rtcdebug.com/blog/${post.slug}`} />
      </Helmet>
      <Header />
      <main className="blog-main">
        <div className="container">
          <article className="blog-post">
            <Link to="/blog" className="blog-back">← Back to Blog</Link>
            <header className="blog-post-header">
              <time className="blog-post-date">{formatDate(post.date)}</time>
              <h1 className="blog-post-title">{post.title}</h1>
            </header>
            <div className="blog-post-content">
              {Content ? <Content /> : <p>Loading...</p>}
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default BlogPostPage
