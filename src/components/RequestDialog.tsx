import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Material } from '../types';

interface RequestDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (materialId: string, quantity: number, reason: string) => void;
    materials: Material[];
    preselectedMaterialId?: string;
}

export function RequestDialog({
                                  isOpen,
                                  onClose,
                                  onSubmit,
                                  materials,
                                  preselectedMaterialId
                              }: RequestDialogProps) {
    const [formData, setFormData] = useState({
        materialId: '',
        quantity: 1,
        reason: ''
    });

    useEffect(() => {
        if (preselectedMaterialId) {
            setFormData(prev => ({
                ...prev,
                materialId: preselectedMaterialId
            }));
        }
    }, [preselectedMaterialId, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData.materialId, formData.quantity, formData.reason);
        setFormData({ materialId: '', quantity: 1, reason: '' });
        onClose();
    };

    if (!isOpen) return null;

    const selectedMaterial = materials.find(m => m.id === formData.materialId);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Request Material</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-gray-100 text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="material" className="block text-sm font-medium text-gray-700 mb-1">
                            Material *
                        </label>
                        <select
                            id="material"
                            required
                            value={formData.materialId}
                            onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select material...</option>
                            {materials.map((material) => (
                                <option key={material.id} value={material.id}>
                                    {material.name} (Available: {material.quantity} {material.unit})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity *
                        </label>
                        <input
                            type="number"
                            id="quantity"
                            required
                            min="1"
                            max={selectedMaterial?.quantity || 999}
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {selectedMaterial && (
                            <p className="text-xs text-gray-500 mt-1">
                                Available: {selectedMaterial.quantity} {selectedMaterial.unit}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                            Reason *
                        </label>
                        <textarea
                            id="reason"
                            required
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Why do you need this material?"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Submit Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
