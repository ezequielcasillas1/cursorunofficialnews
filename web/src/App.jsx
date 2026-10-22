import { Navigate, Route, Routes } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FeedPage } from './pages/FeedPage.jsx';
import { AboutPage } from './pages/AboutPage.jsx';
import { ArticlePage } from './pages/ArticlePage.jsx';
import { EditorialPolicyPage } from './pages/EditorialPolicyPage.jsx';
import { NewsletterPage } from './pages/NewsletterPage.jsx';
import { UnsubscribePage } from './pages/UnsubscribePage.jsx';
import { GamesHubPage } from './pages/GamesHubPage.jsx';
import { GamePlayPage } from './pages/GamePlayPage.jsx';
import { SourcesPage } from './pages/SourcesPage.jsx';
import { PrivacyPage } from './pages/PrivacyPage.jsx';
import { TermsPage } from './pages/TermsPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { FEED_SECTION_ROUTES } from './routes/feedRoutes.js';
import './App.css';

function Redirect({ to }) {
  return <Navigate to={to} replace />;
}

export default function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <Routes>
        <Route path="/" element={<FeedPage categoryId="all" />} />
        {FEED_SECTION_ROUTES.map(({ categoryId, path }) => (
          <Route key={categoryId} path={path} element={<FeedPage categoryId={categoryId} />} />
        ))}
        {FEED_SECTION_ROUTES.map(({ categoryId, path }) => (
          <Route
            key={`${categoryId}-legacy`}
            path={path.replace(/\/$/, '')}
            element={<Redirect to={path} />}
          />
        ))}
        <Route path="/item/:id/" element={<ArticlePage />} />
        <Route path="/item/:id" element={<ArticlePage />} />
        <Route path="/newsletter/" element={<NewsletterPage />} />
        <Route path="/newsletter" element={<Redirect to="/newsletter/" />} />
        <Route path="/newsletter/unsubscribe/" element={<UnsubscribePage />} />
        <Route path="/newsletter/unsubscribe" element={<Redirect to="/newsletter/unsubscribe/" />} />
        <Route path="/games/" element={<GamesHubPage />} />
        <Route path="/games" element={<Redirect to="/games/" />} />
        <Route path="/games/:gameId/" element={<GamePlayPage />} />
        <Route path="/about/" element={<AboutPage />} />
        <Route path="/about" element={<Redirect to="/about/" />} />
        <Route path="/editorial-policy/" element={<EditorialPolicyPage />} />
        <Route path="/editorial-policy" element={<Redirect to="/editorial-policy/" />} />
        <Route path="/sources/" element={<SourcesPage />} />
        <Route path="/sources" element={<Redirect to="/sources/" />} />
        <Route path="/privacy/" element={<PrivacyPage />} />
        <Route path="/privacy" element={<Redirect to="/privacy/" />} />
        <Route path="/terms/" element={<TermsPage />} />
        <Route path="/terms" element={<Redirect to="/terms/" />} />
        <Route path="/membership/unsubscribe" element={<Redirect to="/" replace />} />
        <Route path="/membership/unsubscribe/" element={<Redirect to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </TooltipProvider>
  );
}
