import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchBlogPosts } from '../utils/api';
import AdBanner from '../components/AdBanner';

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
        <h1>{t('blogTitle')}</h1>
        <h2>{t('blogSubtitle')}</h2>
      </header>

      {loading && <div className="loading-text">{t('loading')}</div>}

      {!loading && posts.length === 0 && (
        <div className="empty-text">{t('noBlogPosts')}</div>
      )}

      <div className="blog-ad-top">
        <AdBanner slot="BLOG_TOP_SLOT" format="auto" className="blog-ad-banner" />
      </div>

      <div className="blog-grid">
        {posts.map((post, index) => (
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
                <h1 className="blog-card-title">
                  <a href={post.link} target="_blank" rel="noopener noreferrer">
                    {post.title}
                  </a>
                </h1>
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
            {(index + 1) % 3 === 0 && (
              <div className="blog-inline-ad">
                <AdBanner slot="BLOG_INLINE_SLOT" format="auto" className="blog-ad-banner" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
