// Crea los datos de ejemplo para desarrollo: npm run seed
import { hasData, seedDatabase } from './db.js';

if (process.env.NODE_ENV === 'production') {
  console.error('Los datos de ejemplo no se crean en producción.');
  process.exit(1);
}
if (hasData()) {
  console.error('Ya existen datos. Ejecuta antes "npm run reset-data" si quieres empezar de cero.');
  process.exit(1);
}
seedDatabase();
console.log('Datos de ejemplo creados. Cuentas de prueba en el README.');
