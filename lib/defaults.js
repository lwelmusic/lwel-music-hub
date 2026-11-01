export const PAGES = [
  { slug: 'about', title: 'About LWEL Music Hub' },
  { slug: 'terms', title: 'Terms of use' },
  { slug: 'privacy', title: 'Privacy notice' },
  { slug: 'copyright', title: 'Copyright and takedown' },
  { slug: 'contributor-agreement', title: 'Contributor agreement' },
  { slug: 'contact', title: 'Contact' }
]

const DRAFT = 'Draft text. LWEL should edit this page and have it reviewed by a qualified lawyer before public launch.'

export const DEFAULTS = {
  home_headline: 'Let the world hear your song.',
  home_intro: 'A home for SDA music: choirs, singing groups and solo artists. Listen, download and share, no account needed.',
  announcement: '',
  page_about: [
    'LWEL Music Hub is a home for SDA music. It gives choirs, singing groups and solo artists a trusted place to publish their music, and lets anyone listen, download and share approved songs.',
    '## Our vision',
    'One Faith. One Voice. One Music Family.',
    '## How it works',
    'Artists register and upload songs. LWEL reviews each song before it is published. Visitors can listen and download without an account.'
  ].join('\n\n'),
  page_terms: [
    DRAFT,
    '## Using the site',
    'Visitors may listen to and download published songs for personal, non-commercial use. Songs remain the property of their owners. You may not sell, re-upload or misuse them.',
    '## Artist accounts',
    'Artists are responsible for their account, their uploads and the accuracy of what they publish. LWEL may refuse, remove or unpublish any song, and may suspend any account, to protect the community and the rights of others.',
    '## Changes',
    'LWEL may update these terms. Continued use of the site means you accept the current version.'
  ].join('\n\n'),
  page_privacy: [
    DRAFT,
    '## What we collect',
    'For artist accounts we store your name, email address, profile details and the songs you upload. For all visitors we count views, plays and downloads of songs. These counts do not identify you.',
    '## How we use it',
    'We use your information to run the site, review uploads, show your public profile and contact you about your account. We do not sell your personal information.',
    '## Your choices',
    'You can edit your profile at any time. To ask about or delete your information, contact LWEL using the details on the Contact page.'
  ].join('\n\n'),
  page_copyright: [
    DRAFT,
    '## Respecting rights',
    'Songs may only be uploaded by people who own them or have permission to share the recording, music, lyrics, arrangement and artwork. A hymn being familiar or used in church does not mean every arrangement or recording is free to share.',
    '## Reporting a concern',
    'If you believe a song infringes your rights, use the Report a copyright concern button on the song page, or contact LWEL. Please explain what is yours and why you believe it is being used without permission.',
    '## What we do',
    'LWEL reviews every report promptly and may unpublish the song while it is checked. Repeated infringement can lead to account suspension.'
  ].join('\n\n'),
  page_contributor: [
    DRAFT,
    '## Your declaration',
    'When you upload a song you confirm that you own it or have permission to upload and distribute it, including the recording, composition, lyrics, arrangement and artwork.',
    '## Permission to publish',
    'You allow LWEL Music Hub to host, stream and make the song available for free download, and to remove it at any time. You keep ownership of your work.',
    '## Review',
    'Every upload is reviewed before it is published. LWEL may return a song with a reason, or decline to publish it.'
  ].join('\n\n'),
  page_contact: [
    DRAFT,
    '## Get in touch',
    'For help, questions about your account, or copyright concerns, contact LWEL at [add the official LWEL support email here].'
  ].join('\n\n')
}
