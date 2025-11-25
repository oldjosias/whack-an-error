import matplotlib.pyplot as plt
import numpy as np

def surface_code(d : int):
    # data qubits which can have errors
    data_qubits = []
    nq = 0
    for row in range(d):
        for col in range(d):
            data_qubits += [{'idx' : nq, 'row' : row, 'col' : col}]
            nq += 1
    for row in range(d-1):
        for col in range(d-1):
            data_qubits += [{'idx' : nq, 'row' : row+0.5, 'col' : col+0.5}]
            nq += 1
    
    def neighbor(qubit, row, col):
        up = (qubit['row'] == row-0.5 and qubit['col'] == col)
        down = (qubit['row'] == row+0.5 and qubit['col'] == col)
        left = (qubit['row'] == row and qubit['col'] == col-0.5)
        right = (qubit['row'] == row and qubit['col'] == col+0.5)
        return up or down or left or right
    
    # X stabilizers
    stabilizers = []
    ns = 0
    for row in range(d):
        for col in range(d-1):
            stabilizers += [{'idx' : ns, 'row' : row, 'col' : col+0.5, 'neighbors' : [d for d in data_qubits if neighbor(d,row,col+0.5)]}]
            ns += 1
    H = np.zeros((ns,nq), dtype=int)
    for s in range(ns):
        H[s,[q['idx'] for q in stabilizers[s]['neighbors']]] = 1
    
    L = np.zeros(nq, dtype=int)
    L[[q['idx'] for q in data_qubits if q['col']==0]]=1
    
    return data_qubits, stabilizers, H, L

