import type { HomeContent, LegalPageContent } from './public-site';

/**
 * Contenu initial de la vitrine. Les textes entre crochets sont à remplacer
 * par le comité de la famille : aucun fait n'a été inventé.
 * Sert au peuplement de la base et de secours si l'API est indisponible.
 */
export const defaultHomeContent: HomeContent = {
  familyName: 'Famille Wodie',
  tagline: "Nouvelles, souvenirs et histoire d'une famille, d'ici et d'ailleurs",
  hero: {
    kicker: 'Bienvenue',
    title: 'La famille Wodie, une histoire qui se transmet',
    intro:
      "Près de 700 membres, [N] générations, présents dans [N] pays. D'où que nous venions et où que nous vivions, ce site est notre maison commune.",
    imagePlaceholder:
      '[Grande photo de famille, réunion [année], publiée avec l’accord des personnes présentes]',
    caption: 'Réunion de famille, [lieu], [année].',
  },
  stats: [
    { value: '≈ 700', label: 'membres' },
    { value: '[N]', label: 'générations' },
    { value: '[N]', label: 'pays' },
    { value: '[Année]', label: 'première trace connue' },
  ],
  history: {
    kicker: 'Notre histoire',
    title: "De [village ou région d'origine] au reste du monde",
    paragraphs: [
      "Tout commence avec [ancêtre fondateur], à [lieu], vers [année]. [Deux ou trois phrases sur les origines de la famille, son nom, ses premiers métiers et ce que la tradition orale en a retenu.]",
      "[Un paragraphe sur les grandes étapes : départs, installations, alliances, la manière dont les branches se sont formées et ce qui relie aujourd'hui les cousins de [pays] et de [pays].]",
    ],
    quote: '[Devise, proverbe ou parole d’un aîné qui résume l’esprit de la famille.]',
    timeline: [
      { year: '[18XX]', text: '[Première trace de la famille à [lieu]]' },
      { year: '[19XX]', text: '[Mariage de [fondateurs], naissance des grandes branches]' },
      { year: '[19XX]', text: '[Premiers départs vers [pays]]' },
      { year: '[20XX]', text: '[Première grande réunion de toute la famille]' },
      { year: '2026', text: 'Ouverture du site de la famille' },
    ],
  },
  roots: {
    kicker: 'Nos racines',
    title: 'Une seule famille, plusieurs continents',
    text: "Nos racines sont à [lieu d'origine]. Aujourd'hui, la famille vit notamment en [pays], [pays], [pays] et [pays].",
    note: "Aucune adresse ni information personnelle n'est publiée sur ce site.",
    mapPlaceholder:
      "[Carte : de [lieu d'origine] vers les pays où vit la famille, au niveau des pays, jamais d'adresse]",
  },
  together: {
    kicker: 'Ce qui nous rassemble',
    title: "Se retrouver, s'entraider, se souvenir",
    items: [
      {
        title: 'Les réunions',
        text: '[Fréquence et forme des grandes réunions, des fêtes et des cérémonies qui rassemblent la famille.]',
      },
      {
        title: "L'entraide",
        text: '[Comment la famille se soutient : solidarité lors des naissances, des deuils, des études, des projets.]',
      },
      {
        title: 'La mémoire',
        text: "L'arbre généalogique, les photos anciennes et les archives, rassemblés et conservés pour les générations à venir.",
      },
    ],
  },
  nextEvent: {
    kicker: 'Prochain grand rendez-vous',
    title: 'Grande réunion de famille · [date] · [ville]',
    text: "Programme, inscriptions et informations pratiques dans l'espace famille.",
  },
  join: {
    kicker: 'Vous êtes de la famille ?',
    title: "Rejoignez l'espace famille",
    text: "La gazette, le carnet, l'agenda, les archives et l'arbre complet sont réservés aux membres. Indiquez-nous à qui vous êtes rattaché : un référent de votre branche validera votre demande.",
  },
};

export const defaultLegalNotice: LegalPageContent = {
  title: 'Mentions légales',
  sections: [
    {
      heading: 'Éditeur du site',
      body: ['[Nom de l’association ou du comité familial], [adresse], représenté par [nom du responsable].'],
    },
    {
      heading: 'Hébergement',
      body: ['[Nom et adresse de l’hébergeur].'],
    },
    {
      heading: 'Contact',
      body: ['Pour toute question, utilisez la page « Nous écrire ».'],
    },
  ],
};

export const defaultPrivacyPolicy: LegalPageContent = {
  title: 'Politique de confidentialité',
  sections: [
    {
      heading: 'Ce que montre la partie publique',
      body: [
        "Les pages publiques présentent l'histoire de la famille. Elles ne publient ni adresse, ni coordonnées, ni information sur des enfants, ni date ou lieu précis concernant une personne vivante.",
      ],
    },
    {
      heading: 'Données des formulaires',
      body: [
        "Les demandes d'adhésion et les messages de contact sont lus uniquement par le comité et les référents de branche. Ils servent à traiter votre demande et ne sont jamais transmis à des tiers.",
        "Une demande d'adhésion refusée ou un message traité est supprimé au bout de [12] mois au plus (durée à valider par le comité).",
      ],
    },
    {
      heading: 'Vos droits',
      body: [
        "Vous pouvez demander l'accès, la rectification ou la suppression de vos données, ainsi que le retrait d'une photo sur laquelle vous apparaissez, via la page « Nous écrire ».",
      ],
    },
    {
      heading: 'Cookies',
      body: ['La partie publique du site n’utilise aucun cookie publicitaire ni de suivi.'],
    },
  ],
};
