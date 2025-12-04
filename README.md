# FixNow - Servicios Profesionales al Instante

Cliente React + Vite para la plataforma **FixNow**, conectando clientes con profesionales calificados para reparaciones y servicios.

## Requisitos de entorno (Node.js)

- Node.js >= 20.19.0 (Vite 7 requiere 20.19+ o 22.12+)
- Recomendado en Windows: nvm-windows para gestionar versiones de Node

Pasos rápidos con nvm-windows:

1. Instala/actualiza nvm-windows: https://github.com/coreybutler/nvm-windows/releases/latest
2. En una terminal nueva (PowerShell):

	```powershell
	nvm install 20.19.1
	nvm use 20.19.1
	node -v    # debe mostrar v20.19.1
	where node # debe apuntar a C:\\Program Files\\nodejs\\node.exe (symlink)
	```

Nota: nvm/use es global. No es por carpeta; reinicia terminales tras cambiar de versión.

## Variables de entorno del cliente

1. Copia `.env.example` a `.env.development` y ajusta:

	```env
	VITE_API_URL=http://localhost:5000
	# VITE_API_PREFIX=/api  # opcional, por defecto /api
	```

2. En producción, configura `VITE_API_URL` en el entorno de despliegue (por ejemplo Vercel) al origen del backend.


This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

## Roles y flujos de acceso (Resumen funcional)

Este proyecto implementa usuarios multi-rol con “modo visual” (viewRole) para adaptar la UI a Cliente, Proveedor o Admin. A continuación, un resumen práctico para el equipo.

### Conceptos clave

- Un usuario puede tener varios roles simultáneamente: ['client'], ['client','provider'], ['admin'].
- Proveedor implica cliente: si eres provider, también tienes client.
- El “modo visual” define qué menú y rutas se destacan en la UI. Puede ser:
	- Automático: la app lo ajusta según la ruta visitada.
	- Fijado manualmente: el usuario lo bloquea con el conmutador visible en el Header o desde el menú de cuenta. Hay un chip “Fijado” cuando está bloqueado.

### Rutas fuertes → Modo visual (auto)

```
Provider paths: /empleos, /mensajes, /servicios, /calendario, /referidos, /plan
Client paths:   /mis-solicitudes, /reservas
Admin paths:    /admin

Regla: si no está fijado, la UI ajusta viewRole al rol asociado a la ruta.
```

### Invitado (guest)

- Acceso: landing y contenido público. Se crea sessionId de invitado.
- Menú: “Explore nuestros servicios”, “Únete como profesional”, “Regístrate”, botón “Inicia Sesión”.
- Colores: azul de marca (activos, hover y neutrales).
- Auto-merge: al registrarte o autenticarte, se fusionan datos útiles del invitado por sessionId/email.

### Cliente (client)

- Cómo se obtiene: registrándote como cliente → roles = ['client']; o al registrarte como proveedor (nuevo) que implica cliente.
- Acceso: “Mis solicitudes”, “Reservas”, flujos de contratación. No ve rutas de proveedor ni admin.
- UI: colores verdes (emerald). Si también es proveedor, ve el conmutador de modo.
- Auto: entrar a rutas de cliente ajusta el modo salvo que esté fijado otro.

### Proveedor (provider)

- Registro nuevo como proveedor: Sí, obtiene acceso automático a cliente y proveedor → roles = ['client','provider'].
- Si ya existía como cliente: la ruta de registro de proveedor devuelve 409; se usa POST /auth/become-provider para ampliar roles sin duplicar cuenta.
- Acceso: “Empleos”, “Solicitudes/Mensajes”, “Servicios”, “Calendario”, “Recomendar”, “Reservas”. Puede alternar a modo cliente.
- UI: azul de marca. Conmutador visible si también tiene cliente (siempre en este caso).
- Auto: rutas de proveedor ajustan el modo salvo que esté fijado otro.

### Administrador (admin)

- Acceso: panel “/admin” con “Estado del sistema”, “Alertas administrativas” (contador), “Moderación”, etc.
- UI: índigo. El conmutador cliente/proveedor solo aparece si también cuenta con esos roles.

### Escenarios frecuentes (mapa mental)

- Invitado → Registro cliente
	- Crea cuenta ['client'], fusiona datos de invitado si aplica. UI en modo cliente.
- Invitado → Registro proveedor (nuevo)
	- Crea cuenta ['client','provider'], fusiona datos de invitado. UI en modo proveedor (puede alternar a cliente).
- Cliente → become-provider
	- POST /auth/become-provider añade provider a roles y habilita UI de proveedor; aparece conmutador.
- Multi-rol navegando
	- Entrar a /empleos activa modo proveedor (si no está fijado). Cambiar manual desde conmutador lo fija hasta “Restablecer modo automático”.

### Pistas visuales de rol en la UI

- Colores de acento por rol: Invitado/Proveedor = azul de marca, Cliente = verde, Admin = índigo.
- El Header (logo, enlaces, botón de cuenta, menú móvil) y botones primarios adoptan el acento del rol/viewRole.
- El chip cerca del conmutador indica si el modo está “Fijado” (candado) o “Automático”.

### Notas de seguridad y control de acceso

- El backend usa RBAC por inclusión en roles[]. La UI oculta enlaces según modo/rol, pero el backend sigue siendo la fuente de verdad.
- Middlewares (orden): cookie-parser → ensureSession → jwtAuth → attachGuest para asegurar sesión de invitado y auto-merge.

---

Para dudas o ampliaciones, añade ejemplos de pantallas bajo esta sección o crea capturas con rutas típicas por rol.
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
