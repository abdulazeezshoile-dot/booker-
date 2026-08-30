import {
  cloneElement,
  isValidElement,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';

/**
 * Minimal Slot: forwards className to a single child element (typically a Link)
 * so compound components like <Button asChild> can wrap navigation. Mirrors the
 * Radix `Slot` primitive used by the Button in the design system.
 */
export function Slot({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  if (isValidElement(children)) {
    const child = children as ReactElement<HTMLAttributes<HTMLElement>>;
    return cloneElement(child, {
      className: cn(className, child.props.className),
      ...props,
    });
  }
  return <span className={cn(className)} {...props}>{children}</span>;
}
