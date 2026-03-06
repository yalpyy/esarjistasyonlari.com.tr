import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchBlogPosts } from '../utils/api';

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

  const stripHtml = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  return (
    <div className="blog-page">
      <div className="blog-header">
        <h1>{t('blogTitle')}</h1>
        <h2>{t('blogSubtitle')}</h2>
      </div>

      {loading && <div className="loading-text">{t('loading')}</div>}

      {!loading && posts.length === 0 && (
        <div className="empty-text">{t('noBlogPosts')}</div>
      )}

      <div className="blog-grid">
        {posts.map((post, index) => (
          <article key={index} className="blog-card">
            {post.thumbnail && (
              <img
                src={post.thumbnail}
                alt={post.title}
                className="blog-card-image"
                loading="lazy"
              />
            )}
            <div className="blog-card-body">
              <h2 className="blog-card-title">
                <a href={post.link} target="_blank" rel="noopener noreferrer">
                  {post.title}
                </a>
              </h2>
              <p className="blog-card-date">
                {new Date(post.pubDate).toLocaleDateString('tr-TR')}
              </p>
              <p className="blog-card-excerpt">
                {stripHtml(post.description).substring(0, 200)}...
              </p>
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
        ))}
      </div>
    </div>
  );
}