def main():
    d = 3
    n_qubits = d**2 + (d-1)**2
    data_qubtis, stabilizers, H, L = surface_code(d)
    
    levels = np.linspace(0.01,0.15,10)
    n_rounds = 3
    for level in levels:
        print(f'*--- Level p = {level} ---*')
        n_rounds_with_syndrome = 0
        n_rounds_without_syndrome = 0
        n_logical_errors = 0
        while n_rounds_with_syndrome < n_rounds:
            error = np.random.choice([0, 1], size=n_qubits, p=[1 - level, level])
            # print(error, error.shape)
            # print(H.shape)
            syndrome = H@error%2
            if np.sum(syndrome) == 0:
                n_rounds_without_syndrome += 1
                if np.sum(error@L)%2 != 0:
                    n_logical_errors += 1
            else:
                print(f'* Run {n_rounds_with_syndrome+1}/{n_rounds}')
                n_rounds_with_syndrome += 1
                current_syndrome = syndrome
                correction = np.zeros_like(error)
                residual_error = error
                while np.sum(current_syndrome)!=0:
                    # Helper to print ASCII art of correction and syndrome
                    def _print_ascii_state(with_error : bool = False):
                        h = 2 * d - 1
                        w = 2 * d - 1

                        # Cell widths so indices fit (room for brackets/star highlight)
                        cw_data = max(len(str(n_qubits - 1)) + 2, 3)
                        cw_stab = max(len(str(len(stabilizers) - 1)) + 2, 3)

                        data_canvas = [[' ' * cw_data for _ in range(w)] for _ in range(h)]
                        synd_canvas = [[' ' * cw_stab for _ in range(w)] for _ in range(h)]

                        # Data qubits and stabilizers with indices; bracket those currently flipped and star those with syndrome=1
                        for q in data_qubtis:
                            rr = int(round(2 * q['row']))
                            cc = int(round(2 * q['col']))
                            idx = q['idx']
                    
                            if with_error:
                                if correction[idx] % 2 and error[idx]%2:
                                    label = f"[<{idx}>]" 
                                elif  error[idx]%2:
                                    label = f"<{idx}>" 
                                elif correction[idx] % 2 :
                                    label = f"[{idx}]" 
                                else:
                                    label = str(idx)
                            else:
                                label = f"[{idx}]" if correction[idx] % 2 else str(idx)
                            cw_data = max(cw_data, len(label))
                            data_canvas[rr][cc] = label.rjust(cw_data)

                        for s in stabilizers:
                            rr = int(round(2 * s['row']))
                            cc = int(round(2 * s['col']))
                            idx = s['idx']
                            label = f"*" if int(current_syndrome[idx]) else " "
                            synd_canvas[rr][cc] = label.rjust(cw_stab)[:cw_stab]

                        # Combine data and stabilizer canvases for printing
                        combined_canvas = [[' ' * max(cw_data, cw_stab) for _ in range(w)] for _ in range(h)]
                        for r in range(h):
                            for c in range(w):
                                if data_canvas[r][c].strip():
                                    combined_canvas[r][c] = data_canvas[r][c]
                                elif synd_canvas[r][c].strip():
                                    combined_canvas[r][c] = synd_canvas[r][c]

                        print("Combined Data Qubits and Stabilizers (indices; bracketed = flipped, starred = syndrome 1):")
                        for row in combined_canvas:
                            print("".join(row))


                    _print_ascii_state(with_error=False)

                    # print(f"Current syndrome (indices with 1): {np.where(current_syndrome == 1)[0].tolist()}")
                    user_input = input(f"Enter qubit index to flip [0..{n_qubits-1}] (or 'q' to quit): ").strip()
                    if user_input.lower() in ("q", "quit", "exit"):
                        print("Exiting correction loop.")
                        break
                    try:
                        idx = int(user_input)
                    except ValueError:
                        print("Invalid input. Enter an integer index.")
                        continue
                    if idx < 0 or idx >= n_qubits:
                        print(f"Index out of range. Valid: 0..{n_qubits-1}")
                        continue

                    # Apply correction flip on the chosen qubit
                    correction[idx] += 1
                    correction[idx] %= 2
                    residual_error = (error + correction) % 2
                    current_syndrome = (H @ residual_error) % 2

                    # Print ASCII art after each selection
                    _print_ascii_state()

                    print(f"Flipped qubit {idx}. Remaining syndrome weight: {int(np.sum(current_syndrome))}")

                    
                _print_ascii_state(with_error=True)
                print("Syndrome cleared.")
                if (residual_error @ L) % 2 != 0:
                    n_logical_errors += 1
                    print("Logical Error")
                else:
                    print("Success")
                
                print(f"Current statistics:")
                print(f"  Logical Errors: {n_logical_errors}")
                print(f"  Runs without Syndrome: {n_rounds_without_syndrome}")
                print(f"  Total Runs: {n_rounds_with_syndrome + n_rounds_without_syndrome}")
                print(f"  Runs with Syndrome: {n_rounds_with_syndrome}")
                if n_rounds_with_syndrome > 0:
                    logical_error_rate = n_logical_errors / (n_rounds_with_syndrome + n_rounds_without_syndrome)
                    print(f"  Logical Error Rate: {logical_error_rate:.2%}")
                else:
                    print(f"  Logical Error Rate: N/A")
                
                input("Press Enter to proceed to the next round...")
        print(f"*--- Summary: p = {level} ---*")
        print(f"  Logical Errors: {n_logical_errors}")
        print(f"  Runs without Syndrome: {n_rounds_without_syndrome}")
        print(f"  Total Runs: {n_rounds_with_syndrome + n_rounds_without_syndrome}")
        print(f"  Runs with Syndrome: {n_rounds_with_syndrome}")
        if n_rounds_with_syndrome > 0:
            logical_error_rate = n_logical_errors / (n_rounds_with_syndrome + n_rounds_without_syndrome)
            print(f"  Logical Error Rate: {logical_error_rate:.2%}")
        else:
            print(f"  Logical Error Rate: N/A")
            # print(syndrome,syndrome.shape)
        
    # # Plot data qubits
    # data_rows = [q['row'] for q in data_qubtis]
    # data_cols = [q['col'] for q in data_qubtis]
    # data_indices = [q['idx'] for q in data_qubtis]
    
    # # Plot stabilizers
    # stab_rows = [s['row'] for s in stabilizers]
    # stab_cols = [s['col'] for s in stabilizers]
    # stab_indices = [s['idx'] for s in stabilizers]
    
    # plt.figure(figsize=(8, 8))
    # plt.scatter(data_cols, data_rows, s=200, c='blue', marker='o', label='Data Qubits')
    # plt.scatter(stab_cols, stab_rows, s=200, c='red', marker='s', label='Stabilizers')
    
    # # Annotate with indices
    # for i, idx in enumerate(data_indices):
    #     plt.annotate(str(idx), (data_cols[i], data_rows[i]), ha='center', va='center', color='white', fontweight='bold')
    # for i, idx in enumerate(stab_indices):
    #     plt.annotate(str(idx), (stab_cols[i], stab_rows[i]), ha='center', va='center', color='white', fontweight='bold')
    
    # plt.xlabel('Column')
    # plt.ylabel('Row')
    # plt.title('Surface Code Layout')
    # plt.legend()
    # plt.grid(True, alpha=0.3)
    # plt.axis('equal')
    # plt.show()
    
    # plt.matshow(H, cmap='Greys')
    # plt.show()

if __name__ == '__main__':
    main()