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
        'Anonieme maten',
        'Van elke fit bewaren we los een anonieme regel: je handmaten in hele millimeters, lengte, je antwoorden over hoe je gooit, land, maand en de uitgerekende ideale dart. Zonder account, zonder link naar je fit, zonder tijdstip en zonder beeld. Zo maken we de meting en het advies beter.',
      ],
      [
        'Cookies',
        'Alleen een inlogcookie als je een account gebruikt. Geen advertentie- of trackingcookies.',
      ],
      [
        'Bezoekersstatistieken',
        'We tellen paginabezoeken met Vercel Web Analytics: zonder cookies, zonder je IP-adres op te slaan en alleen als totalen. Van je fit sturen we alleen het type pagina mee, nooit je maten of je fit-nummer.',
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
      [
        'Anonymous measurements',
        'From every fit we also keep one anonymous line: your hand sizes in whole millimetres, height, your answers about how you throw, country, month and the calculated ideal dart. No account, no link to your fit, no time of day and no image. It helps us make the measuring and the advice better.',
      ],
      ['Cookies', 'Only a sign-in cookie if you use an account. No advertising or tracking cookies.'],
      [
        'Visitor statistics',
        'We count page views with Vercel Web Analytics: no cookies, no stored IP address, only totals. For your fit we send only the kind of page, never your measurements or your fit number.',
      ],
      ['Age', 'Accounts and emails from 16. Making a fit needs no account.'],
      [
        'Shop links',
        'If you buy through a link, DartFit may earn a commission. It never counts in the ranking.',
      ],
    ],
  },
  de: {
    title: 'Datenschutz',
    draft: 'Entwurf: Der Text wird vor dem Start juristisch geprüft.',
    blocks: [
      [
        'Was auf deinem Handy bleibt',
        'Das Kamerabild. Die Handerkennung läuft in deinem Browser; kein Foto und kein Video wird jemals an uns oder an andere geschickt.',
      ],
      [
        'Was wir speichern',
        'Deine Handmaße in Millimetern und deine Antworten, um deinen Fit zu berechnen. Ohne Konto ist dein Fit nur über seinen eigenen Link erreichbar. Mit Konto: deine E-Mail-Adresse, deine gespeicherten Fits, deine Einwilligungen (mit Datum und dem Wortlaut, den du gesehen hast) und welche Shop-Links du angeklickt hast.',
      ],
      [
        'Warum',
        'Um deinen Fit zu berechnen und zu zeigen (das, worum du gebeten hast). E-Mails zu neuen Darts und die Feedbackfrage nur mit deiner gesonderten Einwilligung, die du mit einem Klick widerrufen kannst.',
      ],
      [
        'Wer die Daten verarbeitet',
        'Unser Hosting und unsere Datenbank in der EU, unser E-Mail-Anbieter und Anthropic für den Erklärtext. Anthropic bekommt nur die Zahlen deines Fits, nie deine E-Mail-Adresse oder Bilder.',
      ],
      [
        'Wie lange',
        'Fits ohne Konto: 90 Tage. Konten, die 24 Monate nicht genutzt wurden: gelöscht. Unter Meine Fits kannst du alles selbst herunterladen oder löschen.',
      ],
      [
        'Anonyme Messungen',
        'Von jedem Fit behalten wir außerdem eine anonyme Zeile: deine Handmaße in ganzen Millimetern, deine Größe, deine Antworten zu deinem Wurf, Land, Monat und den berechneten idealen Dart. Kein Konto, keine Verbindung zu deinem Fit, keine Uhrzeit und kein Bild. Das hilft uns, das Messen und die Empfehlungen zu verbessern.',
      ],
      ['Cookies', 'Nur ein Anmelde-Cookie, wenn du ein Konto nutzt. Keine Werbe- oder Tracking-Cookies.'],
      [
        'Besucherstatistik',
        'Wir zählen Seitenaufrufe mit Vercel Web Analytics: ohne Cookies, ohne gespeicherte IP-Adresse, nur Summen. Für deinen Fit schicken wir nur die Art der Seite, nie deine Maße oder die Nummer deines Fits.',
      ],
      ['Alter', 'Konten und E-Mails ab 16. Für einen Fit brauchst du kein Konto.'],
      [
        'Shop-Links',
        'Wenn du über einen Link kaufst, kann DartFit eine Provision bekommen. Sie zählt nie für die Reihenfolge.',
      ],
    ],
  },
} as const;

export function privacyView(root: HTMLElement) {
  const c = COPY[getLang()];
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
