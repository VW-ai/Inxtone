/**
 * Select Component
 *
 * Dropdown selector following design system
 */

import React from 'react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  error?: boolean;
}

export function Select({
  options,
  size = 'md',
  placeholder,
  error = false,
  className,
  ...props
}: SelectProps): React.ReactElement {
  const classNames = [styles.select, styles[size], error ? styles.error : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <select className={classNames} {...props}>
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
