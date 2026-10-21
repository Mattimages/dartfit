import { h } from '../h';
import { getLang } from '../i18n';

/** Plain-language privacy notice. The final text needs review by a Dutch privacy lawyer before launch. */
const COPY = {
  nl: {
    title: 'Privacy',
    draft: 'Concepttekst: wordt voor de lancering juridisch gecontroleerd.',
    blocks: [
      [
        'Wat blijft op je telefoon',
        'Het camerabeeld. Handherkenning draait in je browser; er gaat nooit een foto of video naar ons of naar iemand anders.',
      ],
      [
        'Wat we bewaren',
        'Je handmaten in millimeters en je antwoorden, om je fit te berekenen. Zonder account is je fit alleen bereikbaar via de unieke link. Met een account: je e-mailadres, je bewaarde fits, je toestemmingen (met datum en de tekst die je zag) en op welke winkellinks je klikte.',
      ],
      [
        'Waarom',
        'Om je fit te berekenen en te tonen (uitvoering van wat je vraagt). Nieuwe-dartmails en de feedbackvraag alleen met je aparte toestemming, die je met één klik intrekt.',
      ],
      [
        'Wie het verwerkt',
        'Onze hosting en database in de EU, onze e-mailprovider, en Anthropic voor de uitleg-tekst. Die krijgt alleen de cijfers van je fit, nooit je e-mail of beelden.',
      ],
      [
        'Hoe lang',
        'Fits zonder account: 90 dagen. Accounts die 24 maanden niet gebruikt zijn: verwijderd. Je kunt alles zelf downloaden of verwijderen onder Mijn fits.',
      ],
      [
        'Cookies',
        'Alleen een inlogcookie als je een account gebruikt. Geen advertentie- of trackingcookies.',
      ],
      ['Leeftijd', 'Accounts en mails vanaf 16 jaar. Een fit maken kan zonder account.'],
      [
        'Winkellinks',
        'Koop je via een link, dan kan DartFit een commissie krijgen. Dat telt nooit mee in de ranglijst.',
      ],
    ],
  },
  en: {
    title: 'Privacy',
    draft: 'Draft text: to be reviewed by a lawyer before launch.',
    blocks: [
      [
        'What stays on your phone',
        'The camera image. Hand recognition runs in your browser; no photo or video is ever sent to us or anyone else.',
      ],
      [
        'What we keep',
        'Your hand measurements in millimetres and your answers, to work out your fit. Without an account, your fit is reachable only through its unique link. With an account: your email, your saved fits, your consents (with the date and the wording you saw) and which shop links you clicked.',
      ],
      [
        'Why',
        'To work out and show your fit (doing what you asked). New-dart emails and the feedback question only with your separate consent, which you can withdraw in one click.',
      ],
      [
        'Who processes it',
        'Our hosting and database in the EU, our email provider, and Anthropic for the explanation text. It receives only the numbers of your fit, never your email or images.',
      ],
      [
        'How long',
        'Fits without an account: 90 days. Accounts unused for 24 months: deleted. You can download or delete everything yourself under My fits.',
      ],
      ['Cookies', 'Only a sign-in cookie if you use an account. No advertising or tracking cookies.'],
      ['Age', 'Accounts and emails from 16. Making a fit needs no account.'],
      [
        'Shop links',
        'If you buy through a link, DartFit may earn a commission. It never counts in the ranking.',
      ],
    ],
  },
} as const;

export function privacyView(root: HTMLElement) {
  const c = COPY[getLang() === 'nl' ? 'nl' : 'en'];
  root.append(
    h(
      'section',
      { class: 'stack' },
      h('h1', null, c.title),
      h('p', { class: 'small' }, c.draft),
      ...c.blocks.flatMap(([title, body]) => [h('h3', null, title), h('p', null, body)]),
    ),
  );
}
