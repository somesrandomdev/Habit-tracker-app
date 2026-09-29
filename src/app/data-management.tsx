import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { exportBackup, importFromJson, importFromPickedFile, resetAllData } from '@/services/backup.service';
import { loadDemoData } from '@/services/demo.service';
import { useAppStore } from '@/stores/useAppStore';

export default function DataManagementScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const refreshAll = useAppStore((s) => s.refreshAll);

  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [pasteJson, setPasteJson] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    const result = await exportBackup();
    setBusy(false);
    setStatus(
      result.ok
        ? { ok: true, text: 'Backup created. Use the share sheet to save or send it.' }
        : { ok: false, text: result.error ?? 'Export failed.' },
    );
  };

  const handleImportFile = async () => {
    setBusy(true);
    const result = await importFromPickedFile();
    setBusy(false);
    if (result.ok) {
      refreshAll();
      setStatus({ ok: true, text: 'Import successful! Your data has been restored.' });
    } else {
      setStatus({ ok: false, text: result.error ?? 'Import failed.' });
    }
  };

  const handleImportPaste = () => {
    if (!pasteJson.trim()) {
      setStatus({ ok: false, text: 'Paste a backup JSON first.' });
      return;
    }
    const result = importFromJson(pasteJson);
    if (result.ok) {
      refreshAll();
      setPasteJson('');
      setStatus({ ok: true, text: 'Import successful! Your data has been restored.' });
    } else {
      setStatus({ ok: false, text: result.error ?? 'Import failed.' });
    }
  };

  const handleDemo = () => {
    const result = loadDemoData();
    if (result.ok) {
      refreshAll();
      setStatus({ ok: true, text: 'Demo data loaded — explore every screen freely.' });
    } else {
      setStatus({ ok: false, text: result.error ?? 'Could not load demo data.' });
    }
  };

  const handleReset = () => {
    const result = resetAllData();
    setConfirmReset(false);
    if (result.ok) {
      refreshAll();
      setStatus({ ok: true, text: 'All data cleared. The app is back to a blank state.' });
    } else {
      setStatus({ ok: false, text: result.error ?? 'Reset failed.' });
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.xl }]}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
    >
      <AppHeader title="Data management" showBack />

      {status ? (
        <AppCard style={{ backgroundColor: status.ok ? colors.successSoft : colors.dangerSoft }}>
          <AppText variant="caption" color={status.ok ? 'success' : 'danger'}>
            {status.text}
          </AppText>
        </AppCard>
      ) : null}

      <SectionTitle title="Export" />
      <AppCard>
        <AppText variant="caption" color="dim" style={styles.hint}>
          Saves every table to a JSON backup file and opens the share sheet. Keep a copy in your
          cloud drive of choice.
        </AppText>
        <AppButton label="Export all data (JSON)" onPress={handleExport} loading={busy} />
      </AppCard>

      <SectionTitle title="Import" />
      <AppCard>
        <AppText variant="caption" color="dim" style={styles.hint}>
          Importing replaces ALL current data with the backup contents. The file is validated
          before anything is changed.
        </AppText>
        <AppButton label="Choose backup file" variant="secondary" onPress={handleImportFile} loading={busy} />
        <View style={styles.divider} />
        <AppText variant="label" color="dim">
          …or paste backup JSON
        </AppText>
        <AppTextInput value={pasteJson} onChangeText={setPasteJson} placeholder='{"app":"FastHabit", ...}' multiline />
        <AppButton label="Import pasted JSON" variant="secondary" onPress={handleImportPaste} />
      </AppCard>

      <SectionTitle title="Demo data" />
      <AppCard>
        <AppText variant="caption" color="dim" style={styles.hint}>
          Loads two weeks of realistic sample data (fasts, challenge, habits, logs, metrics). This
          replaces current data — great for exploring the app.
        </AppText>
        <AppButton label="Load demo data" variant="secondary" onPress={handleDemo} />
      </AppCard>

      <SectionTitle title="Danger zone" />
      <AppCard>
        <AppText variant="caption" color="dim" style={styles.hint}>
          Permanently deletes every profile, fast, challenge, habit, log, and setting on this
          device. Export a backup first if you might want it later.
        </AppText>
        <AppButton label="Reset all data" variant="danger" onPress={() => setConfirmReset(true)} />
      </AppCard>

      <ConfirmDialog
        visible={confirmReset}
        title="Reset everything?"
        message="This permanently deletes all FastHabit data on this device. This cannot be undone."
        confirmLabel="Delete everything"
        danger
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, gap: spacing.md },
  hint: { marginBottom: spacing.md },
  divider: { height: spacing.lg },
});
