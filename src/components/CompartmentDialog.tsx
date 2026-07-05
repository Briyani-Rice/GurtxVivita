import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Compartment } from '../types';

interface CompartmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (compartment: Omit<Compartment, 'id'>) => void;
    compartment?: Compartment | null;
}

const COLORS = [
    '#E3F2FD', // Light Blue
    '#F3E5F5', // Light Purple
    '#E8F5E9', // Light Green
    '#FFF3E0', // Light Orange
    '#FCE4EC', // Light Pink
    '#F1F8E9', // Light Lime
];

export function CompartmentDialog({
                                      isOpen,
                                      onClose,
                                      onSave,
                                      compartment
                                  }: CompartmentDialogProps) {
    const [formData, setFormData] = useState({
        number: '',
        name: '',
        x: 10,
        y: 10,
        width: 20,
        height: 25,
        color: COLORS[0]
    });

    useEffect(() => {
        if (compartment) {
            setFormData({
                number: compartment.number,
                name: compartment.name,
                x: compartment.x,
                y: compartment.y,
                width: compartment.width,
                height: compartment.height,
                color: compartment.color
            });
        } else {
            setFormData({
                number: '',
                name: '',
                x: 10,
                y: 10,
                width: 20,
                height: 25,
                color: COLORS[0]
            });
        }
    }, [compartment, isOpen]);

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
                        {compartment ? 'Edit Compartment' : 'Add Compartment'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-gray-100 text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                                Number *
                            </label>
                            <input
                                type="text"
                                id="number"
                                required
                                value={formData.number}
                                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="1A"
                            />
                        </div>

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                Name *
                            </label>
                            <input
                                type="text"
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Storage A"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="x" className="block text-sm font-medium text-gray-700 mb-1">
                                X Position (%)
                            </label>
                            <input
                                type="number"
                                id="x"
                                min="0"
                                max="80"
                                value={formData.x}
                                onChange={(e) => setFormData({ ...formData, x: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="y" className="block text-sm font-medium text-gray-700 mb-1">
                                Y Position (%)
                            </label>
                            <input
                                type="number"
                                id="y"
                                min="0"
                                max="80"
                                value={formData.y}
                                onChange={(e) => setFormData({ ...formData, y: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-1">
                                Width (%)
                            </label>
                            <input
                                type="number"
                                id="width"
                                min="10"
                                max="50"
                                value={formData.width}
                                onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                                Height (%)
                            </label>
                            <input
                                type="number"
                                id="height"
                                min="10"
                                max="50"
                                value={formData.height}
                                onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Color
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color })}
                                    className={`w-full aspect-square rounded-md border-2 transition-all ${
                                        formData.color === color
                                            ? 'border-blue-600 scale-110 shadow-md'
                                            : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
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
                            {compartment ? 'Update' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
