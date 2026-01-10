// Starbnails - Manejo de almacenamiento (LocalStorage)
console.log('Cargando storage.js...');

/**
 * Guarda datos en LocalStorage
 */
function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error al guardar datos:', error);
        return false;
    }
}

/**
 * Obtiene datos de LocalStorage
 */
function getData(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error al obtener datos:', error);
        return null;
    }
}

/**
 * Inicializa los datos si no existen
 */
function initializeData() {
    console.log('Inicializando datos...');
    
    // Configuración por defecto
    if (!getData('starbnails_settings')) {
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
            // NÚMERO CORREGIDO - FORMATO INTERNACIONAL VÁLIDO
            whatsappNumber: "+5493804949550",
            locationAddress: "https://maps.app.goo.gl/sPr6mxZVzbrq8vxt5"
        };
        saveData('starbnails_settings', defaultSettings);
        console.log('Configuración por defecto creada');
    }
    
    if (!getData('starbnails_bookings')) {
        saveData('starbnails_bookings', []);
        console.log('Lista de turnos inicializada');
    }
    
    if (!getData('starbnails_last_update')) {
        saveData('starbnails_last_update', { timestamp: Date.now() });
    }
}

/**
 * Verifica si un horario está disponible - FUNCIÓN CORREGIDA
 */
function isTimeSlotAvailable(date, time) {
    try {
        const settings = getData('starbnails_settings') || {};
        
        // 1. Verificar si el día está bloqueado
        if ((settings.blockedDays || []).includes(date)) {
            console.log(`Día ${date} está bloqueado`);
            return false;
        }
        
        // 2. Verificar si hay horarios para ese día
        const dateObj = new Date(date + 'T00:00:00');
        const weekday = getWeekdayName(dateObj.getDay());
        const availableHours = settings.businessHours?.[weekday] || [];
        
        if (availableHours.length === 0) {
            console.log(`No hay horarios configurados para ${weekday}`);
            return false;
        }
        
        // 3. Verificar si el horario está en la lista de horarios disponibles
        if (!availableHours.includes(time)) {
            console.log(`Horario ${time} no está en la lista para ${weekday}`);
            return false;
        }
        
        // 4. Verificar si ya está reservado
        const bookings = getData('starbnails_bookings') || [];
        const isBooked = bookings.some(b => b.date === date && b.time === time);
        
        if (isBooked) {
            console.log(`Horario ${date} ${time} ya está reservado`);
            return false;
        }
        
        console.log(`Horario ${date} ${time} está disponible`);
        return true;
        
    } catch (error) {
        console.error('Error en isTimeSlotAvailable:', error);
        return false;
    }
}

/**
 * Obtiene nombre del día en inglés
 */
function getWeekdayName(dayIndex) {
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return weekdays[dayIndex];
}

/**
 * Obtiene nombre del día en español
 */
function getWeekdayNameES(dayIndex) {
    const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return weekdays[dayIndex];
}

/**
 * Obtiene días bloqueados
 */
function getBlockedDays() {
    const settings = getData('starbnails_settings') || {};
    return settings.blockedDays || [];
}

/**
 * Obtiene horarios por día
 */
function getBusinessHours(weekday) {
    const settings = getData('starbnails_settings') || {};
    return settings.businessHours?.[weekday] || [];
}

/**
 * Actualiza horarios
 */
function updateBusinessHours(weekday, hours) {
    try {
        const settings = getData('starbnails_settings') || {};
        if (!settings.businessHours) settings.businessHours = {};
        settings.businessHours[weekday] = hours.sort();
        return saveData('starbnails_settings', settings);
    } catch (error) {
        console.error('Error al actualizar horarios:', error);
        return false;
    }
}

/**
 * Bloquea/desbloquea día
 */
function updateBlockedDay(date, block) {
    try {
        const settings = getData('starbnails_settings') || {};
        let blockedDays = settings.blockedDays || [];
        
        if (block) {
            if (!blockedDays.includes(date)) blockedDays.push(date);
        } else {
            blockedDays = blockedDays.filter(d => d !== date);
        }
        
        settings.blockedDays = blockedDays;
        return saveData('starbnails_settings', settings);
    } catch (error) {
        console.error('Error al bloquear/desbloquear día:', error);
        return false;
    }
}

/**
 * Obtiene número de WhatsApp
 */
function getWhatsappNumber() {
    const settings = getData('starbnails_settings') || {};
    return settings.whatsappNumber || "+5493804949550";
}

/**
 * Actualiza número de WhatsApp
 */
function updateWhatsappNumber(number) {
    try {
        const settings = getData('starbnails_settings') || {};
        settings.whatsappNumber = number;
        return saveData('starbnails_settings', settings);
    } catch (error) {
        console.error('Error al actualizar WhatsApp:', error);
        return false;
    }
}

/**
 * Obtiene ubicación
 */
