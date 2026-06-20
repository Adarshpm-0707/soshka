/**
 * Validates email address format.
 * @param {string} email 
 * @returns {boolean}
 */
export function validateEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(String(email).toLowerCase());
}

/**
 * Validates phone number (simple 10-digit check).
 * @param {string} phone 
 * @returns {boolean}
 */
export function validatePhone(phone) {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone);
}

/**
 * Validates zip code (Indian PIN code check of 6 digits).
 * @param {string} zip 
 * @returns {boolean}
 */
export function validateZipCode(zip) {
  const re = /^\d{6}$/;
  return re.test(zip);
}

/**
 * Validates register forms.
 */
export function validateRegisterForm({ name, email, phone, password, confirmPassword }) {
  const errors = {};

  if (!name || name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long.';
  }

  if (!email || !validateEmail(email)) {
    errors.email = 'Please provide a valid email address.';
  }

  if (!phone || !validatePhone(phone)) {
    errors.phone = 'Please provide a valid 10-digit mobile number.';
  }

  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates checkout address forms.
 */
export function validateAddressForm({ name, phone, addressLine, city, state, postalCode }) {
  const errors = {};

  if (!name || name.trim().length < 2) {
    errors.name = 'Full name is required.';
  }

  if (!phone || !validatePhone(phone)) {
    errors.phone = 'Please provide a valid 10-digit mobile number.';
  }

  if (!addressLine || addressLine.trim().length < 5) {
    errors.addressLine = 'Street address must be at least 5 characters.';
  }

  if (!city || city.trim().length < 2) {
    errors.city = 'City name is required.';
  }

  if (!state || state.trim().length < 2) {
    errors.state = 'State is required.';
  }

  if (!postalCode || !validateZipCode(postalCode)) {
    errors.postalCode = 'Please provide a valid 6-digit postal code (PIN code).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates contact form.
 */
export function validateContactForm({ name, email, message }) {
  const errors = {};

  if (!name || name.trim().length < 2) {
    errors.name = 'Name is required.';
  }

  if (!email || !validateEmail(email)) {
    errors.email = 'Please provide a valid email address.';
  }

  if (!message || message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters long.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
