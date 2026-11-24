import type { CommonTranslation } from '../fr/common';
import sections from './sections';

const en: CommonTranslation = {
  ...sections,
  meta: {
    siteName: 'PAUL — Official',
    defaultTitle: 'PAUL — Boxer, Paul Gym & Sports Commentator',
    defaultDescription:
      'Official website of PAUL: boxer, owner of Paul Gym and sports commentator. Fights, training, gym, booking and partnerships.',
  },
  a11y: {
    skipToContent: 'Skip to content',
    mainNav: 'Main navigation',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    languageSwitcher: 'Choose language',
    currentLanguage: 'Current language: {{lang}}',
    switchTo: 'Switch to {{lang}}',
    home: 'PAUL — home',
    legalNav: 'Legal information',
    social: 'Social networks',
  },
  languages: {
    fr: 'Français',
    en: 'English',
  },
  nav: {
    home: 'Home',
    champion: 'Champion',
    fights: 'Fights',
    performance: 'Performance',
    gym: 'Paul Gym',
    commentator: 'Commentator',
    news: 'News',
    media: 'Media',
    sponsors: 'Sponsors',
    contact: 'Contact',
    legal: 'Legal notice',
    privacy: 'Privacy',
    cookies: 'Cookies',
    menu: 'Menu',
    close: 'Close',
  },
  roles: {
    boxer: 'Boxer',
    gymOwner: 'Gym owner',
    commentator: 'Sports commentator',
  },
  cta: {
    becomePartner: 'Become a partner',
    bookCommentator: 'Book Paul',
    joinGym: 'Join the gym',
    discover: 'Discover',
    backHome: 'Back to home',
  },
  pages: {
    champion: { title: 'Champion', intro: 'Biography, journey, philosophy and record.' },
    fights: { title: 'Fights', intro: 'Career statistics and fight records.' },
    performance: { title: 'Performance', intro: 'Preparation, strength, endurance, technique, discipline.' },
    gym: { title: 'Paul Gym', intro: 'The gym: disciplines, classes, coaches, schedules and memberships.' },
    commentator: { title: 'Commentator', intro: 'Experience, events, highlights and booking.' },
    news: { title: 'News', intro: 'The official magazine.' },
    media: { title: 'Media', intro: 'Official photos and videos.' },
    sponsors: {
      title: 'Associate your brand with greatness.',
      intro: 'Let’s build partnerships that bring visibility, impact and new perspectives to sport.',
    },
    contact: { title: 'Contact', intro: 'Professionals, media, booking, sponsorship, gym.' },
    legal: { title: 'Legal notice', intro: 'Legal information about this website.' },
    privacy: { title: 'Privacy', intro: 'Privacy policy and personal data.' },
    cookies: { title: 'Cookies', intro: 'Use of cookies and trackers.' },
  },
  status: {
    inProgress: 'Content in preparation',
    inProgressBody: 'This section is under construction. Content will be published soon.',
  },
  home: {
    eyebrow: 'Official Boxing & Sports Experience',
    tagline: 'Discipline. Power. Intensity.',
    activities: 'Three activities',
    activitiesTitle: 'One man.\nThree rings.',
    manifestoLabel: 'Manifesto',
    manifesto:
      'Three rings. One standard: discipline. Round after round, in the ring, in the gym and behind the mic, until the final bell.',
  },
  hero: {
    srTitle: 'PAUL — Boxer, gym owner and sports commentator',
    scroll: 'Scroll',
    scrollHint: 'Scroll down to the content',
  },
  preloader: {
    loading: 'Loading',
    round: 'Round 01',
    skip: 'Skip intro',
  },
  cursor: {
    play: 'Play',
  },
  media: {
    placeholder: 'Official media coming soon',
    placeholderAlt: 'Placeholder reserved for an official photo of Paul',
  },
  notFound: {
    code: '404',
    title: 'Out of the ring.',
    body: 'This page does not exist or has been moved.',
  },
  error: {
    title: 'Something broke.',
    body: 'An unexpected error occurred. Reload the page or come back later.',
    reload: 'Reload',
  },
  legalZone: {
    copyright: '© {{year}} PAUL. All rights reserved.',
  },
};

export default en;
