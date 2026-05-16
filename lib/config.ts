// URL pública do produto — usada no compartilhamento via WhatsApp.
// Configure via variável de ambiente NEXT_PUBLIC_APP_URL no deploy.
// Exemplo: NEXT_PUBLIC_APP_URL=https://amigodopredioapp.com.br
export const APP_URL: string = process.env.NEXT_PUBLIC_APP_URL ?? "";
