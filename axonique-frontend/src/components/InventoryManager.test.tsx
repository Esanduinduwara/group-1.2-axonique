import { render, screen, fireEvent } from '@testing-library/react';
import InventoryManager from './InventoryManager';
import { updateInventory } from '../services/inventoryApi';

jest.mock('../services/inventoryApi');

test('renders initial stock and handles add', async () => {
  (updateInventory as jest.Mock).mockResolvedValue('Success');
  
  render(<InventoryManager productId={1} variant="L" initialStock={10} />);
  
  expect(screen.getByText(/Current Stock: 10/i)).toBeInTheDocument();
  
  const addButton = screen.getByText('Add');
  fireEvent.click(addButton);
  
  // Mock checking real-time sync
  expect(updateInventory).toHaveBeenCalledWith(1, "L", "ADD", 1, "");
  expect(await screen.findByText(/Current Stock: 11/i)).toBeInTheDocument();
});