'use client';

import * as React from 'react';
import { cn } from '@/lib/utils'; // Utility for combining class names

// Correctly typing the props for HTML elements
type DivProps = React.ComponentPropsWithRef<'div'>;
type InputProps = React.ComponentPropsWithRef<'input'>;
type UlProps = React.ComponentPropsWithRef<'ul'>;
type LiProps = React.ComponentPropsWithRef<'li'>;

// Command wrapper component
export const Command = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('command-wrapper', className)} {...props} />
    );
  }
);
Command.displayName = 'Command';

// Command input component
export const CommandInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input ref={ref} className={cn('command-input', className)} {...props} />
    );
  }
);
CommandInput.displayName = 'CommandInput';

// Command list component
export const CommandList = React.forwardRef<HTMLUListElement, UlProps>(
  ({ className, ...props }, ref) => {
    return (
      <ul ref={ref} className={cn('command-list', className)} {...props} />
    );
  }
);
CommandList.displayName = 'CommandList';

// Command item component
export const CommandItem = React.forwardRef<HTMLLIElement, LiProps>(
  ({ className, ...props }, ref) => {
    return (
      <li ref={ref} className={cn('command-item', className)} {...props} />
    );
  }
);
CommandItem.displayName = 'CommandItem';

// Command group component
export const CommandGroup = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('command-group', className)} {...props} />
    );
  }
);
CommandGroup.displayName = 'CommandGroup';

// Command empty state component
export const CommandEmpty = React.forwardRef<HTMLDivElement, DivProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('command-empty', className)} {...props} />
    );
  }
);
CommandEmpty.displayName = 'CommandEmpty';
