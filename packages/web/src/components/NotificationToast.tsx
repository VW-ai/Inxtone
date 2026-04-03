/**
 * NotificationToast — displays toast notifications from the notification store
 *
 * Renders at the bottom-right of the screen. Auto-dismisses after 5 seconds.
 */

import React from 'react';
import { useNotifications, useRemoveNotification } from '../stores/useNotificationStore';
import styles from './NotificationToast.module.css';

export function NotificationToast(): React.ReactElement | null {
  const notifications = useNotifications();
  const removeNotification = useRemoveNotification();

  if (notifications.length === 0) return null;

  return (
    <div className={styles.container} aria-live="polite" role="status">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`${styles.toast} ${n.type === 'error' ? styles.error : styles.success}`}
        >
          <span className={styles.message}>{n.message}</span>
          <button
            className={styles.dismiss}
            onClick={() => removeNotification(n.id)}
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
