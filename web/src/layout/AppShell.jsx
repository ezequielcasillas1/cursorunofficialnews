import { Footer } from '../components/Footer.jsx';
import { Header } from '../components/Header.jsx';

export function AppShell({ children, onRefresh, refreshing, hero = false, status = null }) {
  return (
    <div className="app-shell">
      <Header onRefresh={onRefresh} refreshing={refreshing} hero={hero} status={status} />
      <div className="app-body">{children}</div>
      <Footer />
    </div>
  );
}
