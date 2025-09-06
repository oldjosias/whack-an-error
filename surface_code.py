from dataclasses import dataclass
from functools import cache
import numpy as np
from termcolor import colored

@dataclass
class Qubit:
        index : int
        row : int
        col : int
        typ : str
        
        @property
        def coordinate(self) -> tuple[int]:
                return (self.row,self.col)

        def __hash__(self) -> int:
                return self.index
        
        def neighbors_dict(self, qubits : list['Qubit']) -> dict[str,'Qubit']:
                return {'N':[q for q in qubits if (q.row == self.row-1 and q.col == self.col)],
                        'E':[q for q in qubits if (q.row == self.row and q.col == self.col+1)],
                        'S':[q for q in qubits if (q.row == self.row+1 and q.col == self.col)],
                        'W':[q for q in qubits if (q.row == self.row and q.col == self.col-1)]}
        
        def neighbors(self, qubits : list['Qubit']) -> list['Qubit']:
                return [q for q in qubits if (q.row == self.row-1 and q.col == self.col) 
                        or (q.row == self.row and q.col == self.col+1)
                        or (q.row == self.row+1 and q.col == self.col)
                        or (q.row == self.row and q.col == self.col-1)]
                
                

class SurfaceCodePatch:
        def __init__(self, d : int) -> None:
                self.d = d

                self.data_qubits : list[Qubit]
                self.x_ancilla_qubits : list[Qubit]
                self.all_qubits : list[Qubit]
                
                self.data_qubits, self.x_ancilla_qubits = self._generate_qubits(d=self.d)
                self.all_qubits = self.data_qubits + self.x_ancilla_qubits
                self.ancilla_qubits = {'X' : self.x_ancilla_qubits}
                
                
                self.data_qubit_odd_rows = [q for q in self.data_qubits if q.row%2==1]
                self.data_qubit_even_rows = [q for q in self.data_qubits if q.row%2==0]
                
                self.index_to_qubit_map = {q.index : q for q in self.all_qubits}
                self.coordinate_to_qubit_map = {q.coordinate : q for q in self.all_qubits }
                self.coordinate_to_index_map = {q.coordinate : q.index for q in self.all_qubits }
                self.qubit_coordinates = [q.coordinate for q in self.all_qubits]
               
                self.data_qubit_indices = [q.index for q in self.data_qubits]
                self.x_ancilla_qubit_indices = [q.index for q in self.x_ancilla_qubits]
                self.all_qubit_indices = [q.index for q in self.all_qubits]
                
                # pre-calculate neighbors
                self.x_ancilla_neighbors = {q : q.neighbors_dict(self.all_qubits) for q in self.x_ancilla_qubits}
                
                self.n_x_checks = len(self.x_ancilla_qubits) 
                self.n_checks = self.n_x_checks
                self.n_data_qubits = len(self.data_qubit_indices)
                
                self.x_stabilizers = self._generate_stabilizers()
                self.stabilizers = {'X' : self.x_stabilizers}
                self.x_logical = self._generate_logicals()
                self.logicals = {'X' : self.x_logical}
                
                self.H_X, self.L_X = self._generate_matrices()
                
                self.x_stabilizer_qubit_indices = [np.argwhere(sx).flatten().tolist() for sx in self.H_X]
                
                self.x_logical_qubit_indices = [np.argwhere(lx).flatten().tolist() for lx in self.L_X]
                self.logical_qubit_indices = {'X' : self.x_logical_qubit_indices}
                
                
                self.syndrome = np.zeros(self.n_x_checks, dtype=int)
                self.error = np.zeros(self.n_data_qubits, dtype=int)
                self.flips = np.zeros(self.n_data_qubits, dtype=int)
                self.initial_error = np.zeros(self.n_data_qubits, dtype=int)
                
        def __repr__(self)-> str:
                s = ''
                max_row = max(self.qubit_coordinates, key=lambda x: x[0])[0]
                max_col = max(self.qubit_coordinates, key=lambda x: x[1])[1]
                max_index = max(self.all_qubit_indices)
                max_typ = max([len(q.typ) for q in self.all_qubits])
                
                max_label = f'({max_row},{max_col}):{max_index} ({max_typ})'
                
                len_placeholder = len(max_label)+4 # add 4 for spacing
                placeholder = ' '*len_placeholder
                
                for row in range(max_row+1):
                        for col in range(max_col+1):
                                if (row,col) in self.qubit_coordinates:
                                        q = self.coordinate_to_qubit_map[(row,col)]
                                        label = f'({row},{col}):' + ' '*(len(f'({max_row},{max_col}):')-len(f'({row},{col}):')) + f'{q.index}'+' '*(len(f'{max_index}')-len(f'{q.index}')) + f'({self.coordinate_to_qubit_map[(row,col)].typ})'
                                        extension = len_placeholder-len(label)
                                        if self.coordinate_to_qubit_map[(row,col)].typ == 'X': label = colored(label, 'red') 
                                        if self.coordinate_to_qubit_map[(row,col)].typ == 'Z': label = colored(label, 'blue') 
                                        label += ' '*extension
                                        s += label
                                else:
                                        s += placeholder
                        s += '\n'
                return s

        def draw(self, show_errors : bool = False) -> str:
                s = ''
                max_row = max(self.qubit_coordinates, key=lambda x: x[0])[0]
                max_col = max(self.qubit_coordinates, key=lambda x: x[1])[1]
                max_index = max(self.all_qubit_indices)
                max_typ = max([len(q.typ) for q in self.all_qubits])
                
                max_label = f'({max_row},{max_col}):{max_index} ({max_typ})'
                
                len_placeholder = len(max_label)+4 # add 4 for spacing
                placeholder = ' '*len_placeholder
                
                for row in range(max_row+1):
                        for col in range(max_col+1):
                                if (row,col) in self.qubit_coordinates:
                                        q = self.coordinate_to_qubit_map[(row,col)]
                                        label = f'({row},{col}):' + ' '*(len(f'({max_row},{max_col}):')-len(f'({row},{col}):')) + f'{q.index}'+' '*(len(f'{max_index}')-len(f'{q.index}')) + f'({self.coordinate_to_qubit_map[(row,col)].typ})'
                                        extension = len_placeholder-len(label)
                                        
                                        if self.coordinate_to_qubit_map[(row,col)].typ == 'd':
                                                if self.error[self.coordinate_to_qubit_map[(row,col)].index] == 1 and show_errors:
                                                        label = colored(label, 'red') 
                                        
                                        if self.coordinate_to_qubit_map[(row,col)].typ == 'X': 
                                                if self.syndrome[self.coordinate_to_qubit_map[(row,col)].index-self.n_data_qubits] == 1:
                                                        label = colored(label, 'green') 
                                        if self.coordinate_to_qubit_map[(row,col)].typ == 'Z': 
                                                label = ' '*len(label)
                                                # label = colored(label, 'blue') 
                                        label += ' '*extension
                                        s += label
                                else:
                                        s += placeholder
                        s += '\n'
                return s

        
        def _generate_qubits(self, d : int) -> tuple[list[Qubit]]:
                

                data_qubits = []
                
                idx = 0
                
                for row in range(2*d-1):
                        for col in range(row%2, 2*d-1, 2):
                                data_qubits += [Qubit(index=idx, row=row, col=col, typ = 'd')]
                                idx += 1
                
                x_ancilla_qubits = []
                

                
                for i,row in enumerate(range(0,2*d-1,2)):
                        for col in range(1, 2*d-1, 2):
                                x_ancilla_qubits += [Qubit(index=idx, row=row, col=col, typ='X')]
                                idx += 1
                                
        
                                        
                return data_qubits, x_ancilla_qubits
        
        def _generate_stabilizers(self):
                x_stabs = []
                
                for q in self.x_ancilla_qubits:
                        x_stabs += [q.neighbors(self.data_qubits)]
                
                
                return x_stabs

        def _generate_logicals(self):
                x_log = []
                
                for row in range(0,2*self.d-1,2):
                        x_l = self.coordinate_to_qubit_map[(row,0)]
                        x_log += [x_l]
                return x_log
        
        @cache
        def _generate_matrices(self):
                H_X = np.zeros((self.n_x_checks,self.n_data_qubits),dtype=int)
                L_X = np.zeros((1,self.n_data_qubits),dtype=int)
                
                for i_s in range(self.n_x_checks):
                        for q in self.x_stabilizers[i_s]:
                                H_X[i_s,q.index] = 1
                for q in self.x_logical:
                        L_X[0,q.index] = 1
                return H_X, L_X
        
        def _generate_error(self, p : float, update_syndrome : bool = True):
                rd = np.random.random(size=self.n_data_qubits)
                error = rd < p
                self.error = error.astype(int)
                self.initial_error = self.error.copy()
                self.flips = np.zeros(self.n_data_qubits, dtype=int)
                
                if update_syndrome:
                        self._update_syndrome()
        
        def _generate_error_with_weight(self, w : int, update_syndrome : bool = True):
                rd = np.random.choice(range(self.n_data_qubits), size=w)
                for r in rd:
                        self.error[r] ^=  1
                
                if update_syndrome:
                        self._update_syndrome()
                
        def _apply_correction(self, correction_indices : list[int], update_syndrome : bool = True):
                for idx in correction_indices:
                        self.flips[idx] ^= 1
                self.error ^= np.eye(self.n_data_qubits)[correction_indices].sum(axis=0).astype(int)
                if update_syndrome:
                        self._update_syndrome()
        
        def _update_syndrome(self):
                self.syndrome = (self.H_X@self.error) % 2
                
        def _check_for_zero_syndrome(self):
                return sum(self.syndrome) == 0

        def _check_for_logical_error(self):
                assert self._check_for_zero_syndrome, "Non-zero syndrome - can't check for logical error"
                return sum((self.L_X@self.error)%2) != 0

        def _clean(self):
                self.syndrome = np.zeros(self.n_x_checks, dtype=int)
                self.error = np.zeros(self.n_data_qubits, dtype=int)
                self.flips = np.zeros(self.n_data_qubits, dtype=int)
                self.initial_error = np.zeros(self.n_data_qubits, dtype=int)
