export const PAGES = [
  { slug: 'about', title: 'About LWEL Music Hub' },
  { slug: 'terms', title: 'Terms of use' },
  { slug: 'privacy', title: 'Privacy notice' },
  { slug: 'copyright', title: 'Copyright and takedown' },
  { slug: 'contributor-agreement', title: 'Contributor agreement' },
  { slug: 'contact', title: 'Contact' }
]

const DRAFT = 'Draft text. LWEL should read this page, adjust it to how the service really works, and have it reviewed by a qualified lawyer before removing this line.'
const EMAIL = 'lwelmusic2@gmail.com'
const WA = 'https://wa.me/256779390155'
const J = (a) => a.join('\n\n')

export const DEFAULTS = {
  home_headline: 'Let the world hear your song.',
  home_intro: 'A home for SDA music: choirs, singing groups and solo artists. Listen, download and share, no account needed.',
  announcement: '',

  page_about: J([
    'LWEL Music Hub is a home for SDA music. It gives choirs, singing groups and solo artists a trusted place to publish their music, and lets anyone with an internet connection listen to it, download it and share it.',
    '## Our vision',
    'One Faith. One Voice. One Music Family.',
    '## For listeners',
    'You do not need an account. Browse, search, play, download and share songs for free.',
    '## For artists, choirs and groups',
    'Register, create your profile and upload your songs. Your songs are published as soon as you upload them. LWEL may remove any song that breaks the rules or the rights of others, so please read the Contributor agreement and the Copyright page.',
    '## Who runs it',
    'LWEL Music Hub is owned and operated by LWEL. You can reach us on the Contact page.'
  ]),

  page_terms: J([
    DRAFT,
    '## 1. About these terms',
    'These terms apply to everyone who uses LWEL Music Hub, whether you only listen or you also have an artist account. By using the site you agree to them.',
    '## 2. Listening and downloading',
    'You may listen to and download published songs for your own personal, non-commercial use, for example for worship, practice and enjoyment. You may share links to songs. You may not sell songs, upload them elsewhere as your own, use them commercially, or copy large parts of the site with automated tools without our written permission. The songs belong to their artists and owners.',
    '## 3. Artist accounts',
    '• Give true information when you register.\n• Keep your password private. You are responsible for what happens on your account.\n• A choir or group should be registered by someone authorised to speak for it.\n• To close your account, contact LWEL. Accounts cannot be deleted by the user.',
    '## 4. What you may publish',
    'You may only publish music that you own or have permission to share. Songs must be suitable for a Christian music community. Do not upload anything hateful, violent, sexually explicit, misleading or illegal. See the Contributor agreement and the Copyright page.',
    '## 5. Publishing and removal',
    'Songs are published as soon as they are uploaded. LWEL may unpublish or remove any song, edit its details, or suspend or close any account at any time, for example when we receive a copyright complaint or when the rules are broken. You may remove your own songs at any time from your dashboard.',
    '## 6. The service',
    'The service is free and is provided as it is. We try to keep it running and safe, but we cannot promise it will always be available or free of errors, and we may change or stop parts of it. To the extent allowed by law, LWEL is not responsible for losses that come from using the site.',
    '## 7. Changes',
    'We may update these terms. If you keep using the site after a change, you accept the new version.',
    '## 8. Contact',
    'Questions about these terms: ' + EMAIL
  ]),

  page_privacy: J([
    DRAFT,
    '## What we collect',
    '• Artist accounts: your name, email address, WhatsApp or phone number (visible only to LWEL, never public), password (stored in protected form, we cannot read it), profile type, and anything you choose to add such as your photo, biography and location.\n• Your songs: the audio files, cover pictures, titles, descriptions and credits you upload.\n• Copyright reports: the name, email address and details given by the person reporting.\n• Visitors: we count views, plays and downloads of each song. These counts do not identify you.\n• Spam protection: when you register or sign in, a check run by Cloudflare confirms that you are a person.',
    '## What is public',
    'Your artist name, profile type, photo, biography, location and your published songs are visible to everyone. Your email address is never shown publicly.',
    '## How we use your information',
    'To run the site, show your profile and songs, keep the platform safe, answer questions and copyright reports, and contact you about your account. We do not sell your personal information and we do not show advertising.',
    '## Who helps us run the site',
    'We use service providers to host the website, store data and files, and protect against spam and abuse (Vercel, Supabase and Cloudflare). We also use a notification service to alert LWEL when a song or report arrives. These providers may process data on servers outside Uganda.',
    '## Cookies and browser storage',
    'We do not use advertising or tracking cookies. Your browser stores a sign-in session so that you stay signed in, and a short note of which songs you have already viewed or played in that visit.',
    '## How long we keep it',
    'We keep your account and songs while your account is open. LWEL keeps backup copies of site data that may hold information for some time after it is deleted from the live site.',
    '## Your choices',
    'You can edit your profile and remove your songs at any time. To ask for a copy of your information, to correct it, or to close your account and have your information deleted, contact us. We will respond as soon as reasonably possible.',
    '## Children',
    'If you are under 18, please ask a parent or guardian before registering.',
    '## Contact',
    EMAIL
  ]),

  page_copyright: J([
    DRAFT,
    '## Respecting the rights of others',
    'Songs may only be uploaded by people who own them or have permission to share them. That includes the recording, the music, the lyrics, the arrangement and the artwork. A hymn being familiar or used in church does not mean every arrangement, translation or recording is free to share.',
    '## How to report a concern',
    'If you believe a song on LWEL Music Hub uses your work without permission, use the Report a copyright concern button at the bottom of the song page, or contact us:',
    'Email: ' + EMAIL + '\n\nWhatsApp: ' + WA,
    'Please tell us:\n• which song it is (the link to its page)\n• what work is yours, and how you own it or are allowed to manage it\n• how we can contact you\n• that you believe in good faith that the song is being used without permission',
    '## What we do',
    'LWEL reviews every report as quickly as it can. While we check, we may unpublish the song. We may ask the artist to explain or to show their permission. If the song should not be on the site, we remove it. If the report was mistaken, we restore it.',
    '## Repeated problems',
    'Accounts that repeatedly publish music they have no right to share may be suspended or closed.',
    '## If your song was reported',
    'You can reply to LWEL with proof that you own the song or have permission to use it, and we will consider it.'
  ]),

  page_contributor: J([
    DRAFT,
    '## Your declaration',
    'When you upload a song you confirm that you own it, or have permission to upload and distribute it, including the recording, the music, the lyrics, the arrangement and the artwork. If other people performed, wrote or arranged the song, they are happy for it to be shared here.',
    '## What you allow LWEL to do',
    'You allow LWEL Music Hub to host your song, play it on the site, offer it for free download, show your name, photo, cover picture and credits, and share links and previews of it, for as long as it is published here. This permission is not exclusive, which means you can still share your music anywhere else.',
    '## You keep your rights',
    'You keep ownership of your music. LWEL does not pay royalties, and does not charge you for publishing.',
    '## Free downloads',
    'Listeners can download your song for personal use. If you remove a song later, copies that people have already downloaded cannot be taken back.',
    '## Rules',
    '• Upload only your own or properly permitted music.\n• Give honest titles and credits.\n• No hateful, violent, sexually explicit, misleading or illegal content.\n• Songs go live immediately, so check them before you upload.',
    '## Removal and accounts',
    'You can remove your songs at any time from your dashboard. LWEL may unpublish or remove any song, or suspend an account, if these rules or the Terms are broken or if someone makes a rights claim. To close your account, contact LWEL.',
    '## Responsibility',
    'You are responsible for what you upload. If a song causes a claim, LWEL may remove it straight away.'
  ]),

  page_contact: J([
    '## Get in touch',
    'For help with your account, questions about the site, copyright concerns, or requests about your personal information, contact LWEL:',
    'Email: ' + EMAIL + '\n\nWhatsApp: ' + WA,
    'We reply as soon as we can.',
    '## What to include',
    '• For copyright concerns: the link to the song and an explanation (see the Copyright page).\n• For account help: your artist name and the email you registered with. Never send your password.\n• To close your account or remove your information: say so and we will help.'
  ])
}
