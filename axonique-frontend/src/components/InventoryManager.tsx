import React, { useState } from 'react';
import { updateInventory } from '../services/inventoryApi';

interface InventoryManagerProps {
  productId: number;
  variant: string;
  initialStock: number;
}

export default function InventoryManager({ productId, variant, initialStock }: InventoryManagerProps) {
  const [stock, setStock] = useState(initialStock);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (action: 'ADD' | 'REMOVE') => {
    setLoading(true);
    try {
      await updateInventory(productId, variant, action, quantity, reason);
      // Real-time local sync reflecting database changes (SCRUM-54 methodology)
      setStock(prev => action === 'ADD' ? prev + quantity : prev - quantity);
      setReason('');
    } catch (error) {
      console.error(error);
      alert('Error updating stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded shadow-sm flex flex-col gap-3 max-w-sm">
      <h3 className="font-bold text-lg">Manage Stock (Variant: {variant})</h3>
      <div className="flex justify-between items-center">
         <span>Current Stock: <span className={stock <= 10 ? 'text-red-500 font-bold' : ''}>{stock}</span></span>
         {stock <= 10 && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Low Stock</span>}
      </div>
      <div className="flex gap-2">
        <input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="border p-2 rounded w-20" />
        <input type="text" placeholder="Reason (e.g., restock)" value={reason} onChange={e => setReason(e.target.value)} className="border p-2 rounded flex-1" />
      </div>
      <div className="flex gap-2">
        <button onClick={() => handleUpdate('ADD')} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded flex-1 hover:bg-green-700 disabled:opacity-50">
          Add
        </button>
        <button onClick={() => handleUpdate('REMOVE')} disabled={loading || stock < quantity} className="bg-red-600 text-white px-4 py-2 rounded flex-1 hover:bg-red-700 disabled:opacity-50">
          Remove
        </button>
      </div>
    </div>
  );
}