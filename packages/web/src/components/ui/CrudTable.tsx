/**
 * CrudTable Component
 *
 * Generic table with create, edit, delete actions for lightweight domains
 */

import React, { useState } from 'react';
import styles from './CrudTable.module.css';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { ConfirmDialog } from './ConfirmDialog';

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (item: T) => React.ReactNode;
}

export interface CrudTableProps<T extends { id: string | number }> {
  title: string;
  items: T[];
  columns: ColumnDef<T>[];
  isLoading: boolean;
  onCreate: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void | Promise<void>;
  emptyMessage?: string;
  emptyAction?: string;
  getRowKey?: (item: T) => string | number;
}

export function CrudTable<T extends { id: string | number }>({
  title,
  items,
  columns,
  isLoading,
  onCreate,
  onEdit,
  onDelete,
  emptyMessage = 'No items yet',
  emptyAction = 'Create',
  getRowKey = (item) => item.id,
}: CrudTableProps<T>): React.ReactElement {
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(deleteTarget);
      setDeleteTarget(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setDeleteError(`Delete failed: ${message}`);
    } finally {
      setDeleting(false);
    }
  };

  const getCellValue = (item: T, column: ColumnDef<T>): React.ReactNode => {
    if (column.render) {
      return column.render(item);
    }
    const value = item[column.key as keyof T];
    if (value === null || value === undefined) return '—';
    return String(value);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <Button variant="secondary" size="sm" onClick={onCreate}>
            + {emptyAction}
          </Button>
        </div>
        <EmptyState
          title={emptyMessage}
          action={{ label: `Create ${title.toLowerCase()}`, onClick: onCreate }}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <Button variant="secondary" size="sm" onClick={onCreate}>
          + Add
        </Button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} style={{ width: col.width }}>
                  {col.header}
                </th>
              ))}
              <th style={{ width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={getRowKey(item)}>
                {columns.map((col) => (
                  <td key={String(col.key)}>{getCellValue(item, col)}</td>
                ))}
                <td className={styles.actions}>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(item)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteError && <div className={styles.error}>{deleteError}</div>}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        loading={deleting}
      />
    </div>
  );
}
