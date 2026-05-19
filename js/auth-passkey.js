/**
 * Tablero Rö — Passkey Authentication Module
 * ==========================================
 * Versión: 1.0.0
 * 
 * Implementa autenticación biométrica mediante WebAuthn/Passkeys para
 * proteger el acceso al tablero personal.
 * 
 * Características de seguridad:
 * - Sin contraseñas: usa passkeys (biometría, PIN, llave de seguridad)
 * - Credenciales almacenadas en hardware seguro (TPM, Secure Enclave)
 * - Resistente a phishing (vinculado al dominio)
 * - Sin transmisión de secretos (challenge-response criptográfico)
 * 
 * localStorage keys:
 *   tablero_passkey_users  — lista de usuarios registrados {id, username, credentialId}
 *   tablero_current_user   — usuario actual autenticado (solo username)
 * 
 * sessionStorage keys:
 *   tablero_session_token  — token de sesión (timestamp de login)
 *   tablero_session_user   — username del usuario autenticado
 */

const AUTH_LS_USERS = 'tablero_passkey_users';
const AUTH_LS_CURRENT = 'tablero_current_user';
const AUTH_SS_TOKEN = 'tablero_session_token';
const AUTH_SS_USER = 'tablero_session_user';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Verificar si WebAuthn está disponible en el navegador
 */
function isPasskeySupported() {
    return (
        window.PublicKeyCredential !== undefined &&
        navigator.credentials !== undefined &&
        typeof navigator.credentials.create === 'function' &&
        typeof navigator.credentials.get === 'function'
    );
}

/**
 * Generar un challenge aleatorio (servidor simula con crypto.random)
 */
function generateChallenge() {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return array;
}

/**
 * Convertir ArrayBuffer a Base64
 */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

/**
 * Convertir Base64 a ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Generar un user ID único
 */
function generateUserId() {
    return crypto.randomUUID();
}

/**
 * Obtener lista de usuarios registrados
 */
function getRegisteredUsers() {
    const stored = localStorage.getItem(AUTH_LS_USERS);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Guardar lista de usuarios
 */
function saveUsers(users) {
    localStorage.setItem(AUTH_LS_USERS, JSON.stringify(users));
}

/**
 * Verificar si hay una sesión activa y válida
 */
function isSessionActive() {
    const token = sessionStorage.getItem(AUTH_SS_TOKEN);
    const user = sessionStorage.getItem(AUTH_SS_USER);
    
    if (!token || !user) return false;
    
    const loginTime = parseInt(token, 10);
    const now = Date.now();
    
    // Verificar que la sesión no haya expirado
    if (now - loginTime > SESSION_DURATION) {
        clearSession();
        return false;
    }
    
    return true;
}

/**
 * Obtener usuario actual de la sesión
 */
function getCurrentUser() {
    return sessionStorage.getItem(AUTH_SS_USER);
}

/**
 * Iniciar sesión
 */
function startSession(username) {
    sessionStorage.setItem(AUTH_SS_TOKEN, Date.now().toString());
    sessionStorage.setItem(AUTH_SS_USER, username);
    localStorage.setItem(AUTH_LS_CURRENT, username);
}

/**
 * Cerrar sesión
 */
function clearSession() {
    sessionStorage.removeItem(AUTH_SS_TOKEN);
    sessionStorage.removeItem(AUTH_SS_USER);
    localStorage.removeItem(AUTH_LS_CURRENT);
}

/**
 * Registrar un nuevo passkey
 */
async function registerPasskey(username) {
    if (!isPasskeySupported()) {
        throw new Error('Tu navegador no soporta passkeys. Actualiza a la última versión de Chrome, Safari, Edge o Firefox.');
    }
    
    if (!username || username.trim().length === 0) {
        throw new Error('Debes proporcionar un nombre de usuario.');
    }
    
    username = username.trim();
    
    // Verificar si el usuario ya existe
    const users = getRegisteredUsers();
    const existingUser = users.find(u => u.username === username);
    
    if (existingUser) {
        throw new Error('Este nombre de usuario ya está registrado. Usa "Iniciar sesión" en su lugar.');
    }
    
    const userId = generateUserId();
    const challenge = generateChallenge();
    
    // Configuración de la credencial
    const publicKeyCredentialCreationOptions = {
        challenge: challenge,
        rp: {
            name: 'Tablero Rö',
            id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname
        },
        user: {
            id: new TextEncoder().encode(userId),
            name: username,
            displayName: username
        },
        pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
            authenticatorAttachment: 'platform', // Preferir autenticadores de plataforma (Touch ID, Face ID, Windows Hello)
            requireResidentKey: true,
            residentKey: 'required',
            userVerification: 'required' // Requiere verificación biométrica o PIN
        },
        timeout: 60000,
        attestation: 'none'
    };
    
    try {
        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
        });
        
        if (!credential) {
            throw new Error('No se pudo crear la credencial.');
        }
        
        // Guardar información del usuario
        const newUser = {
            id: userId,
            username: username,
            credentialId: arrayBufferToBase64(credential.rawId),
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        saveUsers(users);
        
        // Iniciar sesión automáticamente
        startSession(username);
        
        return newUser;
    } catch (error) {
        console.error('Error en registro de passkey:', error);
        
        if (error.name === 'NotAllowedError') {
            throw new Error('Registro cancelado. Debes autorizar el uso de tu biometría o PIN.');
        } else if (error.name === 'InvalidStateError') {
            throw new Error('Ya existe un passkey para este dispositivo. Intenta iniciar sesión.');
        } else {
            throw new Error(`Error al registrar passkey: ${error.message}`);
        }
    }
}

