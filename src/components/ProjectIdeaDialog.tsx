import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { MakerItem, MakerProjectIdea } from './makerspaceData';
import type { ProjectIdeaInput } from '../services/firebaseInventory';
import { useI18n } from '../i18n/i18n';

interface ProjectIdeaDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (idea: ProjectIdeaInput) => void;
    idea?: MakerProjectIdea | null;
    items: MakerItem[];
}

const styles: Record<string, CSSProperties> = {
    overlay: {
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(15, 23, 42, 0.52)',
    },
    panel: {
        width: 'min(100%, 480px)',
        maxHeight: 'calc(100vh - 40px)',
        overflow: 'auto',
        border: '1px solid var(--viventory-border)',
        borderRadius: 6,
        background: 'var(--viventory-surface)',
        color: 'var(--viventory-text)',
        boxShadow: '0 22px 60px rgba(15, 23, 42, 0.24)',
        padding: 22,
        fontFamily: '"SF Pro Text", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 16,
    },
    title: {
        margin: 0,
        fontSize: 19,
        lineHeight: 1.2,
        fontWeight: 700,
    },
    closeButton: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        border: '1px solid var(--viventory-border)',
        borderRadius: 4,
        background: 'var(--viventory-surface)',
        color: 'var(--viventory-muted-text)',
        cursor: 'pointer',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
    },
    label: {
        display: 'block',
        marginBottom: 5,
        color: 'var(--viventory-muted-text)',
        fontSize: 13,
        fontWeight: 650,
    },
    field: {
        boxSizing: 'border-box',
        width: '100%',
        border: '1px solid var(--viventory-border)',
        borderRadius: 4,
        background: 'var(--viventory-surface)',
        color: 'var(--viventory-text)',
        padding: '9px 10px',
        font: 'inherit',
        outline: 'none',
    },
    itemPicker: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 6,
        maxHeight: 180,
        overflow: 'auto',
        border: '1px solid var(--viventory-border)',
        borderRadius: 4,
        padding: 10,
    },
    itemOption: {
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
    },
    actions: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        paddingTop: 6,
    },
    secondaryButton: {
        minHeight: 38,
        border: '1px solid var(--viventory-border)',
        borderRadius: 4,
        background: 'var(--viventory-surface)',
        color: 'var(--viventory-text)',
        fontWeight: 650,
        cursor: 'pointer',
    },
    primaryButton: {
        minHeight: 38,
        border: '1px solid var(--viventory-welcome-accent)',
        borderRadius: 4,
        background: 'var(--viventory-welcome-accent)',
        color: '#1f1300',
        fontWeight: 700,
        cursor: 'pointer',
    },
};

const emptyForm = {
    name: '',
    summary: '',
    difficulty: 'Starter' as MakerProjectIdea['difficulty'],
    stepsText: '',
    requiredItemIds: [] as string[],
};

export function ProjectIdeaDialog({ isOpen, onClose, onSave, idea, items }: ProjectIdeaDialogProps) {
    const { t } = useI18n();
    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => {
        if (idea) {
            setFormData({
                name: idea.name,
                summary: idea.summary,
                difficulty: idea.difficulty,
                stepsText: idea.steps.join('\n'),
                requiredItemIds: idea.requiredItemIds,
            });
        } else {
            setFormData(emptyForm);
        }
    }, [idea, isOpen]);

    const toggleItem = (itemId: string) => {
        setFormData(prev => ({
            ...prev,
            requiredItemIds: prev.requiredItemIds.includes(itemId)
                ? prev.requiredItemIds.filter(id => id !== itemId)
                : [...prev.requiredItemIds, itemId],
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name: formData.name,
            summary: formData.summary,
            difficulty: formData.difficulty,
            requiredItemIds: formData.requiredItemIds,
            steps: formData.stepsText
                .split('\n')
                .map(step => step.trim())
                .filter(Boolean),
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} role="presentation">
            <div style={styles.panel} role="dialog" aria-modal="true" aria-labelledby="project-idea-dialog-title">
                <div style={styles.header}>
                    <h2 id="project-idea-dialog-title" style={styles.title}>
                        {idea ? t('dialog.idea.editTitle') : t('dialog.idea.addTitle')}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        style={styles.closeButton}
                        aria-label={t('dialog.close')}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div>
                        <label htmlFor="idea-name" style={styles.label}>
                            {t('dialog.idea.name')}
                        </label>
                        <input
                            type="text"
                            id="idea-name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={styles.field}
                            placeholder={t('dialog.idea.namePlaceholder')}
                        />
                    </div>

                    <div>
                        <label htmlFor="idea-summary" style={styles.label}>
                            {t('dialog.idea.summary')}
                        </label>
                        <textarea
                            id="idea-summary"
                            value={formData.summary}
                            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                            style={styles.field}
                            placeholder={t('dialog.idea.summaryPlaceholder')}
                            rows={2}
                        />
                    </div>

                    <div>
                        <label htmlFor="idea-difficulty" style={styles.label}>
                            {t('dialog.idea.difficulty')}
                        </label>
                        <select
                            id="idea-difficulty"
                            value={formData.difficulty}
                            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as MakerProjectIdea['difficulty'] })}
                            style={styles.field}
                        >
                            <option value="Starter">{t('dialog.idea.difficultyStarter')}</option>
                            <option value="Builder">{t('dialog.idea.difficultyBuilder')}</option>
                            <option value="Challenge">{t('dialog.idea.difficultyChallenge')}</option>
                        </select>
                    </div>

                    <div>
                        <span style={styles.label}>{t('dialog.idea.itemsNeeded')}</span>
                        <div style={styles.itemPicker}>
                            {items.map(item => (
                                <label key={item.id} style={styles.itemOption}>
                                    <input
                                        type="checkbox"
                                        checked={formData.requiredItemIds.includes(item.id)}
                                        onChange={() => toggleItem(item.id)}
                                    />
                                    {item.name}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="idea-steps" style={styles.label}>
                            {t('dialog.idea.steps')}
                        </label>
                        <textarea
                            id="idea-steps"
                            value={formData.stepsText}
                            onChange={(e) => setFormData({ ...formData, stepsText: e.target.value })}
                            style={styles.field}
                            placeholder={t('dialog.idea.stepsPlaceholder')}
                            rows={4}
                        />
                    </div>

                    <div style={styles.actions}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={styles.secondaryButton}
                        >
                            {t('dialog.cancel')}
                        </button>
                        <button
                            type="submit"
                            style={styles.primaryButton}
                        >
                            {idea ? t('dialog.update') : t('dialog.add')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
