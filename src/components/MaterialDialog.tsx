import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Material, Compartment } from '../types';
import type { CSSProperties } from 'react';

interface MaterialDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (material: Omit<Material, 'id' | 'createdAt'>) => void;
    material?: Material | null;
    compartments: Compartment[];
    selectedCompartmentId?: string;
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
        width: 'min(100%, 440px)',
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
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
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

export function MaterialDialog({
                                   isOpen,
                                   onClose,
                                   onSave,
                                   material,
                                   compartments,
                                   selectedCompartmentId
                               }: MaterialDialogProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        quantity: 0,
        unit: 'pcs',
        compartmentId: '',
        needsAdult: false,
        instructionsText: '',
        imageUrl: '',
        videoUrl: ''
    });

    useEffect(() => {
        if (material) {
            setFormData({
                name: material.name,
                description: material.description,
                quantity: material.quantity,
                unit: material.unit,
                compartmentId: material.compartmentId,
                needsAdult: material.safetyLevel === 'adult',
                instructionsText: (material.instructions ?? []).join('\n'),
                imageUrl: material.imageUrl ?? '',
                videoUrl: material.videoUrl ?? ''
            });
        } else {
            setFormData({
                name: '',
                description: '',
                quantity: 0,
                unit: 'pcs',
                compartmentId: selectedCompartmentId || '',
                needsAdult: false,
                instructionsText: '',
                imageUrl: '',
                videoUrl: ''
            });
        }
    }, [material, selectedCompartmentId, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { needsAdult, instructionsText, imageUrl, videoUrl, ...base } = formData;
        onSave({
            ...base,
            // Saved explicitly (never undefined) so staff can also unflag a tool.
            safetyLevel: needsAdult ? 'adult' : 'normal',
            instructions: instructionsText
                .split('\n')
                .map(step => step.trim())
                .filter(Boolean),
            // Omit blanks so Firestore docs stay clean (undefined is stripped on write).
            imageUrl: imageUrl.trim() || undefined,
            videoUrl: videoUrl.trim() || undefined
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} role="presentation">
            <div style={styles.panel} role="dialog" aria-modal="true" aria-labelledby="material-dialog-title">
                <div style={styles.header}>
                    <h2 id="material-dialog-title" style={styles.title}>
                        {material ? 'Edit Material' : 'Add Material'}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        style={styles.closeButton}
                        aria-label="Close material dialog"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <div>
                        <label htmlFor="name" style={styles.label}>
                            Material Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={styles.field}
                            placeholder="e.g., Cardboard, Coloured Paper"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" style={styles.label}>
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            style={styles.field}
                            placeholder="Additional details..."
                            rows={3}
                        />
                    </div>

                    <div style={styles.grid}>
                        <div>
                            <label htmlFor="quantity" style={styles.label}>
                                Quantity *
                            </label>
                            <input
                                type="number"
                                id="quantity"
                                required
                                min="0"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                style={styles.field}
                            />
                        </div>

                        <div>
                            <label htmlFor="unit" style={styles.label}>
                                Unit *
                            </label>
                            <select
                                id="unit"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                style={styles.field}
                            >
                                <option value="pcs">pcs</option>
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                                <option value="L">L</option>
                                <option value="mL">mL</option>
                                <option value="m">m</option>
                                <option value="cm">cm</option>
                                <option value="box">box</option>
                                <option value="pack">pack</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="compartment" style={styles.label}>
                            Compartment *
                        </label>
                        <select
                            id="compartment"
                            required
                            value={formData.compartmentId}
                            onChange={(e) => setFormData({ ...formData, compartmentId: e.target.value })}
                            style={styles.field}
                        >
                            <option value="">Select compartment...</option>
                            {compartments.map((comp) => (
                                <option key={comp.id} value={comp.id}>
                                    {comp.number} - {comp.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="instructions" style={styles.label}>
                            How to use it (one step per line)
                        </label>
                        <textarea
                            id="instructions"
                            value={formData.instructionsText}
                            onChange={(e) => setFormData({ ...formData, instructionsText: e.target.value })}
                            style={styles.field}
                            placeholder={'Pick a sheet that is not bent.\nMark your shape before cutting.'}
                            rows={4}
                        />
                    </div>

                    <div style={styles.grid}>
                        <div>
                            <label htmlFor="imageUrl" style={styles.label}>
                                Image link
                            </label>
                            <input
                                type="url"
                                id="imageUrl"
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                style={styles.field}
                                placeholder="https://..."
                            />
                        </div>

                        <div>
                            <label htmlFor="videoUrl" style={styles.label}>
                                Video link
                            </label>
                            <input
                                type="url"
                                id="videoUrl"
                                value={formData.videoUrl}
                                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                style={styles.field}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 0, cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={formData.needsAdult}
                            onChange={(e) => setFormData({ ...formData, needsAdult: e.target.checked })}
                        />
                        Needs adult supervision — children see a safety warning before instructions
                    </label>

                    <div style={styles.actions}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={styles.secondaryButton}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={styles.primaryButton}
                        >
                            {material ? 'Update' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
