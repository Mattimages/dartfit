export type Lang = 'nl' | 'en' | 'de';

const strings: Record<Lang, Record<string, string>> = {
  nl: {
    'login.subject': 'Je inloglink voor DartFit',
    'login.body':
      'Klik binnen 20 minuten op deze link om in te loggen en je fit te bewaren:\n{url}\n\nHeb je dit niet aangevraagd? Dan kun je deze mail negeren.',
    'save.subject': 'Bevestig je e-mail en bewaar je fit',
    'save.body':
      'Je fit is bewaard. Tik op deze link om je e-mail te bevestigen, dan staat je fit voortaan in je account en hoef je je hand niet opnieuw te meten:\n{url}\n\nDe link werkt 24 uur. Heb je dit niet aangevraagd? Dan kun je deze mail negeren; we sturen je verder niets.',
    'confirm.subject': 'Bevestig je e-mail en bewaar je DartFit-account',
    'confirm.body':
      'Je dart-alerts staan aan. Tik op deze link om je e-mail te bevestigen en je account te bewaren. Dan hoef je je hand niet opnieuw te meten:\n{url}\n\nDe link werkt 24 uur. Heb je dit niet aangevraagd? Negeer deze mail dan, of meld je af via de link in elke alert.',
    'alert.subject': 'Er is een dart die nog beter bij je past: {name}',
    'alert.body':
      'Nieuw in onze database: {name}. Hij past beter bij je hand dan je vorige beste match (fit: {quality}).\n\nBekijk hem naast je andere opties:\n{url}',
    'feedback.subject': 'Welke dart heb je gekozen?',
    'feedback.body':
      'Twee weken geleden bekeek je darts via DartFit. Heb je er een gekocht, en hoe voelt het gewicht? Twee klikken, en de fits voor iedereen worden beter:\n{url}',
    'quality.excellent': 'uitstekend',
    'quality.good': 'goed',
    'quality.fair': 'redelijk',
    'quality.poor': 'matig',
    'unsub.done': 'Je bent afgemeld. Je krijgt deze e-mails niet meer.',
  },
  en: {
    'login.subject': 'Your DartFit sign-in link',
    'login.body':
      'Use this link within 20 minutes to sign in and keep your fit:\n{url}\n\nDidn’t ask for this? You can ignore this email.',
    'save.subject': 'Confirm your email and keep your fit',
    'save.body':
      'Your fit is saved. Tap this link to confirm your email, and your fit will live in your account so you never have to measure your hand again:\n{url}\n\nThe link works for 24 hours. Didn’t ask for this? Just ignore this email; we won’t send you anything else.',
    'confirm.subject': 'Confirm your email and keep your DartFit account',
    'confirm.body':
      'Your dart alerts are on. Tap this link to confirm your email and keep your account, so you don’t have to measure your hand again:\n{url}\n\nThe link works for 24 hours. Didn’t ask for this? Ignore this email, or unsubscribe with the link in any alert.',
    'alert.subject': 'A dart that fits you even better: {name}',
    'alert.body':
      'New in our database: {name}. It fits your hand better than your previous best match (fit: {quality}).\n\nSee it next to your other options:\n{url}',
    'feedback.subject': 'Which dart did you pick?',
    'feedback.body':
      'Two weeks ago you looked at darts on DartFit. Did you buy one, and how does the weight feel? Two clicks, and fits get better for everyone:\n{url}',
    'quality.excellent': 'excellent',
    'quality.good': 'good',
    'quality.fair': 'fair',
    'quality.poor': 'weak',
    'unsub.done': 'You are unsubscribed. You will not get these emails again.',
  },
  de: {
    'login.subject': 'Dein Anmeldelink für DartFit',
    'login.body':
      'Nutze diesen Link innerhalb von 20 Minuten, um dich anzumelden und deinen Fit zu speichern:\n{url}\n\nDu hast das nicht angefordert? Dann kannst du diese E-Mail einfach ignorieren.',
    'save.subject': 'Bestätige deine E-Mail und behalte deinen Fit',
    'save.body':
      'Dein Fit ist gespeichert. Tippe auf diesen Link, um deine E-Mail-Adresse zu bestätigen, dann liegt dein Fit in deinem Konto und du musst deine Hand nie wieder messen:\n{url}\n\nDer Link funktioniert 24 Stunden. Du hast das nicht angefordert? Dann ignoriere diese E-Mail einfach; wir schicken dir sonst nichts.',
    'confirm.subject': 'Bestätige deine E-Mail und behalte dein DartFit-Konto',
    'confirm.body':
      'Deine Dart-Benachrichtigungen sind an. Tippe auf diesen Link, um deine E-Mail-Adresse zu bestätigen und dein Konto zu behalten, dann musst du deine Hand nicht noch einmal messen:\n{url}\n\nDer Link funktioniert 24 Stunden. Du hast das nicht angefordert? Ignoriere diese E-Mail, oder melde dich über den Link in jeder Benachrichtigung ab.',
    'alert.subject': 'Ein Dart, der noch besser zu dir passt: {name}',
    'alert.body':
      'Neu in unserer Datenbank: {name}. Er passt besser zu deiner Hand als dein bisher bester Treffer (Passform: {quality}).\n\nSieh ihn dir neben deinen anderen Optionen an:\n{url}',
    'feedback.subject': 'Welchen Dart hast du genommen?',
    'feedback.body':
      'Vor zwei Wochen hast du dir bei DartFit Darts angesehen. Hast du einen gekauft, und wie fühlt sich das Gewicht an? Zwei Klicks, und die Fits werden für alle besser:\n{url}',
    'quality.excellent': 'hervorragend',
    'quality.good': 'gut',
    'quality.fair': 'ordentlich',
    'quality.poor': 'mäßig',
    'unsub.done': 'Du bist abgemeldet. Du bekommst diese E-Mails nicht mehr.',
  },
};

export function t(lang: Lang, key: string, vars: Record<string, string | number> = {}): string {
  const s = strings[lang]?.[key] ?? strings.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
