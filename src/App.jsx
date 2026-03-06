import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ContactButton from './components/ContactButton';
import StickyBanner from './components/StickyBanner';
import HomePage from './pages/HomePage';
import BlogPage from './pages/BlogPage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/blog" element={<BlogPage />} />
          </Routes>
        </main>
        <ContactButton />
        <StickyBanner />
      </div>
    </BrowserRouter>
  );
}
