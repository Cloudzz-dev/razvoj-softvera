'use client';

import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | Option)[];
  placeholder?: string;
  label?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  label,
}: SelectProps) {
  const normalizedOptions: Option[] = options.map((option) =>
    typeof option === 'string' ? { label: option, value: option } : option
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-zinc-400 mb-1.5 ml-1">
          {label}
        </label>
      )}
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-default rounded-full bg-black/20 py-3 pl-4 pr-10 text-left border border-white/10 backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 sm:text-sm text-white">
            <span className="block truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown
                className="h-5 w-5 text-zinc-500"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-2xl bg-black/90 border border-white/10 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm backdrop-blur-xl z-50">
              {normalizedOptions.map((option, index) => (
                <Listbox.Option
                  key={index}
                  className={({ active }) =>
                    cn(
                      'relative cursor-default select-none py-2 pl-10 pr-4 transition-colors',
                      active ? 'bg-white/10 text-white' : 'text-zinc-300'
                    )
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={cn(
                          'block truncate',
                          selected ? 'font-medium' : 'font-normal'
                        )}
                      >
                        {option.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-400">
                          <Check className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
