# ТИ решаваш! - Сигнали за замърсяване на въздуха

PWA приложение за подаване на сигнали за замърсяване на въздуха към РИОСВ - Велико Търново.

## Функционалности

- Офлайн поддръжка (PWA)
- Double opt-in email потвърждение
- Cloudflare Turnstile защита от ботове
- Автоматично генериране на DOCX документ
- Rate limiting (3 сигнала на ден)
- CC копие до подателя - при изпращане на сигнал към РИОСВ, потребителят получава копие на имейла, за да може да следи историята на подадените сигнали

## Технологии

- **Frontend**: Vanilla JS, HTML, CSS
- **Backend**: Cloudflare Pages Functions
- **Storage**: Cloudflare KV
- **Email**: Postal SMTP сървър
- **Anti-bot**: Cloudflare Turnstile

## Разработка

```bash
npm install
npm run dev
```

## Deployment

Автоматично през Cloudflare Pages или ръчно:

```bash
npx wrangler pages deploy . --project-name=signal-tireshavashzavt-org
```

## Environment Variables (Cloudflare)

| Променлива | Описание |
|------------|----------|
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret |
| `POSTAL_API_URL` | Postal сървър URL |
| `POSTAL_API_KEY` | Postal API ключ |
| `FROM_EMAIL` | Email за изпращане |
| `FROM_NAME` | Име на подателя |
| `RIOSV_EMAIL` | Email на РИОСВ |
| `CONFIRM_BASE_URL` | URL за потвърждение |
| `STATS_KEY` | Ключ за достъп до статистики |

## Документация

Пълна документация: [/docs/](https://signal.tireshavashzavt.org/docs/)

## Лиценз

MIT

---

Гражданско сдружение "Ти Решаваш за Велико Търново"
