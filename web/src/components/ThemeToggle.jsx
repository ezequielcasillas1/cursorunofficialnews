import { useTheme } from '../theme/useTheme.js';
import { Icon } from './ui/Icon.jsx';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextLabel = theme === 'dark' ? 'Light mode' : 'Dark mode';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={nextLabel}
      title={nextLabel}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-gold)] hover:border-[var(--color-gold)]/60 transition-colors"
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} width={16} />
    </button>
  );
}
