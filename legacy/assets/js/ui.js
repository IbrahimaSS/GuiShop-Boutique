/**
 * UI Interaction Scripts
 * Handles Sidebar, Modals, Dropdowns, and Toasts
 */

// --- SIDEBAR TOGGLE ---
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const body = document.body;

function toggleSidebar() {
    if (sidebar && sidebarOverlay) {
        const isClosed = sidebar.classList.contains('-translate-x-full');
        if (isClosed) {
            // Open Sidebar
            sidebar.classList.remove('-translate-x-full');
            sidebarOverlay.classList.remove('hidden');
            setTimeout(() => sidebarOverlay.classList.remove('opacity-0'), 10); // Fade in
            body.classList.add('overflow-hidden'); // Prevent background scrolling
        } else {
            // Close Sidebar
            sidebar.classList.add('-translate-x-full');
            sidebarOverlay.classList.add('opacity-0');
            setTimeout(() => sidebarOverlay.classList.add('hidden'), 300); // Wait for transition
            body.classList.remove('overflow-hidden');
        }
    }
}

// Close sidebar on overlay click
if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', toggleSidebar);
}

// --- DROPDOWN TOGGLE ---
function toggleDropdown(id) {
    const dropdown = document.getElementById(id);
    if (dropdown) {
        const isHidden = dropdown.classList.contains('hidden');
        // Close all other dropdowns first (optional, but good UX)
        document.querySelectorAll('.dropdown-menu').forEach(el => {
            if (el.id !== id) el.classList.add('hidden');
        });

        if (isHidden) {
            dropdown.classList.remove('hidden');
            dropdown.classList.add('animate-scale-in');
        } else {
            dropdown.classList.add('hidden');
            dropdown.classList.remove('animate-scale-in');
        }
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function (event) {
    if (!event.target.closest('.dropdown-trigger')) {
        document.querySelectorAll('.dropdown-menu').forEach(el => {
            el.classList.add('hidden');
        });
    }
});


// --- MODAL SYSTEM ---
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('animate-scale-in');
        }
        body.classList.add('overflow-hidden');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        body.classList.remove('overflow-hidden');
    }
}

// Close modal on background click
document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', function (e) {
        if (e.target === this) {
            this.closest('.modal-container').classList.add('hidden');
            body.classList.remove('overflow-hidden');
        }
    });
});


// --- THEME MANAGEMENT ---
const Theme = {
    init() {
        // Check for saved theme or system preference
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    },

    toggle() {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        }
    }
};

// Initialize Theme on load
Theme.init();

