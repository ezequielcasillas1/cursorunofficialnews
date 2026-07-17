import { Navigate, Route, Routes } from 'react-router-dom';
import { FeedPage } from './pages/FeedPage.jsx';
import { AboutPage } from './pages/AboutPage.jsx';
import { ArticlePage } from './pages/ArticlePage.jsx';
import { EditorialPolicyPage } from './pages/EditorialPolicyPage.jsx';
import { NewsletterPage } from './pages/NewsletterPage.jsx';
import { UnsubscribePage } from './pages/UnsubscribePage.jsx';
import { MembershipUnsubscribePage } from './pages/MembershipUnsubscribePage.jsx';
import { SourcesPage } from './pages/SourcesPage.jsx';
import { PrivacyPage } from './pages/PrivacyPage.jsx';
import { TermsPage } from './pages/TermsPage.jsx';
import { FEED_SECTION_ROUTES } from './routes/feedRoutes.js';
import './App.css';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FeedPage categoryId="all" />} />
      {FEED_SECTION_ROUTES.map(({ categoryId, path }) => (
        <Route key={categoryId} path={path} element={<FeedPage categoryId={categoryId} />} />
      ))}
      <Route path="/item/:id" element={<ArticlePage />} />
      <Route path="/newsletter" element={<NewsletterPage />} />
      <Route path="/newsletter/unsubscribe" element={<UnsubscribePage />} />
      <Route path="/membership/unsubscribe" element={<MembershipUnsubscribePage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/editorial-policy" element={<EditorialPolicyPage />} />
      <Route path="/sources" element={<SourcesPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