/**
 * Autenticar con passkey existente
 */
async function authenticatePasskey(username) {
    if (!isPasskeySupported()) {
        throw new Error('Tu navegador no soporta passkeys.');
    }
    
    const users = getRegisteredUsers();
    let allowCredentials = [];
    
    // Si se proporciona username, filtrar solo ese usuario
    if (username && username.trim().length > 0) {
        const user = users.find(u => u.username === username.trim());
        if (!user) {
            throw new Error('Usuario no encontrado. Debes registrarte primero.');
        }
        allowCredentials = [{
            id: base64ToArrayBuffer(user.credentialId),
            type: 'public-key',
            transports: ['internal', 'hybrid']
        }];
    } else if (users.length === 0) {
        throw new Error('No hay usuarios registrados. Debes registrarte primero.');
    } else {
        // Permitir cualquier credencial registrada
        allowCredentials = users.map(u => ({
            id: base64ToArrayBuffer(u.credentialId),
            type: 'public-key',
            transports: ['internal', 'hybrid']
        }));
    }
    
    const challenge = generateChallenge();
    
    const publicKeyCredentialRequestOptions = {
        challenge: challenge,
        rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
        allowCredentials: allowCredentials,
        userVerification: 'required',
        timeout: 60000
    };
    
    try {
        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
        });
        
        if (!assertion) {
            throw new Error('No se pudo autenticar.');
        }
        
        // Buscar el usuario por credentialId
        const credentialId = arrayBufferToBase64(assertion.rawId);
        const user = users.find(u => u.credentialId === credentialId);
        
        if (!user) {
            throw new Error('Credencial no reconocida.');
        }
        
        // Iniciar sesión
        startSession(user.username);
        
        return user;
    } catch (error) {
        console.error('Error en autenticación de passkey:', error);
        
        if (error.name === 'NotAllowedError') {
            throw new Error('Autenticación cancelada.');
        } else {
            throw new Error(`Error al autenticar: ${error.message}`);
        }
    }
}

/**
 * Eliminar un usuario registrado
 */
function deletePasskeyUser(username) {
    const users = getRegisteredUsers();
    const filteredUsers = users.filter(u => u.username !== username);
    
    if (filteredUsers.length === users.length) {
        throw new Error('Usuario no encontrado.');
    }
    
    saveUsers(filteredUsers);
    
    // Si se eliminó el usuario actual, cerrar sesión
    if (getCurrentUser() === username) {
        clearSession();
    }
}

/**
 * Cerrar sesión del usuario actual
 */
function logout() {
    clearSession();
}
