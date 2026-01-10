// Starbnails - Vista Cliente
console.log('Cargando script.js del cliente...');

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const calendarEl = document.getElementById('calendar');
    const currentMonthEl = document.getElementById('current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const selectedDayInfoEl = document.getElementById('selected-day-info');
    const timeSectionEl = document.getElementById('time-section');
    const timeSlotsEl = document.getElementById('time-slots');
    const bookingFormEl = document.getElementById('booking-form');
    const clientNameInput = document.getElementById('client-name');
    const selectedDateDisplay = document.getElementById('selected-date-display');
    const selectedTimeDisplay = document.getElementById('selected-time-display');
    const reservationForm = document.getElementById('reservation-form');
    const submitBtn = document.getElementById('submit-btn');
    const resetBtn = document.getElementById('reset-btn');
    const cooldownMessageEl = document.getElementById('cooldown-message');
    const locationBtn = document.getElementById('location-btn');
    const currentYearEl = document.getElementById('current-year');
    
    // Variables de estado
    let currentDate = new Date();
    let selectedDay = null;
    let selectedTime = null;
    let selectedHour = null;
    let isCooldown = false;
    let countdownInterval = null;

    // Inicialización
    function init() {
        console.log('Inicializando cliente...');
        
        currentYearEl.textContent = new Date().getFullYear();
        initializeData();
        setupEventListeners();
        generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        setupRealtimeSync();
        
        console.log('Cliente inicializado');
    }

    function setupEventListeners() {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });
        
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        });
        
        reservationForm.addEventListener('submit', handleReservationSubmit);
        resetBtn.addEventListener('click', resetSelection);
        locationBtn.addEventListener('click', openLocation);
        clientNameInput.addEventListener('input', validateName);
        
        window.addEventListener('storageUpdated', updateUIFromStorage);
    }

    function generateCalendar(year, month) {
        console.log(`Generando calendario: ${year}-${month + 1}`);
        
        calendarEl.innerHTML = '';
        
        const monthNames = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        currentMonthEl.textContent = `${monthNames[month]} ${year}`;
        
        const weekdays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
        weekdays.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'weekday';
            dayEl.textContent = day;
            calendarEl.appendChild(dayEl);
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
            emptyDay.className = 'day empty';
            calendarEl.appendChild(emptyDay);
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(year, month, day);
            const dayKey = formatDate(dayDate);
            
            const dayEl = document.createElement('div');
            dayEl.className = 'day';
            dayEl.dataset.date = dayKey;
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            
            const dayStatus = document.createElement('div');
            dayStatus.className = 'day-status';
            
            let status = 'available';
            let statusText = 'Disponible';
            
            if (blockedDays.includes(dayKey)) {
                status = 'blocked';
                statusText = 'Bloqueado';
            } else if (dayDate < today) {
                status = 'disabled';
                statusText = 'Pasado';
            } else if (dayDate.getDay() === 0) {
                const sundayHours = getBusinessHours('sunday');
                if (sundayHours.length === 0) {
                    status = 'blocked';
                    statusText = 'Cerrado';
                }
            } else {
                const dayBookings = bookings.filter(b => b.date === dayKey);
                const weekday = getWeekdayName(dayDate.getDay());
                const availableHours = getBusinessHours(weekday);
                
                if (availableHours.length > 0 && dayBookings.length >= availableHours.length) {
                    status = 'booked';
                    statusText = 'Completo';
                }
            }
            
            dayEl.classList.add(status);
            dayStatus.textContent = statusText;
            dayEl.appendChild(dayNumber);
            dayEl.appendChild(dayStatus);
            
            if (status === 'available') {
                dayEl.addEventListener('click', () => selectDay(dayKey, dayDate));
            }
            
            calendarEl.appendChild(dayEl);
        }
    }

    function selectDay(dateKey, dateObj) {
        console.log(`Día seleccionado: ${dateKey}`);
        
        if (selectedDay) {
            const prevSelected = document.querySelector('.day.selected');
            if (prevSelected) prevSelected.classList.remove('selected');
        }
        
        selectedDay = dateKey;
        const dayElement = document.querySelector(`.day[data-date="${dateKey}"]`);
        if (dayElement) dayElement.classList.add('selected');
        
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString('es-ES', options);
        selectedDayInfoEl.innerHTML = `
            <p><i class="fas fa-check-circle"></i> Día seleccionado: <strong>${formattedDate}</strong></p>
        `;
        
        showAvailableTimes(dateKey, dateObj);
        timeSectionEl.style.display = 'block';
        
        if (window.innerWidth < 768) {
            timeSectionEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function showAvailableTimes(dateKey, dateObj) {
        console.log(`Mostrando horarios para: ${dateKey}`);
        
        timeSlotsEl.innerHTML = '';
        selectedTime = null;
        selectedHour = null;
        
        const weekday = getWeekdayName(dateObj.getDay());
        const availableHours = getBusinessHours(weekday);
        const dayBookings = getBookingsForDate(dateKey);
        
        if (availableHours.length === 0) {
            timeSlotsEl.innerHTML = '<p class="no-slots">No hay horarios disponibles para este día</p>';
            return;
        }
        
        availableHours.forEach(time => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = time;
            timeSlot.dataset.time = time;
            
            const isBooked = dayBookings.some(b => b.time === time);
            
            if (isBooked) {
                timeSlot.classList.add('unavailable');
                timeSlot.title = 'Horario no disponible';
            } else {
                timeSlot.classList.add('available');
                timeSlot.addEventListener('click', function() {
                    selectTime(time, this);
                });
            }
            
            timeSlotsEl.appendChild(timeSlot);
        });
        
        bookingFormEl.style.display = 'none';
    }

    function selectTime(time, timeElement) {
        console.log(`Horario seleccionado: ${time}`);
        
        if (selectedTime) {
            const prevSelected = document.querySelector('.time-slot.selected');
            if (prevSelected) prevSelected.classList.remove('selected');
        }
        
        selectedTime = time;
        selectedHour = time;
        timeElement.classList.add('selected');
        
        // Mostrar en el formulario
        selectedDateDisplay.textContent = formatDateForDisplay(selectedDay);
        selectedTimeDisplay.textContent = time;
        bookingFormEl.style.display = 'block';
        
        console.log(`Hora guardada: selectedHour = ${selectedHour}, selectedTime = ${selectedTime}`);
        
        if (window.innerWidth < 768) {
            bookingFormEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function validateName() {
        const nameError = document.getElementById('name-error');
        const name = clientNameInput.value.trim();
        
        if (name.length < 2) {
            nameError.textContent = 'El nombre debe tener al menos 2 caracteres';
            return false;
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) {
            nameError.textContent = 'El nombre solo puede contener letras y espacios';
            return false;
        } else {
            nameError.textContent = '';
            return true;
        }
    }

    function debugReservation(date, time) {
        console.log(`=== DEBUG RESERVATION ===`);
        console.log(`Fecha: ${date}, Hora: ${time}`);
        
        const settings = getData('starbnails_settings') || {};
        const bookings = getData('starbnails_bookings') || [];
        
        console.log('Días bloqueados:', settings.blockedDays || []);
        console.log('Todas las reservas:', bookings);
        
        const dateObj = new Date(date + 'T00:00:00');
        const weekday = getWeekdayName(dateObj.getDay());
        console.log(`Día de la semana: ${weekday}`);
        
        const availableHours = settings.businessHours?.[weekday] || [];
        console.log(`Horarios disponibles para ${weekday}:`, availableHours);
        
        const dayBookings = bookings.filter(b => b.date === date);
        console.log(`Reservas para ${date}:`, dayBookings);
        
        const isAvailable = isTimeSlotAvailable(date, time);
        console.log(`¿Está disponible ${date} ${time}?: ${isAvailable}`);
        
        return isAvailable;
    }

    function handleReservationSubmit(e) {
        e.preventDefault();
        console.log('=== INICIANDO PROCESO DE RESERVA ===');
        console.log(`Estado actual: selectedDay = ${selectedDay}, selectedTime = ${selectedTime}, selectedHour = ${selectedHour}`);
        
        if (isCooldown) {
            alert('Por favor espera unos segundos antes de realizar otra reserva');
            return;
        }
        
        if (!selectedDay) {
            alert('Por favor selecciona un día');
            return;
        }
        
        // USAR selectedHour COMO HORA PRINCIPAL
        const horaParaReserva = selectedHour || selectedTime;
        if (!horaParaReserva) {
            alert('Por favor selecciona un horario');
            return;
        }
        
        if (!validateName()) {
            clientNameInput.focus();
            return;
        }
        
        const clientName = clientNameInput.value.trim();
        
        // Debug para verificar disponibilidad
        console.log(`Verificando disponibilidad para: ${selectedDay} ${horaParaReserva}`);
        debugReservation(selectedDay, horaParaReserva);
        
        // Verificar disponibilidad antes de intentar reservar
        if (!isTimeSlotAvailable(selectedDay, horaParaReserva)) {
            alert('Lo sentimos, este horario ya no está disponible. Por favor selecciona otro horario.');
            updateUIFromStorage();
            return;
        }
        
        // Intentar reserva
        const result = attemptReservation(selectedDay, horaParaReserva, clientName);
        
        if (result.success) {
            console.log('✅ Reserva exitosa, iniciando cooldown...');
            startCooldown(clientName, horaParaReserva);
        } else {
            console.error('❌ Error en reserva:', result.message);
            alert(result.message);
            
            // Actualizar la interfaz para reflejar cambios
            setTimeout(() => {
                updateUIFromStorage();
            }, 500);
        }
    }

    function startCooldown(clientName, horaReserva) {
        console.log('Iniciando cooldown para:', clientName);
        console.log(`Hora de reserva recibida: ${horaReserva}`);
        
        isCooldown = true;
        submitBtn.disabled = true;
        cooldownMessageEl.style.display = 'flex';
        
        let countdown = 5;
        const countdownEl = document.getElementById('countdown');
        countdownEl.textContent = countdown;
        
        // Asegurar que tenemos la hora correcta
        const horaFinal = horaReserva || selectedHour || selectedTime;
        console.log(`Hora final para mostrar: ${horaFinal}`);
        
        if (!horaFinal) {
            console.error('ERROR: No se encontró la hora de reserva');
            alert('Error: No se pudo obtener la hora de reserva. Por favor intenta nuevamente.');
            resetCooldown();
            return;
        }
        
        // Mostrar información de la reserva - CORREGIDO
        const formattedDate = formatDateForDisplay(selectedDay);
        cooldownMessageEl.innerHTML = `
            <div class="cooldown-content">
                <div class="spinner"></div>
                <h3>¡Turno reservado exitosamente!</h3>
                <p><strong>${clientName}</strong></p>
                <p>📅 ${formattedDate} a las ${horaFinal}</p>
                <p>Redirigiendo a WhatsApp en <span id="countdown">5</span> segundos...</p>
                <p class="small-text">No cierres esta ventana</p>
            </div>
        `;
        
        // Actualizar countdown
        const newCountdownEl = document.getElementById('countdown');
        
        countdownInterval = setInterval(() => {
            countdown--;
            newCountdownEl.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                openWhatsApp(clientName, formattedDate, horaFinal);
                
                setTimeout(() => {
                    resetCooldown();
                }, 3000);
            }
        }, 1000);
    }

    function resetCooldown() {
        cooldownMessageEl.style.display = 'none';
        resetSelection();
        isCooldown = false;
        submitBtn.disabled = false;
        countdownInterval = null;
    }

    function openWhatsApp(clientName, formattedDate, horaReserva) {
        console.log('=== ABRIENDO WHATSAPP ===');
        console.log(`Datos para WhatsApp:`);
        console.log(`- Nombre: ${clientName}`);
        console.log(`- Fecha: ${formattedDate}`);
        console.log(`- Hora: ${horaReserva}`);
        
        try {
            // Obtener número de WhatsApp
            const whatsappNumber = getWhatsappNumber();
            console.log(`Número original: ${whatsappNumber}`);
            
            // LIMPIAR NÚMERO CORRECTAMENTE
            let cleanNumber = whatsappNumber.trim();
            
            // Eliminar espacios, guiones, paréntesis, etc.
            cleanNumber = cleanNumber.replace(/\s/g, '')
                                     .replace(/-/g, '')
                                     .replace(/\(/g, '')
                                     .replace(/\)/g, '')
                                     .replace(/\./g, '');
            
            console.log(`Número después de limpieza básica: ${cleanNumber}`);
            
            // VERIFICAR FORMATO VÁLIDO PARA WHATSAPP
            // WhatsApp requiere: +[código país][número completo sin 0 inicial]
            
            // Si empieza con +, ya está en formato internacional
            if (cleanNumber.startsWith('+')) {
                console.log(`Número ya en formato internacional: ${cleanNumber}`);
            }
            // Si empieza con 54 (código Argentina sin +)
            else if (cleanNumber.startsWith('54')) {
                cleanNumber = '+' + cleanNumber;
                console.log(`Agregado + al código Argentina: ${cleanNumber}`);
            }
            // Si empieza con 9 (asumimos Argentina, celular)
            else if (cleanNumber.startsWith('9')) {
                cleanNumber = '+54' + cleanNumber;
                console.log(`Agregado +54 al número celular: ${cleanNumber}`);
            }
            // Si empieza con 0 (nacional) - eliminar 0 y agregar +54
            else if (cleanNumber.startsWith('0')) {
                cleanNumber = '+54' + cleanNumber.substring(1);
                console.log(`Convertido 0 a +54: ${cleanNumber}`);
            }
            // Si no tiene prefijo, asumimos Argentina
            else {
                // Verificar si ya tiene 15 caracteres (número completo sin +)
                if (cleanNumber.length === 13) { // Ej: 5493804949550
                    cleanNumber = '+' + cleanNumber;
                } else {
                    cleanNumber = '+549' + cleanNumber;
                }
                console.log(`Agregado +549 por defecto: ${cleanNumber}`);
            }
            
            // Validación final del número
            // WhatsApp requiere: + seguido de 7-15 dígitos
            const whatsappRegex = /^\+[1-9]\d{6,14}$/;
            
            if (!whatsappRegex.test(cleanNumber)) {
                console.error(`Número inválido después de procesamiento: ${cleanNumber}`);
                console.error(`Longitud: ${cleanNumber.length}, Formato: ${cleanNumber}`);
                
                // Número de emergencia para testing
                cleanNumber = '+549116543210'; // Número de prueba
                console.log(`Usando número de prueba: ${cleanNumber}`);
            }
            
            console.log(`Número final para WhatsApp: ${cleanNumber}`);
            
            // Crear mensaje
            const message = `✨ *Turno Reservado - Starbnails* ✨%0A%0A`
                          + `👤 *Nombre:* ${encodeURIComponent(clientName)}%0A`
                          + `📅 *Fecha:* ${encodeURIComponent(formattedDate)}%0A`
                          + `⏰ *Horario:* ${encodeURIComponent(horaReserva)}%0A%0A`
                          + `_Para confirmar el turno, por favor abona la seña._ 💅✨`;
            
            console.log('Mensaje creado:', decodeURIComponent(message));
            
            // Construir URL de WhatsApp (API oficial)
            const whatsappURL = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${message}`;
            
            console.log('URL WhatsApp generada:', whatsappURL);
            
            // PRIMER INTENTO: window.open (más confiable)
            console.log('Intentando abrir WhatsApp con window.open...');
            const newWindow = window.open(whatsappURL, '_blank', 'noopener,noreferrer,width=800,height=600');
            
            // Verificar si se abrió
            setTimeout(() => {
                if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                    console.log('window.open falló, intentando método alternativo...');
                    
                    // SEGUNDO INTENTO: Método alternativo con timeout
                    const tempLink = document.createElement('a');
                    tempLink.href = whatsappURL;
                    tempLink.target = '_blank';
                    tempLink.rel = 'noopener noreferrer';
                    tempLink.style.display = 'none';
                    document.body.appendChild(tempLink);
                    
                    // Intentar click
                    tempLink.click();
                    
                    // Limpiar después de 3 segundos
                    setTimeout(() => {
                        document.body.removeChild(tempLink);
                    }, 3000);
                    
                    // TERCER INTENTO: location.href si todo falla
                    setTimeout(() => {
                        console.log('Probando location.href...');
                        window.location.href = whatsappURL;
                    }, 100);
                }
            }, 100);
            
        } catch (error) {
            console.error('❌ ERROR CRÍTICO al abrir WhatsApp:', error);
            
            // FALLBACK COMPLETO con UI amigable
            const whatsappNumber = getWhatsappNumber();
            const cleanNumber = whatsappNumber.replace(/\s/g, '').replace(/[^\d\+]/g, '');
            
            const mensajeCompleto = 
                `✨ Turno Reservado - Starbnails ✨\n\n` +
                `👤 Nombre: ${clientName}\n` +
                `📅 Fecha: ${formattedDate}\n` +
                `⏰ Horario: ${horaReserva}\n\n` +
                `Para confirmar el turno, por favor abona la seña. 💅✨`;
            
            // Mostrar modal con instrucciones claras
            const fallbackHTML = `
                <div class="cooldown-content" style="max-width: 500px;">
                    <div class="checkmark" style="background: #25D366; color: white; width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 20px;">
                        <i class="fab fa-whatsapp"></i>
                    </div>
                    <h3 style="color: #25D366;">¡Turno Reservado!</h3>
                    <p><strong>${clientName}</strong></p>
                    <p>📅 ${formattedDate} a las ${horaReserva}</p>
                    
                    <div style="background: #f0f9ff; padding: 15px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #25D366;">
                        <h4 style="margin-bottom: 10px; color: #333;">📱 Para confirmar en WhatsApp:</h4>
                        <p style="margin: 5px 0;">1. Abre WhatsApp en tu celular</p>
                        <p style="margin: 5px 0;">2. Envía este mensaje al número:</p>
                        <p style="margin: 10px 0; font-weight: bold; font-size: 1.2rem; color: #25D366;">${cleanNumber}</p>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 15px; border-radius: 10px; margin: 15px 0; border: 1px solid #ffeaa7;">
                        <h4 style="margin-bottom: 10px; color: #856404;">📋 Mensaje para copiar:</h4>
                        <textarea id="whatsapp-message" style="width: 100%; height: 120px; padding: 10px; border: 2px solid #25D366; border-radius: 5px; font-family: monospace; resize: none; margin-bottom: 10px;">${mensajeCompleto}</textarea>
                        <button id="copy-btn" style="background: #25D366; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 8px; margin: 0 auto;">
                            <i class="fas fa-copy"></i> Copiar Mensaje
                        </button>
                    </div>
                    
                    <p class="small-text">Si WhatsApp no se abrió automáticamente, usa los pasos de arriba.</p>
                    
                    <button id="close-fallback" style="background: #6c757d; color: white; border: none; padding: 10px 25px; border-radius: 5px; cursor: pointer; margin-top: 15px;">
                        Cerrar
                    </button>
                </div>
            `;
            
            // Reemplazar el contenido de cooldown
            cooldownMessageEl.innerHTML = fallbackHTML;
            
            // Agregar funcionalidad al botón de copiar
            setTimeout(() => {
                const copyBtn = document.getElementById('copy-btn');
                const textarea = document.getElementById('whatsapp-message');
                const closeBtn = document.getElementById('close-fallback');
                
                if (copyBtn && textarea) {
                    copyBtn.addEventListener('click', function() {
                        textarea.select();
                        document.execCommand('copy');
                        
                        // Cambiar texto del botón
                        const originalText = this.innerHTML;
                        this.innerHTML = '<i class="fas fa-check"></i> ¡Copiado!';
                        this.style.background = '#28a745';
                        
                        setTimeout(() => {
                            this.innerHTML = originalText;
                            this.style.background = '#25D366';
                        }, 2000);
                    });
                }
                
                if (closeBtn) {
                    closeBtn.addEventListener('click', function() {
                        resetCooldown();
                    });
                }
            }, 100);
        }
    }

    function resetSelection() {
        console.log('Reseteando selección');
        
        selectedDay = null;
        selectedTime = null;
        selectedHour = null;
        
        const selectedDayElement = document.querySelector('.day.selected');
        if (selectedDayElement) selectedDayElement.classList.remove('selected');
        
        const selectedTimeElement = document.querySelector('.time-slot.selected');
        if (selectedTimeElement) selectedTimeElement.classList.remove('selected');
        
        selectedDayInfoEl.innerHTML = '<p>Selecciona un día en el calendario</p>';
        timeSectionEl.style.display = 'none';
        bookingFormEl.style.display = 'none';
        clientNameInput.value = '';
        selectedDateDisplay.textContent = '--/--/----';
        selectedTimeDisplay.textContent = '--:--';
        
        if (window.innerWidth < 768) {
            document.querySelector('.calendar-section').scrollIntoView({ behavior: 'smooth' });
        }
    }

    function openLocation() {
        console.log('Abriendo ubicación');
        
        try {
            const locationURL = getLocationAddress();
            
            if (!locationURL || !locationURL.startsWith('http')) {
                throw new Error('URL de ubicación inválida');
            }
            
            window.open(locationURL, '_blank', 'noopener,noreferrer');
            
        } catch (error) {
            console.error('Error al abrir ubicación:', error);
            window.open("https://maps.app.goo.gl/sPr6mxZVzbrq8vxt5", '_blank');
        }
    }

    function updateUIFromStorage() {
        console.log('Actualizando UI desde almacenamiento');
        
        if (selectedDay) {
            const dateObj = parseDate(selectedDay);
            generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
            
            const dayElement = document.querySelector(`.day[data-date="${selectedDay}"]`);
            if (dayElement && !dayElement.classList.contains('booked') && 
                !dayElement.classList.contains('blocked') && 
                !dayElement.classList.contains('disabled')) {
                
                dayElement.classList.add('selected');
                showAvailableTimes(selectedDay, dateObj);
                
                // Verificar si el horario seleccionado sigue disponible
                const currentHour = selectedHour || selectedTime;
                if (currentHour) {
                    const isAvailable = isTimeSlotAvailable(selectedDay, currentHour);
                    if (!isAvailable) {
                        selectedTime = null;
                        selectedHour = null;
                        bookingFormEl.style.display = 'none';
                        selectedDateDisplay.textContent = '--/--/----';
                        selectedTimeDisplay.textContent = '--:--';
                        alert('El horario seleccionado ya no está disponible. Por favor selecciona otro.');
                    }
                }
            } else {
                resetSelection();
            }
        } else {
            generateCalendar(currentDate.getFullYear(), currentDate.getMonth());
        }
    }

    // Funciones auxiliares
    function formatDateForDisplay(dateString) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    function parseDate(dateString) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    // Iniciar
    init();
    console.log('Cliente listo');
});