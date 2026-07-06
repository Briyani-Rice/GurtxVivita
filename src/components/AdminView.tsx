import { useState } from 'react';
import { Plus, CheckCircle, XCircle, Edit2, Trash2 } from 'lucide-react';
import { Material, Compartment, MaterialRequest, FloorData } from '../types';
import { MaterialDialog } from './MaterialDialog';

interface AdminViewProps {
    floors: FloorData[];
    onFloorsChange: (floors: FloorData[]) => void;
    compartments: Compartment[];           // derived from floors in App.tsx
    materials: Material[];
    requests: MaterialRequest[];
    onAddMaterial: (material: Omit<Material, 'id' | 'createdAt'>) => void;
    onEditMaterial: (id: string, material: Omit<Material, 'id' | 'createdAt'>) => void;
    onDeleteMaterial: (id: string) => void;
    onApproveRequest: (id: string) => void;
    onDeclineRequest: (id: string) => void;
    getterEmptyMaterials: () => Material[];
}

export function AdminView({
                              floors,
                              onFloorsChange,
                              compartments,
                              materials,
                              requests,
                              onAddMaterial,
                              onEditMaterial,
                              onDeleteMaterial,
                              onApproveRequest,
                              onDeclineRequest,
                              getterEmptyMaterials,
                          }: AdminViewProps) {
    const [selectedElement, setSelectedElement] = useState<string | null>(
        compartments[0]?.id ?? null
    );
    const [isMaterialDialogOpen, setIsMaterialDialogOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

    // The selected element may be a compartment — look it up
    const selectedCompartment: Compartment | null =
        compartments.find(c => c.id === selectedElement) ?? null;

    const compartmentMaterials = materials.filter(
        m => m.compartmentId === selectedElement
    );

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const emptyMaterials  = getterEmptyMaterials();

    const handleSaveMaterial = (data: Omit<Material, 'id' | 'createdAt'>) => {
        if (editingMaterial) {
            onEditMaterial(editingMaterial.id, data);
            setEditingMaterial(null);
        } else {
            onAddMaterial(data);
        }
    };

    return (
        <div className="space-y-6">

            {/* ── Floor Plan Editor (full width) ── */}
            {/* <FloorPlanEditor
        floors={floors}
        onFloorsChange={onFloorsChange}
        materials={materials}
        selectedElement={selectedElement}
        onElementSelect={setSelectedElement}
      /> */}

            {/* ── Bottom panels ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Empty materials warning */}
                {emptyMaterials.length > 0 && (
                    <div className="lg:col-span-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h3 className="font-semibold text-amber-800 mb-2">
                            ⚠️ Out of Stock ({emptyMaterials.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {emptyMaterials.map(m => (
                                <span
                                    key={m.id}
                                    className="px-2 py-1 bg-amber-100 text-amber-800 text-sm rounded-md"
                                >
                  {m.name}
                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Materials panel */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">
                            {selectedCompartment
                                ? `Materials — ${selectedCompartment.number} ${selectedCompartment.name}`
                                : 'Select a compartment on the map'}
                        </h3>
                        {selectedCompartment && (
                            <button
                                onClick={() => {
                                    setEditingMaterial(null);
                                    setIsMaterialDialogOpen(true);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Material
                            </button>
                        )}
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {!selectedCompartment ? (
                            <p className="text-sm text-gray-400 text-center py-8">
                                Click a compartment on the floor plan to view its materials
                            </p>
                        ) : compartmentMaterials.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">
                                No materials in this compartment
                            </p>
                        ) : (
                            compartmentMaterials.map(material => (
                                <div
                                    key={material.id}
                                    className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900">{material.name}</div>
                                        {material.description && (
                                            <div className="text-sm text-gray-500 truncate">{material.description}</div>
                                        )}
                                        <div className="text-sm font-medium text-gray-800 mt-0.5">
                                            {material.quantity} {material.unit}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 ml-3">
                                        <button
                                            onClick={() => {
                                                setEditingMaterial(material);
                                                setIsMaterialDialogOpen(true);
                                            }}
                                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Delete this material?')) onDeleteMaterial(material.id);
                                            }}
                                            className="p-1.5 rounded-md hover:bg-red-50 text-gray-500 hover:text-red-600"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Pending requests */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Pending Requests</h3>
                        {pendingRequests.length > 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {pendingRequests.length}
              </span>
                        )}
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {pendingRequests.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">No pending requests</p>
                        ) : (
                            pendingRequests.map(request => (
                                <div
                                    key={request.id}
                                    className="p-3 border border-gray-200 rounded-md"
                                >
                                    <div className="font-medium text-gray-900 text-sm">{request.materialName}</div>
                                    <div className="text-sm text-gray-500">Qty: {request.requestedQuantity}</div>
                                    {request.reason && (
                                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">{request.reason}</div>
                                    )}
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => onApproveRequest(request.id)}
                                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-50 text-green-700 text-xs rounded-md hover:bg-green-100 transition-colors"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                                        </button>
                                        <button
                                            onClick={() => onDeclineRequest(request.id)}
                                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-red-50 text-red-700 text-xs rounded-md hover:bg-red-100 transition-colors"
                                        >
                                            <XCircle className="w-3.5 h-3.5" /> Decline
                                        </button>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {new Date(request.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Material dialog */}
            <MaterialDialog
                isOpen={isMaterialDialogOpen}
                onClose={() => { setIsMaterialDialogOpen(false); setEditingMaterial(null); }}
                onSave={handleSaveMaterial}
                material={editingMaterial}
                compartments={compartments}
                selectedCompartmentId={selectedElement ?? undefined}
            />
        </div>
    );
}
