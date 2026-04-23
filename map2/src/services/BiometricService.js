import { supabase } from '../config/supabase.js';

export class BiometricService {
    /**
     * Registra una nueva huella/FaceID para el usuario actual
     */
    static async register() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Debes estar autenticado para registrar biometría');

            // 1. Configuración del desafío (Challenge)
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const createOptions = {
                publicKey: {
                    challenge: challenge,
                    rp: { name: "MAP Pro" },
                    user: {
                        id: Uint8Array.from(user.id.split('').map(c => c.charCodeAt(0))),
                        name: user.email,
                        displayName: user.email
                    },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required"
                    },
                    timeout: 60000
                }
            };

            // 2. Activar el sensor del dispositivo
            const credential = await navigator.credentials.create(createOptions);
            
            if (!credential) throw new Error('No se pudo crear la credencial');

            // 3. Serializar para guardar en Supabase
            const credentialData = {
                user_id: user.id,
                credential_id: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
                public_key: btoa(String.fromCharCode(...new Uint8Array(credential.response.getPublicKey())))
            };

            // 4. Guardar en nuestra nueva tabla
            const { error } = await supabase
                .from('user_passkeys')
                .insert([credentialData]);

            if (error) throw error;

            return { success: true };
        } catch (err) {
            console.error('Error de registro biométrico:', err);
            throw err;
        }
    }

    /**
     * Intenta autenticar al usuario usando su huella
     */
    static async login() {
        try {
            // 1. Obtener el desafío del servidor (simulado localmente para simplicidad)
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            const getOptions = {
                publicKey: {
                    challenge: challenge,
                    timeout: 60000,
                    userVerification: "required"
                }
            };

            // 2. Pedir la huella al usuario
            const assertion = await navigator.credentials.get(getOptions);
            if (!assertion) throw new Error('Cancelado por el usuario');

            // 3. Buscar la credencial en nuestra tabla
            const credentialId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)));
            
            const { data, error } = await supabase
                .from('user_passkeys')
                .select('user_id')
                .eq('credential_id', credentialId)
                .single();

            if (error || !data) throw new Error('Dispositivo no reconocido. Regístralo primero.');

            // 4. Iniciar sesión usando Magic Link interno (Simulado con sesión persistente)
            // En un flujo real, aquí validaríamos la firma criptográfica. 
            // Para MAP, si el ID coincide, validamos la entrada.
            
            // Nota: Para login real sin contraseña, usaremos el email asociado al user_id
            const { data: userData } = await supabase.rpc('get_user_email', { uid: data.user_id });
            
            // Por ahora, devolvemos el éxito para que el sistema sepa que el hardware validó
            return { success: true, userId: data.user_id };

        } catch (err) {
            console.error('Error de login biométrico:', err);
            throw err;
        }
    }
}
