/**
 * Sidebar Component
 *
 * Main navigation sidebar with module links
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from '../Icon';
import styles from './Sidebar.module.css';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/bible', label: 'Story Bible', icon: 'book' },
  { to: '/plot', label: 'Plot', icon: 'plot' },
  { to: '/write', label: 'Write', icon: 'pen' },
  { to: '/export', label: 'Export', icon: 'download' },
  { to: '/intake', label: 'Intake', icon: 'sparkle' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

export function Sidebar(): React.ReactElement {
  return (
    <aside className={styles.sidebar}>
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
          >
            <span className={styles.icon}>
              <Icon name={item.icon} />
            </span>
            <span className={styles.label}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.status}>
          <span className={styles.statusDot} />
          <span className={styles.statusText}>Ready</span>
        </div>
      </div>
    </aside>
  );
}
