declare global {
  var tokenStore: Map<string, string> | undefined;
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a-beleza-salvara-o-mundo';

async function getKey() {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptToken(token: string): Promise<string> {
  const key = await getKey();
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(token)
  );
  
  // Combinar IV + dados criptografados em base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode.apply(null, Array.from(combined)));
}

export async function decryptToken(encryptedToken: string): Promise<string> {
  const key = await getKey();
  const decoder = new TextDecoder();
  
  // Decodificar base64
  const combined = new Uint8Array(
    atob(encryptedToken)
      .split('')
      .map(char => char.charCodeAt(0))
  );
  
  // Separar IV e dados criptografados
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  );
  
  return decoder.decode(decrypted);
}


export function getTokenStore(): Map<string, string> {
  global.tokenStore = global.tokenStore || new Map();
  return global.tokenStore;
}

export async function validateToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.azion.com/v4/edge_sql/databases', {
      headers: {
        'Authorization': `Token ${token}`,
        'Accept': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
} 