// --- TOAST NOTIFICATIONS ---
const Toast = {
    container: null,

    init() {
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2';
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toast-container');
        }
    },

    show(message, type = 'success', duration = 3000) {
        if (!this.container) this.init();

        const toast = document.createElement('div');

        let icon = '';
        let colors = '';

        switch (type) {
            case 'success':
                icon = '<i class="fas fa-check-circle text-green-500 text-xl"></i>';
                colors = 'border-l-4 border-green-500 dark:bg-gray-800 dark:text-white';
                break;
            case 'error':
                icon = '<i class="fas fa-exclamation-circle text-red-500 text-xl"></i>';
                colors = 'border-l-4 border-red-500 dark:bg-gray-800 dark:text-white';
                break;
            case 'warning':
                icon = '<i class="fas fa-exclamation-triangle text-amber-500 text-xl"></i>';
                colors = 'border-l-4 border-amber-500 dark:bg-gray-800 dark:text-white';
                break;
            default: // info
                icon = '<i class="fas fa-info-circle text-blue-500 text-xl"></i>';
                colors = 'border-l-4 border-blue-500 dark:bg-gray-800 dark:text-white';
        }

        toast.className = `flex items-center gap-3 bg-white shadow-lg rounded-lg p-4 min-w-[300px] transform transition-all duration-300 translate-x-full opacity-0 ${colors}`;
        toast.innerHTML = `
            ${icon}
            <div>
                <h4 class="font-medium text-slate-800 dark:text-slate-100 text-sm capitalize">${type}</h4>
                <p class="text-slate-500 dark:text-slate-400 text-sm">${message}</p>
            </div>
            <button onclick="this.parentElement.remove()" class="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
        });

        // Auto dismiss
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-x-[20px]');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
};

// --- TABLE FILTERING ---
const TableFilter = {
    init() {
        const searchInputs = document.querySelectorAll('[data-table-filter]');
        searchInputs.forEach(input => {
            const targetId = input.getAttribute('data-table-filter');
            const tbody = document.getElementById(targetId);

            if (tbody) {
                input.addEventListener('input', () => {
                    const rawFilter = input.value.toLowerCase();
                    // Normalize filter: remove accents for better matching (e.g., "e" match "é")
                    const filter = rawFilter.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

                    const rows = tbody.getElementsByTagName('tr');
                    let visibleCount = 0;

                    for (let i = 0; i < rows.length; i++) {
                        const row = rows[i];

                        // Skip auxiliary rows (placeholder for empty state or headers in tbody)
                        if (row.classList.contains('aux-row') || row.querySelector('th')) continue;

                        let found = false;
                        const cells = row.getElementsByTagName('td');
                        const filterCol = input.getAttribute('data-filter-column');

                        // Function to check if text matches filter
                        const matches = (text) => {
                            const normalizedText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            return normalizedText.indexOf(filter) > -1;
                        };

                        if (filter === "") {
                            found = true;
                        } else if (filterCol !== null) {
                            // Search only in specified columns (comma-separated indices)
                            const indices = filterCol.split(',').map(s => parseInt(s.trim()));
                            for (let idx of indices) {
                                if (cells[idx] && matches(cells[idx].innerText)) {
                                    found = true;
                                    break;
                                }
                            }
                        } else {
                            // Default: search in all columns except the last one (Actions)
                            for (let j = 0; j < cells.length; j++) {
                                if (j === cells.length - 1) continue;
                                if (matches(cells[j].innerText)) {
                                    found = true;
                                    break;
                                }
                            }
                        }

                        if (found) {
                            row.dataset.filtered = "false";
                            visibleCount++;
                        } else {
                            row.dataset.filtered = "true";
                            row.style.display = "none";
                        }
                    }

                    // Handle empty result message if needed
                    let noResultMsg = tbody.querySelector('.no-result-row');
                    if (visibleCount === 0 && filter !== "") {
                        if (!noResultMsg) {
                            noResultMsg = document.createElement('tr');
                            noResultMsg.className = 'no-result-row aux-row';
                            noResultMsg.innerHTML = `
                                <td colspan="100%" class="px-6 py-10 text-center text-secondary-500 dark:text-gray-400">
                                    <div class="flex flex-col items-center gap-2">
                                        <i class="fas fa-search text-3xl opacity-20"></i>
                                        <p>Aucun résultat trouvé pour "${input.value}"</p>
                                    </div>
                                </td>
                            `;
                            tbody.appendChild(noResultMsg);
                        }
                    } else if (noResultMsg) {
                        noResultMsg.remove();
                    }

                    // Reset to page 1 and update pagination
                    if (tbody.dataset.currentPage) {
                        tbody.dataset.currentPage = "1";
                    }
                    TablePagination.update(targetId);
                });
            }
        });
    }
};

// --- TABLE PAGINATION ---
const TablePagination = {
    init() {
        const paginatedTables = document.querySelectorAll('[data-table-pagination]');
        paginatedTables.forEach(tbody => {
            const targetId = tbody.id;
            tbody.dataset.currentPage = "1";
            tbody.dataset.itemsPerPage = tbody.getAttribute('data-table-pagination') || "5";

            this.update(targetId);
        });
    },

    update(tbodyId) {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return;

        const currentPage = parseInt(tbody.dataset.currentPage) || 1;
        const itemsPerPage = parseInt(tbody.dataset.itemsPerPage) || 5;

        // Find all rows that ARE NOT auxiliary and ARE NOT hidden by filter
        // We consider a row "eligible" if it doesn't have data-filtered="true"
        const eligibleRows = Array.from(tbody.getElementsByTagName('tr')).filter(row => {
            return !row.classList.contains('aux-row') && !row.querySelector('th') && row.dataset.filtered !== "true";
        });

        const totalItems = eligibleRows.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

        // Clamp current page
        const activePage = Math.min(Math.max(1, currentPage), totalPages);
        tbody.dataset.currentPage = activePage;

        const startIdx = (activePage - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;

        // First, hide all non-auxiliary, non-header rows
        Array.from(tbody.getElementsByTagName('tr')).forEach(row => {
            if (!row.classList.contains('aux-row') && !row.querySelector('th')) {
                row.style.display = "none";
            }
        });

        // Then show only eligible rows for the current page
        eligibleRows.forEach((row, idx) => {
            if (idx >= startIdx && idx < endIdx) {
                row.style.display = "";
            }
        });

        // Update UI Controls
        const container = tbody.closest('.bg-white, .dark\\:bg-gray-800');
        if (container) {
            const infoText = container.querySelector('.text-sm.text-secondary-500.dark\\:text-gray-400');
            if (infoText) {
                const currentStart = totalItems === 0 ? 0 : startIdx + 1;
                const currentEnd = Math.min(endIdx, totalItems);
                infoText.innerHTML = `Affichage de <span class="font-medium text-secondary-900 dark:text-white">${currentStart}</span> à <span class="font-medium text-secondary-900 dark:text-white">${currentEnd}</span> sur <span class="font-medium text-secondary-900 dark:text-white">${totalItems}</span> résultats`;
            }

            const nav = container.querySelector('nav');
            if (nav) {
                this.renderNav(nav, activePage, totalPages, tbodyId);
            }
        }
    },

    renderNav(nav, activePage, totalPages, tbodyId) {
        nav.innerHTML = '';

        // Previous Button
        const prevBtn = document.createElement('button');
        prevBtn.className = `px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 text-secondary-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors ${activePage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`;
        prevBtn.disabled = activePage === 1;
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.onclick = () => this.goToPage(tbodyId, activePage - 1);
        nav.appendChild(prevBtn);

        // Page Numbers (Simple version: 1, 2, 3...)
        // For brevity, we'll show up to 5 pages around the current page
        let startPage = Math.max(1, activePage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `px-3 py-1 rounded-lg font-medium transition-all ${i === activePage ? 'bg-primary-600 text-white shadow-sm' : 'border border-gray-200 dark:border-gray-600 text-secondary-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400'}`;
            pageBtn.innerText = i;
            pageBtn.onclick = () => this.goToPage(tbodyId, i);
            nav.appendChild(pageBtn);
        }

        // Next Button
        const nextBtn = document.createElement('button');
        nextBtn.className = `px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600 text-secondary-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors ${activePage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`;
        nextBtn.disabled = activePage === totalPages;
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.onclick = () => this.goToPage(tbodyId, activePage + 1);
        nav.appendChild(nextBtn);
    },

    goToPage(tbodyId, page) {
        const tbody = document.getElementById(tbodyId);
        if (tbody) {
            tbody.dataset.currentPage = page;
            // Before updating, we must let TableFilter reset if it's filtering?
            // No, Pagination works on what is currently displayed.
            // But wait, Pagination update will hide rows that are eligible.
            // If we are at page 2 and change to page 1, TableFilter has already hidden rows by text.
            // Pagination just slices them.

            // Re-run filter logic to ensure we start from a clean state? No, that's slow.
            // The logic in update() already filters rows that are NOT hidden.
            this.update(tbodyId);
        }
    }
};

// --- PROFILE SUMMARY ---
const Profile = {
    toggle() {
        // In a real app, this would toggle a dropdown or modal
        // For now, we show a nice toast summary
        Toast.show('Jean Dupont (Admin) - Connecté', 'info');
    }
};

// --- EXPORT LOGIC ---
function exportData(format) {
    // Simulate export
    const formatName = format.toUpperCase();
    Toast.show(`Exportation en format ${formatName} démarrée...`, 'success');

    // Simulate delay
    setTimeout(() => {
        Toast.show(`Fichier produits_2024.${format} téléchargé`, 'success');
    }, 2000);
}

// --- EDIT ROW LOGIC ---
function editRow(button, modalId) {
    const row = button.closest('tr');
    if (!row) return;

    const cells = row.querySelectorAll('td');
    const modal = document.getElementById(modalId);

    if (modal) {
        // Change Modal Title to "Modifier..."
        const title = modal.querySelector('#modalTitle') || modal.querySelector('h3');
        if (title) {
            if (!title.dataset.original) title.dataset.original = title.innerText;
            title.innerText = title.innerText.replace('Nouveau', 'Modifier').replace('Ajouter', 'Modifier').replace('Nouvelle', 'Modifier');
            // If the title doesn't contain the words above, force it
            if (!title.innerText.includes('Modifier')) {
                title.innerText = 'Modifier ' + title.innerText.replace('Modifier ', '');
            }
        }

        // Change Submit Button Text
        const submitBtn = modal.querySelector('#modalSubmitBtn') || (modal.querySelector('.items-center, .justify-end, .modal-footer') || modal.lastElementChild)?.lastElementChild;
        if (submitBtn && submitBtn.tagName === 'BUTTON' && !submitBtn.innerHTML.includes('Annuler')) {
            if (!submitBtn.dataset.original) submitBtn.dataset.original = submitBtn.innerText;
            submitBtn.innerText = 'Modifier';
        }

        const inputs = modal.querySelectorAll('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), select, textarea');

        let cellIndex = 0;
        inputs.forEach((input, index) => {
            let targetCell = null;
            if (input.dataset.colIndex) {
                targetCell = cells[parseInt(input.dataset.colIndex)];
            } else if (cellIndex < cells.length) {
                targetCell = cells[cellIndex];
                cellIndex++;
            }

            if (targetCell) {
                // Get clean text
                let text = targetCell.dataset.value || targetCell.innerText.trim();

                // Special handling for currency or numeric
                if (text.includes('€') || text.includes('FCFA')) {
                    text = text.replace(/[^0-9.,]/g, '').replace(',', '.');
                }

                if (input.tagName === 'SELECT') {
                    for (let option of input.options) {
                        if (option.text.includes(text) || text.includes(option.text)) {
                            input.value = option.value;
                            break;
                        }
                    }
                } else {
                    input.value = text;
                }

                cellIndex++;
            }
        });

        openModal(modalId);
    }
}


// --- VIEW ROW LOGIC ---
function viewRow(button, modalId) {
    const row = button.closest('tr');
    if (!row) return;

    const cells = row.querySelectorAll('td');

    // Specific Layout for Approvisionnement View
    if (modalId === 'viewSupplyModal') {
        if (document.getElementById('view-ref')) document.getElementById('view-ref').innerText = cells[0].innerText.trim();
        if (document.getElementById('view-date')) document.getElementById('view-date').innerText = cells[1].innerText.trim();
        if (document.getElementById('view-provider')) document.getElementById('view-provider').innerText = cells[2].innerText.trim();
        if (document.getElementById('view-amount')) document.getElementById('view-amount').innerText = cells[3].innerText.trim();
        if (document.getElementById('view-status')) document.getElementById('view-status').innerHTML = cells[4].innerHTML;
    }

    openModal(modalId);
}

// --- SUPPLY LINE LOGIC ---
function addSupplyLine() {
    const productSelect = document.getElementById('supply-product');
    const qtyInput = document.getElementById('supply-qty');
    const priceInput = document.getElementById('supply-price');
    const tbody = document.getElementById('supply-lines-tbody');

    if (productSelect.value && qtyInput.value > 0 && priceInput.value >= 0) {
        const product = productSelect.value;
        const qty = parseFloat(qtyInput.value);
        const price = parseFloat(priceInput.value);
        const total = qty * price;

        // Clear "No product" row if exists
        if (tbody.querySelector('.italic')) {
            tbody.innerHTML = '';
        }

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-secondary-50 dark:border-gray-700/50 last:border-0';
        row.innerHTML = `
            <td class="px-3 py-2 text-secondary-900 dark:text-white font-medium">${product}</td>
            <td class="px-3 py-2 text-right text-secondary-600 dark:text-gray-300">${qty}</td>
            <td class="px-3 py-2 text-right text-secondary-600 dark:text-gray-300">${price.toFixed(2)} €</td>
            <td class="px-3 py-2 text-right font-bold text-secondary-900 dark:text-white">${total.toFixed(2)} €</td>
            <td class="px-3 py-2 text-center">
                <button onclick="removeSupplyLine(this)" class="text-red-400 hover:text-red-600 transition-colors"><i class="fas fa-times"></i></button>
            </td>
        `;

        tbody.appendChild(row);

        // Reset inputs
        productSelect.value = '';
        qtyInput.value = '';
        priceInput.value = '';
    } else {
        Toast.show('Veuillez remplir tous les champs produit', 'error');
    }
}

function removeSupplyLine(button) {
    const row = button.closest('tr');
    row.remove();
    // Check if empty
    const tbody = document.getElementById('supply-lines-tbody');
    if (tbody && tbody.children.length === 0) {
        tbody.innerHTML = '<tr class="text-xs text-secondary-400 italic text-center aux-row"><td colspan="5" class="py-4">Aucun produit ajouté</td></tr>';
    }
}

// --- DELETE CONFIRMATION ---
function confirmDelete(button) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
        const row = button.closest('tr');
        if (row) {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '0';
            setTimeout(() => {
                row.remove();
                Toast.show('Élément supprimé avec succès', 'success');
            }, 300);
        }
    } else {
        Toast.show('Suppression annulée', 'info');
    }
}

// --- AUTH LOGIC ---
function logout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        // In a real app, clear tokens/session here
        Toast.show('Déconnexion en cours...', 'info');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    Toast.init();
    TableFilter.init();
    TablePagination.init();
});
