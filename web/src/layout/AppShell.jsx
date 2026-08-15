import { Footer } from '../components/Footer.jsx';
import { Header } from '../components/Header.jsx';

export function AppShell({
  children,
  onRefresh,
  refreshing,
  hero = false,
  status = null,
  heroHeading,
  heroKicker,
}) {
  return (
    <div className="app-shell">
      <Header
        onRefresh={onRefresh}
        refreshing={refreshing}
        hero={hero}
        status={status}
        heroHeading={heroHeading}
        heroKicker={heroKicker}
      />
      <div className="app-body">{children}</div>
      <Footer />
    </div>
  );
}
