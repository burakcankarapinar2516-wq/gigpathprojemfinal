import CryptoJS from 'crypto-js';

const STORAGE_KEY = 'gigpath_vault';
const PIN_CHECK_KEY = 'gigpath_pin_check'; // Used to verify if PIN is correct

export const encryption = {
  /**
   * Hashes a PIN to use as the AES key.
   * In a real app we'd use PBKDF2 with a random salt, but keeping it simple here.
   */
  hashPin(pin: string): string {
    return CryptoJS.SHA256(pin).toString();
  },

  /**
   * Validates if the provided PIN can decrypt the test payload.
   * If there's no test payload, it means it's the first time and we accept any PIN.
   */
  verifyPin(pin: string): boolean {
    const storedCheck = localStorage.getItem(PIN_CHECK_KEY);
    if (!storedCheck) return true; // first time

    try {
      const hashedKey = this.hashPin(pin);
      const output = CryptoJS.AES.decrypt(storedCheck, hashedKey).toString(CryptoJS.enc.Utf8);
      return output === 'GIGPATH_OK';
    } catch (e) {
      return false;
    }
  },

  /**
   * Initializes the vault with a new PIN
   */
  setPin(pin: string) {
    const hashedKey = this.hashPin(pin);
    const encryptedCheck = CryptoJS.AES.encrypt('GIGPATH_OK', hashedKey).toString();
    localStorage.setItem(PIN_CHECK_KEY, encryptedCheck);
  },

  /**
   * Encrypts and saves data to localStorage
   */
  saveData(pin: string, data: any) {
    const hashedKey = this.hashPin(pin);
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), hashedKey).toString();
    localStorage.setItem(STORAGE_KEY, encrypted);
  },

  /**
   * Loads and decrypts data from localStorage
   */
  loadData(pin: string): any {
    const encrypted = localStorage.getItem(STORAGE_KEY);
    if (!encrypted) return null;

    if (!this.verifyPin(pin)) {
      return null;
    }

    try {
      const hashedKey = this.hashPin(pin);
      const decrypted = CryptoJS.AES.decrypt(encrypted, hashedKey).toString(CryptoJS.enc.Utf8);
      if (!decrypted) return null;
      return JSON.parse(decrypted);
    } catch (e) {
      return null;
    }
  },

  
  hasExistingVault(): boolean {
    return !!localStorage.getItem(PIN_CHECK_KEY);
  }
};
