/**
 * WorldSettings Component
 *
 * Per-section inline editing of world configuration (power system and social rules).
 * No global edit/save toggle — each field saves independently.
 */

import React from 'react';
import {
  Button,
  EmptyState,
  EditableField,
  EditableList,
  LoadingSpinner,
} from '../../components/ui';
import { useWorld, useUpdateWorld } from '../../hooks';
import type { PowerSystem } from '@inxtone/core';
import sharedStyles from './shared.module.css';
import styles from './WorldSettings.module.css';

export function WorldSettings(): React.ReactElement {
  const { data: world, isLoading, error } = useWorld();
  const updateWorld = useUpdateWorld();

  if (isLoading) {
    return <LoadingSpinner text="Loading world settings..." />;
  }

  if (error) {
    return (
      <div className={sharedStyles.error}>
        Failed to load world settings: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  const savePowerSystem = (updates: Partial<PowerSystem>) => {
    const current = world?.powerSystem;
    const powerSystem: PowerSystem = {
      name: current?.name ?? 'Power System',
      ...current,
      ...updates,
    };
    updateWorld.mutate({ powerSystem });
  };

  const saveSocialRules = (rules: Record<string, string>) => {
    updateWorld.mutate({ socialRules: rules });
  };

  const hasContent =
    world?.powerSystem ?? (world?.socialRules && Object.keys(world.socialRules).length > 0);

  if (!hasContent) {
    return (
      <EmptyState
        title="No world settings yet"
        description="Define your world's power system and social rules to maintain consistency."
        action={{
          label: 'Configure World',
          onClick: () => {
            updateWorld.mutate({
              powerSystem: { name: 'Power System' },
              socialRules: {},
            });
          },
        }}
      />
    );
  }

  const socialEntries = Object.entries(world?.socialRules ?? {});

  const handleAddRule = () => {
    const rules = { ...(world?.socialRules ?? {}) };
    rules[`New Rule`] = '';
    saveSocialRules(rules);
  };

  const handleUpdateRuleName = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    const rules = { ...(world?.socialRules ?? {}) };
    const value = rules[oldKey] ?? '';
    delete rules[oldKey];
    rules[newKey] = value;
    saveSocialRules(rules);
  };

  const handleUpdateRuleValue = (key: string, value: string) => {
    const rules = { ...(world?.socialRules ?? {}) };
    rules[key] = value;
    saveSocialRules(rules);
  };

  const handleRemoveRule = (key: string) => {
    const rules = { ...(world?.socialRules ?? {}) };
    delete rules[key];
    saveSocialRules(rules);
  };

  return (
    <div>
      <div className={sharedStyles.sectionHeader}>
        <h2 className={sharedStyles.sectionTitle}>World Settings</h2>
      </div>

      <div className={styles.container}>
        {/* Power System */}
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>Power System</h3>

          <div className={styles.subsection}>
            <EditableField
              label="Name"
              value={world?.powerSystem?.name ?? ''}
              onSave={(name) => savePowerSystem({ name })}
              placeholder="e.g., Cultivation System, Magic Circles..."
            />
          </div>

          <div className={styles.subsection}>
            <EditableList
              label="Levels"
              items={world?.powerSystem?.levels ?? []}
              onSave={(levels) => savePowerSystem({ levels })}
              addLabel="Add level"
              ordered
            />
          </div>

          <div className={styles.subsection}>
            <EditableList
              label="Core Rules"
              items={world?.powerSystem?.coreRules ?? []}
              onSave={(coreRules) => savePowerSystem({ coreRules })}
              addLabel="Add rule"
            />
          </div>

          <div className={styles.subsection}>
            <EditableList
              label="Constraints"
              items={world?.powerSystem?.constraints ?? []}
              onSave={(constraints) => savePowerSystem({ constraints })}
              addLabel="Add constraint"
            />
          </div>
        </div>

        {/* Social Rules */}
        <div className={styles.sectionCard}>
          <h3 className={styles.sectionTitle}>Social Rules</h3>

          {socialEntries.length > 0 ? (
            socialEntries.map(([key, value]) => (
              <div key={key} className={styles.ruleRow}>
                <EditableField
                  value={key}
                  onSave={(newKey) => handleUpdateRuleName(key, newKey)}
                  placeholder="Rule name..."
                  heading
                />
                <EditableField
                  value={value}
                  onSave={(newValue) => handleUpdateRuleValue(key, newValue)}
                  as="textarea"
                  placeholder="Rule description..."
                />
                <button
                  className={styles.removeRule}
                  onClick={() => handleRemoveRule(key)}
                  title="Remove rule"
                  type="button"
                >
                  &times;
                </button>
              </div>
            ))
          ) : (
            <p className={styles.emptyText}>No social rules defined yet.</p>
          )}

          <Button variant="ghost" size="sm" onClick={handleAddRule}>
            + Add Social Rule
          </Button>
        </div>
      </div>
    </div>
  );
}
