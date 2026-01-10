// Starbnails - Panel de Administración
console.log('Cargando admin.js...');

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const todayBookingsEl = document.getElementById('today-bookings');
    const blockedDaysCountEl = document.getElementById('blocked-days-count');
    const logoutBtn = document.getElementById('logout-btn');
    const navLinks = document.querySelectorAll('.nav-link');
    const adminSections = document.querySelectorAll('.admin-section');
    
    // Calendario
    const adminCalendarEl = document.getElementById('admin-calendar');
    const adminCurrentMonthEl = document.getElementById('admin-current-month');
    const adminPrevMonthBtn = document.getElementById('admin-prev-month');
    const adminNextMonthBtn = document.getElementById('admin-next-month');
    const blockDayBtn = document.getElementById('block-day-btn');
    const unblockDayBtn = document.getElementById('unblock-day-btn');
    const adminSelectedDayEl = document.getElementById('admin-selected-day');
    const adminDayDetailsEl = document.getElementById('admin-day-details');
    
    // Horarios
    const dayButtons = document.querySelectorAll('.day-btn');
    const currentDayNameEl = document.getElementById('current-day-name');
    const currentDayStatusEl = document.getElementById('current-day-status');
    const hoursListEl = document.getElementById('hours-list');
    const hourInput = document.getElementById('hour-input');
    const addHourBtn = document.getElementById('add-hour-btn');
    
    // Turnos
    const filterDateInput = document.getElementById('filter-date');
    const clearFilterBtn = document.getElementById('clear-filter');
    const totalBookingsEl = document.getElementById('total-bookings');
    const bookingsTableBody = document.getElementById('bookings-table-body');
    const noBookingsMessage = document.getElementById('no-bookings-message');
    
    // Configuración
    const whatsappNumberInput = document.getElementById('whatsapp-number');
    const saveWhatsappBtn = document.getElementById('save-whatsapp-btn');
    const locationAddressInput = document.getElementById('location-address');
    const saveLocationBtn = document.getElementById('save-location-btn');
    const clearDataBtn = document.getElementById('clear-data-btn');
    const resetSettingsBtn = document.getElementById('reset-settings-btn');
    
    // Modal
    const confirmModal = document.getElementById('confirm-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirmBtn = document.getElementById('modal-confirm');
    const modalCancelBtn = document.getElementById('modal-cancel');
    
    // Footer
    const adminCurrentYearEl = document.getElementById('admin-current-year');
    const syncStatusText = document.getElementById('sync-status-text');
    
    // Variables de estado
    let currentDate = new Date();
    let selectedAdminDay = null;
    let selectedDayForDetails = null;
    let currentSelectedDay = 'monday';
    let pendingAction = null;
    
    // Mapeo de días
    const dayNames = {
        monday: 'Lunes',
        tuesday: 'Martes',
        wednesday: 'Miércoles',
        thursday: 'Jueves',
        friday: 'Viernes',
        saturday: 'Sábado',
        sunday: 'Domingo'
    };

    // Inicialización
    function initAdmin() {
        console.log('Inicializando panel admin...');
        
        adminCurrentYearEl.textContent = new Date().getFullYear();
        initializeData();
        setupAdminEventListeners();
        generateAdminCalendar(currentDate.getFullYear(), currentDate.getMonth());
        loadAdminData();
        setupRealtimeSync();
        loadSettings();
        
        console.log('Panel admin inicializado');
    }

    // FUNCIONES AUXILIARES IMPORTADAS
    function isTimeSlotAvailable(date, time) {
        return window.isTimeSlotAvailable(date, time);
    }

    function getBookingsForDate(date) {
        return window.getBookingsForDate(date);
    }

    function setupAdminEventListeners() {
        // Navegación
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const sectionId = this.getAttribute('data-section');
                
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                
                adminSections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === `${sectionId}-section`) {
                        section.classList.add('active');
                    }
                });
            });
        });
        
        // Calendario
        adminPrevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            generateAdminCalendar(currentDate.getFullYear(), currentDate.getMonth());
            updateSelectedDayDetails();
        });
        
        adminNextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            generateAdminCalendar(currentDate.getFullYear(), currentDate.getMonth());
            updateSelectedDayDetails();
        });
        
        // Bloquear/desbloquear días
        blockDayBtn.addEventListener('click', () => {
            if (selectedAdminDay) {
                showConfirmModal(
                    'Bloquear día',
                    `¿Bloquear el día ${formatDateForDisplay(selectedAdminDay)}?`,
                    () => {
                        const success = updateBlockedDay(selectedAdminDay, true);
                        if (success) {
                            notifyStorageUpdate();
                            generateAdminCalendar(currentDate.getFullYear(), currentDate.getMonth());
                            updateSelectedDayDetails();
                            updateStats();
                            alert('Día bloqueado');
                        }
                    }
                );
            } else {
                alert('Selecciona un día');
            }
        });
        
        unblockDayBtn.addEventListener('click', () => {
            if (selectedAdminDay) {
                showConfirmModal(
                    'Desbloquear día',
                    `¿Desbloquear el día ${formatDateForDisplay(selectedAdminDay)}?`,
                    () => {
                        const success = updateBlockedDay(selectedAdminDay, false);
                        if (success) {
                            notifyStorageUpdate();
                            generateAdminCalendar(currentDate.getFullYear(), currentDate.getMonth());
                            updateSelectedDayDetails();
                            updateStats();
                            alert('Día desbloqueado');
                        }
                    }
                );
            } else {
                alert('Selecciona un día');
            }
        });
        
        // Horarios
        dayButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                dayButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentSelectedDay = this.getAttribute('data-day');
                loadDayHours(currentSelectedDay);
            });
        });
        
        addHourBtn.addEventListener('click', addHour);
        
        // Turnos
        filterDateInput.addEventListener('change', loadBookings);
        clearFilterBtn.addEventListener('click', () => {
            filterDateInput.value = '';
            loadBookings();
        });
        
        // Configuración
        saveWhatsappBtn.addEventListener('click', saveWhatsappNumber);
        saveLocationBtn.addEventListener('click', saveLocationAddress);
        clearDataBtn.addEventListener('click', () => {
            showConfirmModal(
                'Eliminar todos los datos',
                '¿Eliminar TODOS los datos? ¡No se puede deshacer!',
                clearAllData
            );
        });
        
        resetSettingsBtn.addEventListener('click', () => {
            showConfirmModal(
                'Restaurar ajustes',
                '¿Restaurar ajustes por defecto?',
                resetToDefaults
            );
        });
        
        // Modal
        modalCancelBtn.addEventListener('click', hideModal);
        modalConfirmBtn.addEventListener('click', executePendingAction);
        
        // Logout
        logoutBtn.addEventListener('click', () => {
            window.location.href = '../client/index.html';
        });
        
        // Sincronización
        window.addEventListener('storageUpdated', () => {
            console.log('Actualizando desde storage...');
            updateStats();
            loadBookings();
            
            if (selectedAdminDay) updateSelectedDayDetails();
            
            const activeSection = document.querySelector('.admin-section.active');
            if (activeSection && activeSection.id === 'hours-section') {
                loadDayHours(currentSelectedDay);
            }
            
            if (activeSection && activeSection.id === 'calendar-section') {
                generateAdminCalendar(currentDate.getFullYear(), currentDate.getMonth());
                updateSelectedDayDetails();
            }
            
            syncStatusText.textContent = 'Actualizando...';
            syncStatusText.style.color = '#ffc107';
            
            setTimeout(() => {
                syncStatusText.textContent = 'Sincronizado';
                syncStatusText.style.color = '#28a745';
            }, 500);
        });
    }

    function generateAdminCalendar(year, month) {
        console.log(`Generando calendario admin: ${year}-${month + 1}`);
        
        adminCalendarEl.innerHTML = '';
        
        const monthNames = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        adminCurrentMonthEl.textContent = `${monthNames[month]} ${year}`;
        
        const weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
        weekdays.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'admin-weekday';
            dayEl.textContent = day;
            adminCalendarEl.appendChild(dayEl);
        });
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();
        
        const bookings = getAllBookings();
        const blockedDays = getBlockedDays();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < startingDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'admin-day admin-empty';
            adminCalendarEl.appendChild(emptyDay);
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(year, month, day);
            const dayKey = formatDate(dayDate);
            
            const dayEl = document.createElement('div');
            dayEl.className = 'admin-day';
            dayEl.dataset.date = dayKey;
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'admin-day-number';
            dayNumber.textContent = day;
            
            const dayStatus = document.createElement('div');
            dayStatus.className = 'admin-day-status';
            
            let status = 'available';
            let statusText = 'Disponible';
            
            const isToday = dayDate.getTime() === today.getTime();
            if (isToday) dayEl.classList.add('admin-today');
            
            if (blockedDays.includes(dayKey)) {
                status = 'blocked';
                statusText = 'Bloqueado';
            } else if (dayDate.getDay() === 0) {
                const sundayHours = getBusinessHours('sunday');
                if (sundayHours.length === 0) {
                    status = 'blocked';
                    statusText = 'Cerrado';
                }
            } else {
                const dayBookings = bookings.filter(b => b.date === dayKey);
                if (dayBookings.length > 0) {
                    status = 'booked';
                    statusText = `${dayBookings.length} turno${dayBookings.length > 1 ? 's' : ''}`;
                }
            }
            
            dayEl.classList.add(`admin-${status}`);
            dayStatus.textContent = statusText;
            dayEl.appendChild(dayNumber);
            dayEl.appendChild(dayStatus);
            
            if (!dayEl.classList.contains('admin-empty')) {
                dayEl.addEventListener('click', () => selectAdminDay(dayKey, dayDate, dayEl));
            }
            
            if (selectedAdminDay === dayKey) {
                dayEl.classList.add('admin-selected');
            }
            
            adminCalendarEl.appendChild(dayEl);
        }
    }

    function selectAdminDay(dateKey, dateObj, dayElement) {
        console.log(`Día admin seleccionado: ${dateKey}`);
        
        if (selectedAdminDay) {
            const prevSelected = document.querySelector('.admin-day.admin-selected');
            if (prevSelected) prevSelected.classList.remove('admin-selected');
        }
        
        selectedAdminDay = dateKey;
        selectedDayForDetails = dateObj;
        
        if (dayElement) dayElement.classList.add('admin-selected');
        updateSelectedDayDetails();
    }

    function updateSelectedDayDetails() {
        if (!selectedAdminDay || !selectedDayForDetails) {
            adminSelectedDayEl.textContent = 'Ninguno';
            adminDayDetailsEl.innerHTML = '<p>Selecciona un día</p>';
            return;
        }
        
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = selectedDayForDetails.toLocaleDateString('es-ES', options);
        adminSelectedDayEl.textContent = formattedDate;
        
        const bookings = getAllBookings();
        const blockedDays = getBlockedDays();
        
        const dayBookings = bookings.filter(b => b.date === selectedAdminDay);
        const isBlocked = blockedDays.includes(selectedAdminDay);
        const weekday = getWeekdayName(selectedDayForDetails.getDay());
        const availableHours = getBusinessHours(weekday);
        
        let detailsHTML = '';
        
        if (isBlocked) {
            detailsHTML += '<p class="status-blocked"><i class="fas fa-ban"></i> Bloqueado</p>';
        } else if (availableHours.length === 0) {
            detailsHTML += '<p class="status-closed"><i class="fas fa-door-closed"></i> Cerrado</p>';
        } else {
            const availableSlots = availableHours.length - dayBookings.length;
            detailsHTML += `<p class="status-open"><i class="fas fa-door-open"></i> ${availableSlots}/${availableHours.length} disponibles</p>`;
        }
        
        if (dayBookings.length > 0) {
            detailsHTML += '<h5>Turnos:</h5><ul class="booking-list">';
            dayBookings.forEach(booking => {
                detailsHTML += `
                    <li>
                        <strong>${booking.time}</strong> - ${booking.name}
                        <button class="delete-booking-btn" data-id="${booking.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </li>
                `;
            });
            detailsHTML += '</ul>';
        }
        
        adminDayDetailsEl.innerHTML = detailsHTML;
        
        adminDayDetailsEl.querySelectorAll('.delete-booking-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const bookingId = parseInt(this.getAttribute('data-id'));
                deleteBooking(bookingId);
            });
        });
    }

    function loadDayHours(day) {
        console.log(`Cargando horarios para: ${day}`);
        
        currentDayNameEl.textContent = dayNames[day];
        const hours = getBusinessHours(day);
        
        if (hours.length === 0) {
            currentDayStatusEl.textContent = 'Cerrado';
            currentDayStatusEl.className = 'status-closed';
        } else {
            currentDayStatusEl.textContent = 'Abierto';
            currentDayStatusEl.className = 'status-open';
        }
        
        hoursListEl.innerHTML = '';
        
        if (hours.length === 0) {
            hoursListEl.innerHTML = '<p class="no-hours">No hay horarios</p>';
            return;
        }
        
        const sortedHours = [...hours].sort();
        sortedHours.forEach(hour => {
            const hourItem = document.createElement('div');
            hourItem.className = 'hour-item';
            hourItem.innerHTML = `
                <span>${hour}</span>
                <button class="remove-hour" data-hour="${hour}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            hoursListEl.appendChild(hourItem);
        });
        
        hoursListEl.querySelectorAll('.remove-hour').forEach(btn => {
            btn.addEventListener('click', function() {
                const hourToRemove = this.getAttribute('data-hour');
                removeHour(day, hourToRemove);
            });
        });
    }

    function addHour() {
        const hourValue = hourInput.value;
        
        if (!hourValue) {
            alert('Ingresa una hora');
            return;
        }
        
        if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hourValue)) {
            alert('Formato HH:MM (ej: 09:00)');
            return;
        }
        
        const hours = getBusinessHours(currentSelectedDay);
        if (hours.includes(hourValue)) {
            alert('Hora ya existe');
            return;
        }
        
        hours.push(hourValue);
        const success = updateBusinessHours(currentSelectedDay, hours);
        
        if (success) {
            notifyStorageUpdate();
            loadDayHours(currentSelectedDay);
            hourInput.value = '09:00';
            alert('Horario agregado');
        } else {
            alert('Error al agregar');
        }
    }

    function removeHour(day, hour) {
        showConfirmModal(
            'Eliminar horario',
            `¿Eliminar ${hour} del ${dayNames[day]}?`,
            () => {
                let hours = getBusinessHours(day);
                hours = hours.filter(h => h !== hour);
                const success = updateBusinessHours(day, hours);
                
                if (success) {
                    notifyStorageUpdate();
                    loadDayHours(day);
                    alert('Horario eliminado');
                } else {
                    alert('Error al eliminar');
                }
            }
        );
    }

    function loadBookings() {
        console.log('Cargando turnos...');
        
        const bookings = getAllBookings();
        const filterDate = filterDateInput.value;
        
        let filteredBookings = [...bookings];
        if (filterDate) {
            filteredBookings = bookings.filter(b => b.date === filterDate);
        }
        
        filteredBookings.sort((a, b) => {
            if (a.date !== b.date) return new Date(b.date) - new Date(a.date);
            return b.time.localeCompare(a.time);
        });
        
        totalBookingsEl.textContent = bookings.length;
        
        if (filteredBookings.length === 0) {
            noBookingsMessage.style.display = 'flex';
            bookingsTableBody.innerHTML = '';
        } else {
            noBookingsMessage.style.display = 'none';
            
            let tableHTML = '';
            filteredBookings.forEach(booking => {
                const bookingDate = new Date(booking.date);
                const formattedDate = bookingDate.toLocaleDateString('es-ES');
                const formattedTimestamp = new Date(booking.timestamp).toLocaleString('es-ES');
                
                tableHTML += `
                    <tr>
                        <td>${booking.name}</td>
                        <td>${formattedDate}</td>
                        <td>${booking.time}</td>
                        <td>${formattedTimestamp}</td>
                        <td class="actions">
                            <button class="btn-icon btn-icon-danger delete-booking-table" data-id="${booking.id}" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            bookingsTableBody.innerHTML = tableHTML;
            
            bookingsTableBody.querySelectorAll('.delete-booking-table').forEach(btn => {
                btn.addEventListener('click', function() {
                    const bookingId = parseInt(this.getAttribute('data-id'));
                    deleteBooking(bookingId);
                });
            });
        }
    }

    function deleteBooking(bookingId) {
        showConfirmModal(
            'Eliminar turno',
            '¿Eliminar este turno?',
            () => {
                const success = removeBooking(bookingId);
                if (success) {
                    notifyStorageUpdate();
                    loadBookings();
                    updateSelectedDayDetails();
                    updateStats();
                    alert('Turno eliminado');
                } else {
                    alert('Error al eliminar');
                }
            }
        );
    }

    function loadSettings() {
        console.log('Cargando configuración...');
        
        whatsappNumberInput.value = getWhatsappNumber();
        locationAddressInput.value = getLocationAddress();
        
        console.log('Configuración cargada');
    }

    function saveWhatsappNumber() {
        const number = whatsappNumberInput.value.trim();
        
        if (!number) {
            alert('Ingresa un número');
            return;
        }
        
        const cleanNumber = number.replace(/\s/g, '');
        if (!/^\+?[1-9]\d{1,14}$/.test(cleanNumber)) {
            alert('Formato inválido. Ej: +5493804949550');
            return;
        }
        
        const success = updateWhatsappNumber(cleanNumber);
        if (success) {
            notifyStorageUpdate();
            alert('WhatsApp guardado');
        } else {
            alert('Error al guardar');
        }
    }

    function saveLocationAddress() {
        const address = locationAddressInput.value.trim();
        
        if (!address) {
            alert('Ingresa una URL');
            return;
        }
        
        const success = updateLocationAddress(address);
        if (success) {
            notifyStorageUpdate();
            alert('Ubicación guardada');
        } else {
            alert('Error al guardar');
        }
    }

    function clearAllData() {
        const count = clearStarbnailsData();
        if (count > 0) {
            initializeData();
            notifyStorageUpdate();
            generateAdminCalendar(currentDate.getFullYear(), currentDate.getMonth());
            loadBookings();
            loadDayHours(currentSelectedDay);
            updateStats();
            loadSettings();
            alert(`Datos eliminados (${count} elementos)`);
        } else {
            alert('No hay datos');
        }
        hideModal();
    }

    function resetToDefaults() {
        const defaultSettings = {
            businessHours: {
                monday: ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00", "18:30"],
                tuesday: ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00", "18:30"],
                wednesday: ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00", "18:30"],
                thursday: ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00", "18:30"],
                friday: ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00", "18:30"],
                saturday: ["09:00", "10:30", "12:00", "14:00", "15:30"],
                sunday: []
            },
            blockedDays: [],
            whatsappNumber: "+5493804949550",
            locationAddress: "https://maps.app.goo.gl/sPr6mxZVzbrq8vxt5"
        };
        
        const success = saveData('starbnails_settings', defaultSettings);
        if (success) {
            notifyStorageUpdate();
            loadDayHours(currentSelectedDay);
            loadSettings();
            alert('Configuración restaurada');
        } else {
            alert('Error al restaurar');
        }
        hideModal();
    }

    function updateStats() {
        const stats = getStats();
        todayBookingsEl.textContent = stats.todayBookings;
        blockedDaysCountEl.textContent = stats.blockedDaysCount;
        totalBookingsEl.textContent = stats.totalBookings;
    }

    function loadAdminData() {
        updateStats();
        loadBookings();
        loadDayHours(currentSelectedDay);
    }

    function showConfirmModal(title, message, action) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        pendingAction = action;
        confirmModal.classList.add('active');
    }

    function hideModal() {
        confirmModal.classList.remove('active');
        pendingAction = null;
    }

    function executePendingAction() {
        if (pendingAction) pendingAction();
        hideModal();
    }

    // Funciones auxiliares
    function formatDateForDisplay(dateString) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    // Iniciar
    initAdmin();
    console.log('Panel admin listo');
});