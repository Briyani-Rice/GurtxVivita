import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Material, Compartment } from '../types';

interface MaterialDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (material: Omit<Material, 'id' | 'createdAt'>) => void;
    material?: Material | null;
    compartments: Compartment[];
    selectedCompartmentId?: string;
}

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
        compartmentId: ''
    });

    useEffect(() => {
        if (material) {
            setFormData({
                name: material.name,
                description: material.description,
                quantity: material.quantity,
                unit: material.unit,
                compartmentId: material.compartmentId
            });
        } else {
            setFormData({
                name: '',
                description: '',
                quantity: 0,
                unit: 'pcs',
                compartmentId: selectedCompartmentId || ''
            });
        }
    }, [material, selectedCompartmentId, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {material ? 'Edit Material' : 'Add Material'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-gray-100 text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Material Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Cardboard, Coloured Paper"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Additional details..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                                Quantity *
                            </label>
                            <input
                                type="number"
                                id="quantity"
                                required
                                min="0"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                                Unit *
                            </label>
                            <select
                                id="unit"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <label htmlFor="compartment" className="block text-sm font-medium text-gray-700 mb-1">
                            Compartment *
                        </label>
                        <select
                            id="compartment"
                            required
                            value={formData.compartmentId}
                            onChange={(e) => setFormData({ ...formData, compartmentId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select compartment...</option>
                            {compartments.map((comp) => (
                                <option key={comp.id} value={comp.id}>
                                    {comp.number} - {comp.name}
                                </option>
                            ))}
                        </select>
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
                            {material ? 'Update' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
