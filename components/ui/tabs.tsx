'use client';

import { Tab } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';

interface TabsProps {
  children: ReactNode;
  selectedIndex?: number;
  onChange?: (index: number) => void;
  className?: string;
}

export function Tabs({ children, selectedIndex, onChange, className = '' }: TabsProps) {
  return (
    <Tab.Group selectedIndex={selectedIndex} onChange={onChange}>
      <div className={className}>{children}</div>
    </Tab.Group>
  );
}

export function TabList({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <Tab.List className={`flex space-x-1 rounded-full bg-black/20 p-1 border border-white/10 backdrop-blur-sm ${className}`}>
      {children}
    </Tab.List>
  );
}

export function TabItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <Tab as={Fragment}>
      {({ selected }) => (
        <button
          className={`w-full rounded-full py-2.5 text-sm font-medium leading-5 transition-all ring-offset-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/50
            ${selected
              ? 'bg-white/10 text-white shadow'
              : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            } ${className}`}
        >
          {children}
        </button>
      )}
    </Tab>
  );
}

export function TabPanels({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <Tab.Panels className={className}>{children}</Tab.Panels>;
}

export function TabPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <Tab.Panel className={`focus:outline-none ${className}`}>
      {children}
    </Tab.Panel>
  );
}
