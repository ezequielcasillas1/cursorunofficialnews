import { Button } from '@/components/ui/button';
import { useTheme } from '../theme/useTheme.js';
import { Icon } from './ui/Icon.jsx';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextLabel = theme === 'dark' ? 'Light mode' : 'Dark mode';

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={nextLabel}
      title={nextLabel}
      className="rounded-full"
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} width={16} />
    </Button>
  );
}
