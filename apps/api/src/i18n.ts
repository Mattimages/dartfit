export type Lang = 'nl' | 'en';

const strings: Record<Lang, Record<string, string>> = {
  nl: {
    'login.subject': 'Je inloglink voor DartFit',
    'login.body':
      'Klik binnen 20 minuten op deze link om in te loggen en je fit te bewaren:\n{url}\n\nHeb je dit niet aangevraagd? Dan kun je deze mail negeren.',
    'confirm.subject': 'Bevestig je dart-alert',
    'confirm.body':
      'Tik binnen 20 minuten op deze link. Daarna mailen we je zodra er een dart binnenkomt die nog beter bij je hand past:\n{url}\n\nHeb je dit niet aangevraagd? Dan kun je deze mail negeren.',
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
    'confirm.subject': 'Confirm your dart alert',
    'confirm.body':
      'Use this link within 20 minutes. After that we’ll email you when a dart arrives that fits your hand even better:\n{url}\n\nDidn’t ask for this? You can ignore this email.',
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
};

export function t(lang: Lang, key: string, vars: Record<string, string | number> = {}): string {
  const s = strings[lang]?.[key] ?? strings.en[key] ?? key;
  return s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
