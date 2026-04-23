/**
 * Supabase Service
 * Servicio para enviar datos a Supabase
 */

import { SUPABASE_CONFIG } from '../config/supabase.js';

export class SupabaseService {
    constructor() {
        this.functionUrl = SUPABASE_CONFIG.functionUrl;
        this.anonKey = SUPABASE_CONFIG.anonKey;
    }

    /**
     * Sube datos a Supabase
     * @param {Array} data - Array de objetos JSON
     * @param {string} type - Tipo: 'CONFECCION' o 'PROCESOS'
     * @returns {Promise<Object>} Resultado de la operación
     */
    async uploadData(data, type) {
        try {
            const response = await fetch(this.functionUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.anonKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: data,
                    type: type
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al subir datos');
            }

            return {
                success: true,
                message: result.message,
                data: result.data
            };

        } catch (error) {
            console.error('Error en SupabaseService:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verifica la conexión con Supabase
     * @returns {Promise<boolean>}
     */
    async testConnection() {
        try {
            const response = await fetch(this.functionUrl, {
                method: 'OPTIONS',
                headers: {
                    'Authorization': `Bearer ${this.anonKey}`
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Error al verificar conexión:', error);
            return false;
        }
    }
}
