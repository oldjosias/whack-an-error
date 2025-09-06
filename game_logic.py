"""
Game Logic Module for Whack-an-Error
Manages the core game state and logic
"""
from surface_code import SurfaceCodePatch
from threading import Lock
import numpy as np


class GameManager:
    """Manages the surface code game state and operations"""
    
    def __init__(self, initial_d=3):
        self.d = initial_d
        self.surface_code = SurfaceCodePatch(d=self.d)
        self.lock = Lock()
        
    def create_new_round(self, grid_size=None, num_errors=0):
        """Create a new round with specified parameters"""
        with self.lock:
            # Update grid size if provided
            if grid_size and grid_size != self.d and 2 <= grid_size <= 7:
                self.d = grid_size
                self.surface_code = SurfaceCodePatch(d=self.d)
            
            # Calculate error probability
            n_data = self.d**2 + (self.d-1)**2
            p = num_errors / n_data if num_errors > 0 else 0
            
            # Initialize the round
            self.surface_code._clean()
            if p > 0:
                self.surface_code._generate_error(p=p)
            self.surface_code._update_syndrome()
            
            return self.get_game_state(show_errors=False)
    
    def flip_qubit(self, qubit_index):
        """Flip a qubit and return the updated state"""
        with self.lock:
            self.surface_code._apply_correction([qubit_index])
            self.surface_code._update_syndrome()
            
            zero_syndrome = self.surface_code._check_for_zero_syndrome()
            state = self.get_game_state(show_errors=zero_syndrome)
            
            if zero_syndrome:
                state['logical_error'] = int(self.surface_code._check_for_logical_error())
            else:
                state['logical_error'] = 0
                
            return state
    
    def get_game_state(self, show_errors=False):
        """Get current game state for visualization"""
        qubits = []
        for q in self.surface_code.data_qubits:
            qubits.append({
                'index': q.index,
                'row': q.row,
                'col': q.col,
                'error': int(self.surface_code.error[q.index]) if show_errors else 0,
                'actual_error': int(self.surface_code.error[q.index]),
                'initial_error': int(self.surface_code.initial_error[q.index]),
                'flipped': int(self.surface_code.flips[q.index]),
            })
        
        stabilizers = []
        for i, q in enumerate(self.surface_code.x_ancilla_qubits):
            stabilizers.append({
                'index': q.index,
                'row': q.row,
                'col': q.col,
                'excited': int(self.surface_code.syndrome[i]),
            })
        
        return {
            'qubits': qubits,
            'stabilizers': stabilizers,
            'zero_syndrome': int(np.sum(self.surface_code.syndrome) == 0)
        }
