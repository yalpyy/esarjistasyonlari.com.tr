import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchBlogPosts } from '../utils/api';

function BlogSkeleton({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="blog-card blog-card--skeleton">
          <div className="skeleton-image skeleton-pulse" />
          <div className="blog-card-body">
            <div className="skeleton-line skeleton-line--title skeleton-pulse" />
            <div className="skeleton-line skeleton-line--meta skeleton-pulse" />
            <div className="skeleton-line skeleton-line--text skeleton-pulse" />
            <div className="skeleton-line skeleton-line--text skeleton-line--short skeleton-pulse" />
            <div className="skeleton-tags">
              <div className="skeleton-tag skeleton-pulse" />
              <div className="skeleton-tag skeleton-pulse" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default function BlogPage() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogPosts()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="blog-page">
      <header className="blog-header">
        <h1>Blog</h1>
        <h2>{t('blogSubtitle')}</h2>
      </header>

      <div className="blog-grid">
        {loading && <BlogSkeleton count={6} />}

        {!loading && posts.length === 0 && (
          <div className="blog-empty">{t('noBlogPosts')}</div>
        )}

        {!loading && posts.map((post, index) => (
          <React.Fragment key={index}>
            <article className="blog-card">
              {post.thumbnail && (
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  className="blog-card-image"
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <div className="blog-card-body">
                <h3 className="blog-card-title">
                  <a href={post.link} target="_blank" rel="noopener noreferrer">
                    {post.title}
                  </a>
                </h3>
                {post.author && (
                  <p className="blog-card-author">{post.author}</p>
                )}
                <p className="blog-card-date">
                  {new Date(post.pubDate).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="blog-card-excerpt">
                  {post.description}...
                </p>
                {post.categories && post.categories.length > 0 && (
                  <div className="blog-card-tags">
                    {post.categories.slice(0, 3).map((tag) => (
                      <span key={tag} className="blog-tag">{tag}</span>
                    ))}
                  </div>
                )}
                <a
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="blog-read-more"
                >
                  {t('readMore')} →
                </a>
              </div>
            </article>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
