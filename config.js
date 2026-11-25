// Configuración de Ruta Real. Rellena estos valores cuando los tengáis.
window.RUTA_REAL_CONFIG = {
  // Enlace de pago de Premium (4,99 €). Por ejemplo un enlace de PayPal.me o de Stripe Payment Links.
  // Si está vacío, el botón activa una prueba gratuita de demostración en este navegador.
  PAYMENT_URL: "",

  // Dónde se envían las quejas y sugerencias. Acepta un endpoint de Formspree
  // (https://formspree.io/f/XXXX) o cualquier URL que reciba un POST con JSON.
  // Si está vacío, los mensajes se guardan en el navegador y se ofrece enviarlos por Instagram.
  FEEDBACK_ENDPOINT: "",

  // Servidor propio para que Rachel use un modelo de IA (POST {messages} -> {reply}).
  // Si está vacío, Rachel responde con su base de conocimiento integrada.
  RACHEL_API_URL: "",

  INSTAGRAM_URL: "https://www.instagram.com/somosrutareal?dmpr=MWZ5NWp1ZWpvdjFoaw=="
};
