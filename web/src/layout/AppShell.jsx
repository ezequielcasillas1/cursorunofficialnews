import { Footer } from '../components/Footer.jsx';
import { Header } from '../components/Header.jsx';

export function AppShell({ children, onRefresh, refreshing }) {
  return (
    <div className="app-shell">
      <Header onRefresh={onRefresh} refreshing={refreshing} />
      <div className="app-body">{children}</div>
      <Footer />
    </div>
  );
}
