/**
 * EntityEditModal
 *
 * Modal for editing extracted entity fields before committing.
 * Dynamically renders form fields based on entity type.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/forms/Modal';
import { FormField } from '../../components/forms/FormField';
import { Input } from '../../components/forms/Input';
import { Textarea } from '../../components/forms/Textarea';
import { Select } from '../../components/ui/Select';
import { useIntakeStore, useIntakeEditingKey, parseEntityKey } from '../../stores/useIntakeStore';
import type { DecomposeResult } from '@inxtone/core';

/** Get entity data from DecomposeResult by type and index */
function getEntityData(
  result: DecomposeResult,
  entityType: string,
  index: number
): Record<string, unknown> | null {
  const PLURAL: Record<string, keyof DecomposeResult> = {
    character: 'characters',
    relationship: 'relationships',
    location: 'locations',
    faction: 'factions',
    foreshadowing: 'foreshadowing',
    arc: 'arcs',
    hook: 'hooks',
    timeline: 'timeline',
  };

  const key = PLURAL[entityType];
  if (!key) return null;
  const arr = result[key];
  if (!Array.isArray(arr)) return null;
  return (arr[index] as unknown as Record<string, unknown>) ?? null;
}

/** Field definition for dynamic form rendering */
interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  options?: Array<{ value: string; label: string }>;
}

/** Fields per entity type */
const ENTITY_FIELDS: Record<string, FieldDef[]> = {
  character: [
    { key: 'name', label: 'Name', type: 'text' },
    {
      key: 'role',
      label: 'Role',
      type: 'select',
      options: [
        { value: 'main', label: 'Main' },
        { value: 'supporting', label: 'Supporting' },
        { value: 'mentor', label: 'Mentor' },
        { value: 'antagonist', label: 'Antagonist' },
        { value: 'comic', label: 'Comic Relief' },
        { value: 'love', label: 'Love Interest' },
        { value: 'minor', label: 'Minor' },
      ],
    },
    { key: 'appearance', label: 'Appearance', type: 'textarea' },
    { key: 'conflictType', label: 'Conflict Type', type: 'text' },
  ],
  relationship: [
    { key: 'sourceName', label: 'Source Character', type: 'text' },
    { key: 'targetName', label: 'Target Character', type: 'text' },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'ally', label: 'Ally' },
        { value: 'rival', label: 'Rival' },
        { value: 'mentor', label: 'Mentor' },
        { value: 'family', label: 'Family' },
        { value: 'romantic', label: 'Romantic' },
        { value: 'enemy', label: 'Enemy' },
        { value: 'neutral', label: 'Neutral' },
      ],
    },
    { key: 'joinReason', label: 'Join Reason', type: 'textarea' },
  ],
  location: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'type', label: 'Type', type: 'text' },
    { key: 'significance', label: 'Significance', type: 'textarea' },
    { key: 'atmosphere', label: 'Atmosphere', type: 'textarea' },
  ],
  faction: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'type', label: 'Type', type: 'text' },
    { key: 'status', label: 'Status', type: 'text' },
    { key: 'leaderName', label: 'Leader Name', type: 'text' },
    {
      key: 'stanceToMC',
      label: 'Stance to MC',
      type: 'select',
      options: [
        { value: 'friendly', label: 'Friendly' },
        { value: 'neutral', label: 'Neutral' },
        { value: 'hostile', label: 'Hostile' },
      ],
    },
  ],
  arc: [
    { key: 'name', label: 'Name', type: 'text' },
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'main', label: 'Main Arc' },
        { value: 'sub', label: 'Sub Arc' },
      ],
    },
    { key: 'mainArcRelation', label: 'Relation to Main Arc', type: 'text' },
  ],
  foreshadowing: [
    { key: 'content', label: 'Content', type: 'textarea' },
    { key: 'plantedText', label: 'Planted Text', type: 'textarea' },
    {
      key: 'term',
      label: 'Term',
      type: 'select',
      options: [
        { value: 'short', label: 'Short-term' },
        { value: 'medium', label: 'Medium-term' },
        { value: 'long', label: 'Long-term' },
      ],
    },
  ],
  hook: [
    {
      key: 'type',
      label: 'Type',
      type: 'select',
      options: [
        { value: 'chapter_end', label: 'Chapter End' },
        { value: 'arc_end', label: 'Arc End' },
        { value: 'volume_end', label: 'Volume End' },
      ],
    },
    { key: 'content', label: 'Content', type: 'textarea' },
  ],
  timeline: [
    { key: 'eventDate', label: 'Event Date', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
};

export function EntityEditModal(): React.ReactElement | null {
  const editingKey = useIntakeEditingKey();
  const { result, editedData, closeEditor, setEditedData, setDecision } = useIntakeStore();
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  // Load entity data when modal opens
  useEffect(() => {
    if (!editingKey || !result) {
      setFormData({});
      return;
    }
    const { entityType, index } = parseEntityKey(editingKey);
    // Use edited data if it exists, otherwise use original
    const existing = editedData[editingKey];
    if (existing) {
      setFormData({ ...existing });
    } else {
      const original = getEntityData(result, entityType, index);
      if (original) setFormData({ ...original });
    }
  }, [editingKey, result, editedData]);

  if (!editingKey || !result) return null;

  const { entityType } = parseEntityKey(editingKey);
  const fields = ENTITY_FIELDS[entityType] ?? [];

  const handleFieldChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setEditedData(editingKey, formData);
    setDecision(editingKey, 'accept');
    closeEditor();
  };

  return (
    <Modal
      isOpen
      title={`Edit ${entityType}`}
      onClose={closeEditor}
      onSubmit={handleSave}
      submitLabel="Save"
    >
      {fields.map((field) => {
        const rawVal = formData[field.key];
        const value = typeof rawVal === 'string' ? rawVal : '';

        if (field.type === 'select' && field.options) {
          return (
            <FormField key={field.key} label={field.label}>
              <Select
                value={value}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                options={field.options}
              />
            </FormField>
          );
        }

        if (field.type === 'textarea') {
          return (
            <FormField key={field.key} label={field.label}>
              <Textarea
                value={value}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                rows={3}
              />
            </FormField>
          );
        }

        return (
          <FormField key={field.key} label={field.label}>
            <Input value={value} onChange={(e) => handleFieldChange(field.key, e.target.value)} />
          </FormField>
        );
      })}
    </Modal>
  );
}
