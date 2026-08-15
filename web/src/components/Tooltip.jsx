import { isValidElement } from 'react';
import {
  Tooltip as ShadTooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Adapter over shadcn Tooltip. Call sites keep `{ text, children }`.
 */
export function Tooltip({ text, children }) {
  if (!text || !isValidElement(children)) return children;

  return (
    <ShadTooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{children}</span>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={8}
        className="max-w-xs border border-border bg-card text-card-foreground shadow-md"
      >
        {text}
      </TooltipContent>
    </ShadTooltip>
  );
}
