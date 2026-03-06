import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ContactButton from './components/ContactButton';
import StickyBanner from './components/StickyBanner';
import HomePage from './pages/HomePage';
import BlogPage from './pages/BlogPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AboutUs from './pages/AboutUs';
import './App.css';

function AppLayout() {
  const location = useLocation();
  const isMapPage = location.pathname === '/';

  return (
    <div className="app">
      <Header />
      <main className={`app-main ${!isMapPage ? 'app-main--scrollable' : ''}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/gizlilik-politikasi" element={<PrivacyPolicy />} />
          <Route path="/hakkimizda" element={<AboutUs />} />
        </Routes>
        {!isMapPage && <Footer />}
      </main>
      <ContactButton />
      <StickyBanner />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
