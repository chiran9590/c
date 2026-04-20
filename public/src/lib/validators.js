// src/lib/validators.js

export function validateRegister({ name, phone, email, password, confirm }) {
  const errors = {};
  if (!name.trim())
    errors.name = "Name is required";
  if (!/^\+?[\d\s\-()\\.]{7,15}$/.test(phone))
    errors.phone = "Enter a valid phone number";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Enter a valid email address";
  if (password.length < 6)
    errors.password = "Password must be at least 6 characters";
  if (password !== confirm)
    errors.confirm = "Passwords do not match";
  return errors;
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Enter a valid email address";
  if (!password)
    errors.password = "Password is required";
  return errors;
}
