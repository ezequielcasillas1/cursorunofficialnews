import { Navigate, Route, Routes } from 'react-router-dom';
import { FeedPage } from './pages/FeedPage.jsx';
import { AboutPage } from './pages/AboutPage.jsx';
import { NewsletterPage } from './pages/NewsletterPage.jsx';
import { SourcesPage } from './pages/SourcesPage.jsx';
import { FEED_SECTION_ROUTES } from './routes/feedRoutes.js';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FeedPage categoryId="all" />} />
      {FEED_SECTION_ROUTES.map(({ categoryId, path }) => (
        <Route key={categoryId} path={path} element={<FeedPage categoryId={categoryId} />} />
      ))}
      <Route path="/newsletter" element={<NewsletterPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/sources" element={<SourcesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
