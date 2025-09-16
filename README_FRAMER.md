// FILE: README_FRAMER.md
# Framer Zahlungs-Setup

## Redirect & Erfolgsseite
1. Erstelle in Framer eine "Thank You"-Seite unter `/thank-you`.
2. Setze im Checkout den Redirect auf `https://dein-domain/thank-you`.

## Webhook-Konfiguration
- URL: `https://dein-domain/api/pay/webhook`
- Methode: POST
- Body: JSON (wird direkt an Viralix weitergereicht)

## SSO Flow
1. Nach erfolgreichem Checkout sende `POST https://dein-domain/api/session/issue` mit `{ "userId": "<framer-user-id>" }`.
2. Der Endpoint setzt ein `viralix_sso`-Cookie (Secure, SameSite=None, HttpOnly) für deine Domain.
3. Leite danach den Nutzer auf `/thank-you` weiter; das Frontend liest das Cookie und stellt die Session her.

## Testen
- Nutze `curl -X POST https://localhost:3000/api/pay/webhook -H "Content-Type: application/json" -d '{"event":"test","payload":{}}'`.
- SSO Cookie prüfen: `curl -i -X POST https://localhost:3000/api/session/issue -H "Content-Type: application/json" -d '{"userId":123}'`.
