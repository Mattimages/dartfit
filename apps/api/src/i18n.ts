export type Lang = 'nl' | 'en';

const strings: Record<Lang, Record<string, string>> = {
  nl: {
    'login.subject': 'Je inloglink voor DartFit',
    'login.body':
      'Klik binnen 20 minuten op deze link om in te loggen en je fit te bewaren:\n{url}\n\nHeb je dit niet aangevraagd? Dan kun je deze mail negeren.',
    'alert.subject': 'Nieuwe dart die bij je past: {name}',
    'alert.body':
      'Er is een nieuwe dart die {quality} bij je opgeslagen fit past: {name}.\n\nBekijk hem naast je huidige top 3:\n{url}',
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
    'alert.subject': 'A new dart that fits you: {name}',
    'alert.body':
      'A new dart is a {quality} match for your saved fit: {name}.\n\nSee it next to your current top 3:\n{url}',
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