function getLocationAddress() {
    const settings = getData('starbnails_settings') || {};
    return settings.locationAddress || "https://maps.app.goo.gl/sPr6mxZVzbrq8vxt5";
}

/**
 * Actualiza ubicación
 */
function updateLocationAddress(address) {
    try {
        const settings = getData('starbnails_settings') || {};
        settings.locationAddress = address;
        return saveData('starbnails_settings', settings);
    } catch (error) {
        console.error('Error al actualizar ubicación:', error);
        return false;
    }
}

/**
 * Formatea fecha - FUNCIÓN MEJORADA
 */
function formatDate(date) {
    if (!date) return '';
    
    let dateObj;
    if (date instanceof Date) {
        dateObj = date;
    } else if (typeof date === 'string') {
        dateObj = new Date(date);
    } else {
        dateObj = new Date();
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Obtiene todos los turnos
 */
function getAllBookings() {
    return getData('starbnails_bookings') || [];
}

/**
 * Obtiene turnos por fecha
 */
function getBookingsForDate(date) {
    const bookings = getData('starbnails_bookings') || [];
    return bookings.filter(b => b.date === date);
}

/**
 * Agrega turno - FUNCIÓN MEJORADA
 */
function addBooking(booking) {
    try {
        if (!booking.name || !booking.date || !booking.time) {
            console.error('Datos incompletos:', booking);
            return { success: false, message: 'Datos incompletos' };
        }
        
        console.log(`Intentando agregar reserva: ${booking.date} ${booking.time}`);
        
        // Validar disponibilidad
        if (!isTimeSlotAvailable(booking.date, booking.time)) {
            console.error(`Horario no disponible: ${booking.date} ${booking.time}`);
            return { success: false, message: 'Horario no disponible' };
        }
        
        const bookings = getData('starbnails_bookings') || [];
        
        // Verificar que no exista ya
        const exists = bookings.some(b => b.date === booking.date && b.time === booking.time);
        if (exists) {
            console.error(`Ya existe una reserva para ${booking.date} ${booking.time}`);
            return { success: false, message: 'Horario ya reservado' };
        }
        
        // Crear booking con ID único
        booking.id = Date.now() + Math.floor(Math.random() * 1000);
        booking.timestamp = new Date().toISOString();
        bookings.push(booking);
        
        console.log(`Reserva creada con ID: ${booking.id}`);
        
        const success = saveData('starbnails_bookings', bookings);
        
        if (success) {
            console.log(`Reserva guardada exitosamente: ${booking.name} - ${booking.date} ${booking.time}`);
            return {
                success: true,
                booking: booking,
                message: 'Turno reservado exitosamente'
            };
        } else {
            console.error('Error al guardar en localStorage');
            return { success: false, message: 'Error al guardar' };
        }
        
    } catch (error) {
        console.error('Error al agregar turno:', error);
        return { success: false, message: 'Error del sistema' };
    }
}

/**
 * Elimina turno
 */
function removeBooking(bookingId) {
    try {
        const bookings = getData('starbnails_bookings') || [];
        const updated = bookings.filter(b => b.id !== bookingId);
        return saveData('starbnails_bookings', updated);
    } catch (error) {
        console.error('Error al eliminar turno:', error);
        return false;
    }
}

/**
 * Obtiene estadísticas
 */
function getStats() {
    const bookings = getData('starbnails_bookings') || [];
    const settings = getData('starbnails_settings') || {};
    const today = formatDate(new Date());
    
    return {
        todayBookings: bookings.filter(b => b.date === today).length,
        totalBookings: bookings.length,
        blockedDaysCount: (settings.blockedDays || []).length
    };
}

/**
 * Limpia todos los datos
 */
function clearStarbnailsData() {
    try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('starbnails_')) keys.push(key);
        }
        keys.forEach(key => localStorage.removeItem(key));
        return keys.length;
    } catch (error) {
        console.error('Error al limpiar datos:', error);
        return 0;
    }
}

// Exportar funciones
window.saveData = saveData;
window.getData = getData;
window.initializeData = initializeData;
window.isTimeSlotAvailable = isTimeSlotAvailable;
window.getWeekdayName = getWeekdayName;
window.getWeekdayNameES = getWeekdayNameES;
window.getBlockedDays = getBlockedDays;
window.getBusinessHours = getBusinessHours;
window.updateBusinessHours = updateBusinessHours;
window.updateBlockedDay = updateBlockedDay;
window.getWhatsappNumber = getWhatsappNumber;
window.updateWhatsappNumber = updateWhatsappNumber;
window.getLocationAddress = getLocationAddress;
window.updateLocationAddress = updateLocationAddress;
window.formatDate = formatDate;
window.getAllBookings = getAllBookings;
window.getBookingsForDate = getBookingsForDate;
window.addBooking = addBooking;
window.removeBooking = removeBooking;
window.getStats = getStats;
window.clearStarbnailsData = clearStarbnailsData;

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', initializeData);
console.log('storage.js cargado correctamente');