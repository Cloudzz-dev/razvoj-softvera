'use client';

import { RadioGroup as HeadlessRadioGroup } from '@headlessui/react';
import { ReactNode } from 'react';

interface RadioGroupProps<T> {
  value: T;
  onChange: (value: T) => void;
  children: ReactNode;
  className?: string;
}

export function RadioGroup<T>({ value, onChange, children, className = '' }: RadioGroupProps<T>) {
  return (
    <HeadlessRadioGroup value={value} onChange={onChange} className={className}>
      {children}
    </HeadlessRadioGroup>
  );
}

export function RadioGroupLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <HeadlessRadioGroup.Label className={`text-sm font-medium text-white mb-4 block ${className}`}>
      {children}
    </HeadlessRadioGroup.Label>
  );
}

interface RadioGroupOptionProps<T> {
  value: T;
  children: ReactNode;
  className?: string;
}

export function RadioGroupOption<T>({ value, children, className = '' }: RadioGroupOptionProps<T>) {
  return (
    <HeadlessRadioGroup.Option
      value={value}
      className={({ checked }) =>
        `relative flex cursor-pointer rounded-2xl px-4 py-3 border backdrop-blur-sm transition-all focus:outline-none
        ${checked
          ? 'bg-indigo-600/20 border-indigo-500 text-white'
          : 'bg-black/20 border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white'
        } ${className}`
      }
    >
      {children}
    </HeadlessRadioGroup.Option>
  );
}
