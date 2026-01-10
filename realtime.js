// Starbnails - Sincronización en tiempo real
console.log('Cargando realtime.js...');

let lastUpdateTime = Date.now();
let syncCheckInterval = null;

/**
 * Notifica actualizaciones
 */
function notifyStorageUpdate() {
    try {
        const syncData = { timestamp: Date.now(), source: 'starbnails' };
        saveData('starbnails_last_update', syncData);
        
        const event = new CustomEvent('storageUpdated', { detail: syncData });
        window.dispatchEvent(event);
        
        return true;
    } catch (error) {
        console.error('Error al notificar actualización:', error);
        return false;
    }
}

/**
 * Verifica actualizaciones
 */
function checkForUpdates() {
    try {
        const syncData = getData('starbnails_last_update');
        if (!syncData || !syncData.timestamp) return false;
        
        if (syncData.timestamp > lastUpdateTime) {
            lastUpdateTime = syncData.timestamp;
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error al verificar actualizaciones:', error);
        return false;
    }
}

/**
 * Configura sincronización
 */
function setupRealtimeSync() {
    console.log('Configurando sincronización...');
    
    if (syncCheckInterval) clearInterval(syncCheckInterval);
    
    syncCheckInterval = setInterval(() => {
        if (checkForUpdates()) {
            const event = new CustomEvent('storageUpdated', { detail: { timestamp: lastUpdateTime } });
            window.dispatchEvent(event);
        }
    }, 1000);
    
    window.addEventListener('storage', function(event) {
        if (event.key === 'starbnails_last_update' && event.newValue) {
            try {
                const parsed = JSON.parse(event.newValue);
                if (parsed.timestamp > lastUpdateTime) {
                    lastUpdateTime = parsed.timestamp;
                    const event = new CustomEvent('storageUpdated', { detail: parsed });
                    window.dispatchEvent(event);
                }
            } catch (error) {
                console.error('Error procesando evento storage:', error);
            }
        }
    });
    
    const syncData = getData('starbnails_last_update');
    if (syncData && syncData.timestamp) {
        lastUpdateTime = syncData.timestamp;
    }
    
    console.log('Sincronización configurada');
    return true;
}

/**
 * Intenta reservar con prevención de conflictos - FUNCIÓN CORREGIDA
 */
function attemptReservation(date, time, clientName) {
    console.log(`=== INTENTANDO RESERVA ===`);
    console.log(`Fecha: ${date}, Hora: ${time}, Cliente: ${clientName}`);
    
    try {
        // Verificar disponibilidad inmediatamente
        console.log(`Verificando disponibilidad...`);
        const isAvailable = isTimeSlotAvailable(date, time);
        
        if (!isAvailable) {
            console.error(`Horario NO disponible: ${date} ${time}`);
            return {
                success: false,
                message: 'Horario no disponible. Por favor selecciona otro horario.'
            };
        }
        
        console.log(`Horario disponible. Creando reserva...`);
        
        // Crear objeto booking
        const booking = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            name: clientName,
            date: date,
            time: time,
            timestamp: new Date().toISOString()
        };
        
        console.log(`Booking creado:`, booking);
        
        // Intentar agregar la reserva
        const result = addBooking(booking);
        
        if (result.success) {
            console.log(`✅ RESERVA EXITOSA: ID ${booking.id}`);
            console.log(`Notificando actualización...`);
            notifyStorageUpdate();
            
            return {
                success: true,
                booking: booking,
                message: 'Turno reservado exitosamente'
            };
        } else {
            console.error(`❌ ERROR EN RESERVA:`, result.message);
            return {
                success: false,
                message: result.message || 'Error al reservar el turno'
            };
        }
        
    } catch (error) {
        console.error('❌ ERROR CRÍTICO en attemptReservation:', error);
        return {
            success: false,
            message: 'Error del sistema. Por favor intenta nuevamente.'
        };
    }
}

/**
 * Obtiene estado de sincronización
 */
function getSyncStatus() {
    const lastSync = getData('starbnails_last_update');
    return {
        isActive: syncCheckInterval !== null,
        lastUpdate: lastSync?.timestamp || null,
        lastUpdateFormatted: lastSync?.timestamp ? new Date(lastSync.timestamp).toLocaleString('es-ES') : 'Nunca',
        updateFrequency: '1 segundo'
    };
}

/**
 * Detiene sincronización
 */
function stopRealtimeSync() {
    if (syncCheckInterval) {
        clearInterval(syncCheckInterval);
        syncCheckInterval = null;
    }
}

// Exportar funciones
window.notifyStorageUpdate = notifyStorageUpdate;
window.checkForUpdates = checkForUpdates;
window.setupRealtimeSync = setupRealtimeSync;
window.attemptReservation = attemptReservation;
window.getSyncStatus = getSyncStatus;
window.stopRealtimeSync = stopRealtimeSync;

// Iniciar automáticamente
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(setupRealtimeSync, 1000);
});

console.log('realtime.js cargado correctamente');