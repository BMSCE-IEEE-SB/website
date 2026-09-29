import { Cpu, Zap, CircuitBoard, Users, Compass, type LucideIcon } from 'lucide-react';

const u = (id: string, w = 900, h = 600) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format&q=70`;

export const BRANCH = {
  name: 'BMSCE IEEE Student Branch',
  shortName: 'BMSCE IEEE',
  college: 'B.M.S. College of Engineering',
  region: 'IEEE Region 10',
  section: 'Bangalore Section',
  established: '2009',
};

export const contactInfo = {
  address: 'Bull Temple Road, Basavanagudi, Bengaluru 560019',
  email: 'ieee.sb@bmsce.ac.in',
  phone: '+91 7204524602',
};

export const navItems = [
  { label: 'About', href: '/#about', id: 'about' },
  { label: 'Chapters', href: '/#chapters', id: 'chapters' },
  { label: 'Team', href: '/#team', id: 'team' },
  { label: 'Contact', href: '/#contact', id: 'contact' },
];

export const metrics = [
  { value: '16+', label: 'Years of technical legacy' },
  { value: '1,000+', label: 'Active members' },
  { value: '5', label: 'Technical chapters & affinity groups' },
];

export type Chapter = {
  slug: string;
  /** Compact name for tight layouts. */
  short: string;
  code: string;
  /** Accent colour used for dynamic styling (hex). */
  color: string;
  /** Chapter mark, when a local logo asset is available. */
  logo?: string;
  image: string;
  about: string[];
  focus: { title: string; text: string }[];
  activities: string[];
  stats: { members: string; events: string; founded: string };
  name: string;
  fullName: string;
  title?: string;
  tagline: string;
  description: string;
  tracks: string[];
  icon: LucideIcon;
  /** Tailwind classes for the accent colour (text + soft background). */
  tone: { text: string; soft: string; bar: string };
  aboutTitle?: string;
  aboutUs?: string[];
  whatWeDo?: string[];
  pastEvents?: string[];
  flagshipEvents?: { title: string; description?: string }[];
  otherInitiatives?: string[];
  majorEvents?: string[];
  futureEvents?: { title: string; description?: string }[];
  futureEventsTitle?: string;
  comingSoon?: boolean;
};

export const chapters: Chapter[] = [
  {
    slug: 'cs',
    short: 'Computer Society (CS)',
    code: 'CS',
    logo: '/chapter-logos/cs.png',
    color: '#0284c7',
    image: u('photo-1517694712202-14dd9538aa97', 1400, 900),
    about: [],
    focus: [],
    activities: [],
    stats: { members: '', events: '', founded: '' },
    name: 'Computer Society (CS)',
    fullName: 'IEEE Computer Society',
    tagline: 'Software, algorithms & AI systems',
    description:
      'Focusing on software architectures, algorithms, AI systems, web & cloud, and the 24-hour IEEEXtreme programming competition on campus.',
    tracks: ['AI/ML', 'Web & Cloud', 'Systems'],
    icon: Cpu,
    tone: { text: 'text-sky-600', soft: 'bg-sky-50', bar: 'bg-sky-500' },
    comingSoon: true,
  },
  {
    slug: 'pes-sc',
    short: 'Power & Energy Society & Sensors Council (PES & SC)',
    code: 'PES & SC',
    logo: '/chapter-logos/pes.png',
    color: '#059669',
    image: u('photo-1509391366360-2e959784a276', 1400, 900),
    about: [
      'BMSCE IEEE PES & Sensors Council focuses on advancements in Electrical Power & Energy, Electronics, Robotics, and Sensors.',
      'We aim to bridge the gap between academic concepts and real-world applications through hands-on projects, technical workshops, industry interactions, research opportunities, and mentorship.',
    ],
    aboutTitle: 'About the Chapter',
    aboutUs: [
      'BMSCE IEEE PES & Sensors Council focuses on advancements in Electrical Power & Energy, Electronics, Robotics, and Sensors. We aim to bridge the gap between academic concepts and real-world applications through hands-on projects, technical workshops, industry interactions, research opportunities, and mentorship.',
    ],
    focus: [],
    activities: [
      'Sensors Enclave – 24-hour hardware hackathon focused on solving real-world problems with industry guidance.',
      'Sensors Week – A week-long series of technical workshops, expert talks, and hardware challenges.',
      'PES Day – Annual celebration featuring technical, collaborative, and awareness-driven activities.',
      'Industry Academia Conclave – A platform connecting students with industry leaders, entrepreneurs, professors, and IEEE professionals.',
      'National-Level Conference on Standards, Codes & Regulations in Lighting.',
    ],
    flagshipEvents: [
      {
        title: 'Sensors Enclave',
        description: '24-hour hardware hackathon focused on solving real-world problems with industry guidance.',
      },
      {
        title: 'Sensors Week',
        description: 'A week-long series of technical workshops, expert talks, and hardware challenges.',
      },
      {
        title: 'PES Day',
        description: 'Annual celebration featuring technical, collaborative, and awareness-driven activities.',
      },
      {
        title: 'Industry Academia Conclave',
        description: 'A platform connecting students with industry leaders, entrepreneurs, professors, and IEEE professionals.',
      },
      {
        title: 'National-Level Conference on Standards, Codes & Regulations in Lighting',
      },
    ],
    otherInitiatives: [
      'Campus to Corporate – Industry-oriented value-added course focused on placement readiness and professional skills.',
      'Embedded Systems & Analog Design Workshops',
      'Technical sessions, hands-on projects, and industry interactions.',
    ],
    futureEventsTitle: 'Upcoming Events',
    futureEvents: [
      {
        title: 'Upcoming Academic Year',
        description: 'More technical workshops, hackathons, industry interactions, and hands-on learning opportunities are lined up for the upcoming academic year.',
      },
    ],
    stats: { members: '350+', events: '20+', founded: '2014' },
    name: 'Power & Energy Society & Sensors Council (PES & SC)',
    fullName: 'IEEE Power & Energy Society & Sensors Council (PES & SC)',
    title: 'BMSCE IEEE PES & Sensors Council',
    tagline: 'Electrical Power & Energy, Electronics, Robotics & Sensors',
    description:
      'Bridging the gap between academic concepts and real-world applications through hands-on projects, technical workshops, industry interactions, research opportunities, and mentorship.',
    tracks: ['Power & Energy', 'Robotics & Sensors', 'Electronics'],
    icon: Zap,
    tone: { text: 'text-emerald-600', soft: 'bg-emerald-50', bar: 'bg-emerald-500' },
  },
  {
    slug: 'pels-ies',
    short: 'Power Electronics Society and the Industrial Electronics Society (PELS & IES)',
    code: 'PELS/IES',
    logo: '/chapter-logos/pels-ies.png',
    color: '#d97706',
    image: u('photo-1518770660439-4636190af475', 1400, 900),
    about: [
      'BMSCE IEEE PELS & IES is the student chapter of the IEEE Power Electronics Society and IEEE Industrial Electronics Society, focused on creating opportunities for students to explore power electronics, industrial electronics, VLSI, embedded systems, robotics and emerging technologies.',
      'Through technical workshops, competitions, industry interactions, projects and research-oriented initiatives, the chapters encourage students to learn, innovate and apply engineering beyond the classroom.',
    ],
    aboutUs: [
      'BMSCE IEEE PELS & IES is the student chapter of the IEEE Power Electronics Society and IEEE Industrial Electronics Society, focused on creating opportunities for students to explore power electronics, industrial electronics, VLSI, embedded systems, robotics and emerging technologies. Through technical workshops, competitions, industry interactions, projects and research-oriented initiatives, the chapters encourage students to learn, innovate and apply engineering beyond the classroom.',
    ],
    whatWeDo: [
      'We conduct hands-on technical workshops, ideathons, competitions, professional meets, industry visits and outreach initiatives. Our activities cover areas including VLSI and semiconductor technology, GPU computing, robotics, embedded systems, automation and AI-driven technologies. Through initiatives such as Yellarigu Electronics, we also take electronics beyond the campus by engaging school students in interactive, hands-on activities and introducing them to the fundamentals of electronics and engineering. We provide students with opportunities to participate in projects, research, student congresses, competitions and collaborative technical events.',
    ],
    focus: [],
    activities: [
      'PELS & IES Week 2025 (17+ events)',
      'Beyond Basics and Geeks Biz (Flagship events of PELS and IES Week)',
      'GPU Unlocked',
      'Beyond Maps — SLAM in Robotics (Phaseshift)',
      'Project Planet Ideathon',
      'OR(BIT)² (Workshop and Codeathon)',
      'Tech-Connect',
      'The Last Message (Utsav)',
      'Yellarigu Electronics (Outreach event)',
      'VLSI Workshop with ChipEdge',
    ],
    majorEvents: [
      'PELS & IES Week 2025 (17+ events)',
      'Beyond Basics and Geeks Biz (Flagship events of PELS and IES Week)',
      'GPU Unlocked',
      'Beyond Maps — SLAM in Robotics (Phaseshift)',
      'Project Planet Ideathon',
      'OR(BIT)² (Workshop and Codeathon)',
      'Tech-Connect',
      'The Last Message (Utsav)',
      'Yellarigu Electronics (Outreach event)',
      'VLSI Workshop with ChipEdge',
    ],
    futureEvents: [
      {
        title: 'Yellarigu Electronics 2.0',
      },
      {
        title: 'PELS & IES Week 2026',
        description:
          'A three-day series of technical and interactive events featuring competitions, hands-on workshops, seminars, games and other engaging activities, providing students with opportunities to learn, compete, collaborate and explore emerging technologies.',
      },
    ],
    stats: { members: '150+', events: '17+', founded: '2018' },
    name: 'Power Electronics Society and the Industrial Electronics Society (PELS & IES)',
    fullName: 'IEEE Power Electronics Society and the Industrial Electronics Society (PELS & IES)',
    title: 'BMSCE IEEE PELS & IES',
    tagline: 'Power electronics, industrial electronics, VLSI, embedded systems & robotics',
    description:
      'Creating opportunities for students to explore power electronics, industrial electronics, VLSI, embedded systems, robotics and emerging technologies.',
    tracks: ['Power Electronics', 'VLSI & Robotics', 'Embedded Systems'],
    icon: CircuitBoard,
    tone: { text: 'text-amber-600', soft: 'bg-amber-50', bar: 'bg-amber-500' },
  },
  {
    slug: 'wie',
    short: 'Women in Engineering',
    code: 'WIE',
    logo: '/chapter-logos/wie.png',
    color: '#db2777',
    image: u('photo-1573164713714-d95e436ab8d6', 1400, 900),
    about: [
      'BMSCE IEEE Women in Engineering (WIE) is a vibrant community dedicated to empowering students through technical learning, leadership, innovation, collaboration, and community engagement.',
      'Through workshops, hackathons, competitions, panel discussions, awareness initiatives, and collaborative events, WIE provides students with opportunities to explore technology, develop real-world skills, and grow beyond the classroom.',
    ],
    aboutTitle: 'About Us',
    aboutUs: [
      'BMSCE IEEE Women in Engineering (WIE) is a vibrant community dedicated to empowering students through technical learning, leadership, innovation, collaboration, and community engagement. Through workshops, hackathons, competitions, panel discussions, awareness initiatives, and collaborative events, WIE provides students with opportunities to explore technology, develop real-world skills, and grow beyond the classroom.',
    ],
    focus: [],
    activities: [
      'WIE DAY – Flagship annual celebration featuring technical, creative, and scientific events',
      'NEXUS – Two-day technical summit with workshops and hackathons',
      'DATAVERSE – 8-hour data hackathon solving real-world challenges',
      'STARTOPOLIS – Startup-focused innovative idea showcase',
      'BrainRush 3.0 – Quick-thinking strategy challenge',
    ],
    pastEvents: [
      'Eco-Bid – A strategy-based environmental debate conducted in collaboration with IEEE SSIT as part of IMPACT 1.0.',
      'Fire Safety, Chemical Safety & BLS Training – A practical safety and emergency-response training initiative conducted with IQAC and the Department of Chemistry.',
      'Spark Grid – An engaging PES Day event combining precision challenges with sensor-based activities.',
      'Mind Market: Decode, Trade & Dominate – A strategy competition combining fault-finding, communication, and resource trading.',
      'Walkathon – A 5 km community initiative promoting women’s leadership, wellness, and awareness.',
      'Menstrual Wellness & Sustainable Products – An awareness initiative exploring menstrual health and sustainable menstrual products.',
      'Cyber Talk – An introductory session exploring cybersecurity and its growing relevance in the technology landscape.',
      'WIE Day 2026 – A multi-event celebration featuring technical, creative, scientific, cybersecurity, AI, web development, and awareness-focused initiatives.',
    ],
    flagshipEvents: [
      {
        title: 'WIE DAY',
        description:
          'Our flagship annual celebration featuring a diverse range of technical, creative, scientific, and awareness-driven events through collaborations with IEEE chapters and student organizations.',
      },
      {
        title: 'NEXUS',
        description:
          'A two-day technical summit featuring workshops, panel discussions, startup competitions, and hackathons.',
      },
      {
        title: 'DATAVERSE',
        description:
          'An 8-hour data hackathon where participants use analytics, data science, and machine learning to solve real-world problems.',
      },
      {
        title: 'STARTOPOLIS',
        description:
          'A startup-focused initiative that encourages students to explore, develop, and present innovative ideas.',
      },
    ],
    futureEventsTitle: 'Upcoming Events',
    futureEvents: [
      {
        title: 'BrainRush 3.0',
        description: 'A fun, game-based challenge built around quick thinking, strategy, and teamwork.',
      },
      {
        title: 'Game Development Event',
        description: 'An interactive session introducing students to the world of game development.',
      },
      {
        title: 'AR/VR Session',
        description: 'An introduction to immersive technologies and their applications.',
      },
      {
        title: 'Cybersecurity Workshop',
        description: 'A practical introduction to cybersecurity concepts and emerging technologies.',
      },
      {
        title: 'Outreach Initiative',
        description: 'A community-focused initiative aimed at creating meaningful social impact.',
      },
    ],
    stats: { members: '220+', events: '16+', founded: '2012' },
    name: 'Women in Engineering (WIE)',
    fullName: 'IEEE Women in Engineering (WIE)',
    title: 'BMSCE IEEE Women in Engineering (WIE)',
    tagline: 'Technical learning, leadership & innovation',
    description:
      'A vibrant community dedicated to empowering students through technical learning, leadership, innovation, collaboration, and community engagement.',
    tracks: ['Leadership', 'Technical Learning', 'Community Outreach'],
    icon: Users,
    tone: { text: 'text-pink-600', soft: 'bg-pink-50', bar: 'bg-pink-500' },
  },
  {
    slug: 'ssit',
    short: 'Society on Social Implications of Technology (SSIT)',
    code: 'SSIT',
    logo: '/chapter-logos/ssit.png',
    color: '#4f46e5',
    image: u('photo-1559136555-9303baea8ebd', 1400, 900),
    about: [],
    focus: [],
    activities: [],
    stats: { members: '', events: '', founded: '' },
    name: 'Society on Social Implications of Technology (SSIT)',
    fullName: 'IEEE Society on Social Implications of Technology',
    tagline: 'Technical chapter',
    description: 'Official chapter details and event records are currently being updated.',
    tracks: ['AI Ethics', 'Policy', 'Humanitarian Tech'],
    icon: Compass,
    tone: { text: 'text-indigo-600', soft: 'bg-indigo-50', bar: 'bg-indigo-500' },
    comingSoon: true,
  },
];

export type EventCategory = 'hackathon' | 'workshop' | 'summit' | 'talk';

export type SiteEvent = {
  id: string;
  title: string;
  category: EventCategory;
  /** Chapter slug, or 'branch' for branch-wide events. */
  chapter: string;
  date: string;
  time?: string;
  venue: string;
  image: string;
  description: string;
  registrationUrl: string;
};

// PLACEHOLDER events: replace with the branch's real calendar.
export const events: SiteEvent[] = [
  {
    id: 'ieee-day-2026',
    title: 'IEEE Day 2026',
    category: 'summit',
    chapter: 'branch',
    date: '2026-10-06',
    time: '10:00',
    venue: 'BMSCE Main Auditorium',
    image: u('photo-1519389950473-47ba0277781c'),
    description: 'A day of technical talks, member recognition and demos celebrating IEEE members around the world.',
    registrationUrl: '#',
  },
  {
    id: 'pes-lab-2026',
    title: 'Power Systems Lab Workshop',
    category: 'workshop',
    chapter: 'pes-sc',
    date: '2026-10-17',
    time: '14:00',
    venue: 'EEE Power Lab',
    image: u('photo-1509391366360-2e959784a276'),
    description: 'Hands-on session on smart grids, renewable integration and power electronics.',
    registrationUrl: '#',
  },
  {
    id: 'xtreme-2026',
    title: 'IEEEXtreme 20.0',
    category: 'hackathon',
    chapter: 'cs',
    date: '2026-10-24',
    time: '05:30',
    venue: 'CSE Labs, PJA Block',
    image: u('photo-1504384308090-c894fdcc538d'),
    description: 'The global 24-hour IEEE programming competition, hosted on campus for BMSCE teams.',
    registrationUrl: '#',
  },
  {
    id: 'phase-shift-2026',
    title: 'Phase Shift Hackathon 2026',
    category: 'hackathon',
    chapter: 'branch',
    date: '2026-11-14',
    time: '09:00',
    venue: 'BMSCE Campus',
    image: u('photo-1531482615713-2afd69097998'),
    description: '36-hour inter-college hackathon across AI/ML, FinTech and Sustainability tracks.',
    registrationUrl: '#',
  },
  {
    id: 'pcb-bootcamp-2026',
    title: 'PCB Design Bootcamp',
    category: 'workshop',
    chapter: 'pels-ies',
    date: '2026-11-28',
    time: '10:00',
    venue: 'ECE Design Lab',
    image: u('photo-1518770660439-4636190af475'),
    description: 'From schematic to fabricated board in one weekend.',
    registrationUrl: '#',
  },
  {
    id: 'wie-summit-2026',
    title: 'WIE Tech Summit 2026',
    category: 'summit',
    chapter: 'wie',
    date: '2026-12-05',
    time: '09:30',
    venue: 'BMSCE Main Auditorium',
    image: u('photo-1540575467063-178a50c2df87'),
    description: 'Keynotes, panels and mentorship circles celebrating women in technology.',
    registrationUrl: '#',
  },
  {
    id: 'aiml-2026',
    title: 'AI/ML Masterclass Series',
    category: 'workshop',
    chapter: 'cs',
    date: '2026-08-22',
    venue: 'BMSCE Campus',
    image: u('photo-1555949963-aa79dcee981c'),
    description: 'LLMs, computer vision and MLOps with engineers from leading tech companies.',
    registrationUrl: '#',
  },
  {
    id: 'quantum-2026',
    title: 'Quantum Computing Workshop',
    category: 'workshop',
    chapter: 'cs',
    date: '2026-07-11',
    venue: 'BMSCE Campus',
    image: u('photo-1635070041078-e363dbe005cb'),
    description: 'Quantum algorithms, Qiskit programming and quantum machine learning basics.',
    registrationUrl: '#',
  },
  {
    id: 'ethics-2026',
    title: 'AI Ethics Debate',
    category: 'talk',
    chapter: 'ssit',
    date: '2026-04-18',
    venue: 'Seminar Hall 2',
    image: u('photo-1559136555-9303baea8ebd'),
    description: 'Students and faculty debate accountability in automated decision making.',
    registrationUrl: '#',
  },
  {
    id: 'cyber-2026',
    title: 'Cybersecurity Summit',
    category: 'summit',
    chapter: 'branch',
    date: '2026-03-14',
    venue: 'BMSCE Campus',
    image: u('photo-1563986768609-322da13575f3'),
    description: 'Threat intelligence, zero trust and incident response with industry leaders.',
    registrationUrl: '#',
  },
];

/** An event is past once its day has ended (IST). */
export const isPastEvent = (e: SiteEvent, now: number) => new Date(`${e.date}T23:59:59+05:30`).getTime() < now;
export const eventStart = (e: SiteEvent) => new Date(`${e.date}T${e.time ?? '09:00'}:00+05:30`).getTime();


export type ExeComMember = { name: string; role: string; photo: string; linkedin?: string; batch?: string };

export const execom: ExeComMember[] = [
  {
    name: 'Dr. M Vasantha Lakshmi',
    role: 'Branch Counselor',
    photo: '/team/vasantha-lakshmi.png',
  },
  {
    name: 'Dr. Namratha M.',
    role: 'Branch Mentor',
    photo: '/team/namratha.png',
    linkedin: 'https://www.linkedin.com/in/dr-namratha-m-2316b814/',
  },
  {
    name: 'K Sahana',
    role: 'Chairperson',
    photo: '/team/sahana.jpg',
    linkedin: 'https://www.linkedin.com/in/sahana-k-8a3562373/',
  },
  {
    name: 'Ratik Agrawal',
    role: 'Vice Chairperson',
    photo: '/team/ratik.jpg',
    linkedin: 'https://www.linkedin.com/in/ratik-agrawal/',
  },
  {
    name: 'Neha Ramiah',
    role: 'Treasurer & MD Head',
    photo: '/team/neha.jpg',
    linkedin: 'https://www.linkedin.com/in/neharamiah06',
  },
  {
    name: 'Shashwat Goyal',
    role: 'Joint Treasurer',
    photo: '/team/shashwat.jpg',
    linkedin: 'http://www.linkedin.com/in/shashwat-goyal-b73b73187',
  },
  {
    name: 'Nithyaneshwar A',
    role: 'Secretary & Webmaster',
    photo: '/team/nithyaneshwar.jpg',
    linkedin: 'https://linkedin.com/in/nith27',
  },
];

export const socialLinks = [
  { key: 'linkedin', href: 'https://www.linkedin.com/company/bmsce-ieee/', label: 'LinkedIn' },
  { key: 'instagram', href: 'https://instagram.com/bmsce_ieee', label: 'Instagram' },
  { key: 'youtube', href: 'https://youtube.com/@bmsceieee', label: 'YouTube' },
] as const;

export const membershipBenefits = [
  'Networking & Mentorship – Connect with peers, researchers, and experienced engineers',
  'Career Growth – Job boards, resume reviews, internship openings, and global credentials',
  'Events & Competitions – Discounted conference rates, hackathons, and project showcases',
  'Skills & Workshops – Hands-on sessions on AI, VLSI, IoT, robotics, and publishing',
  'Leadership & Service – Lead branch events, committees, and community projects',
  'Funding & Savings – Scholarships, grants, awards, and savings on software and tools',
];

/** Used by the chapter cart when the database has no chapters configured yet. */
export const FALLBACK_BASE_FEE = 1850;
export const FALLBACK_CART_CHAPTERS = [
  { id: 'demo-cs', name: 'Computer Society (CS)', code: 'CS', price: 0 },
  { id: 'demo-pes', name: 'Power & Energy Society', code: 'PES', price: 100 },
  { id: 'demo-pels', name: 'Power Electronics Society and the Industrial Electronics Society (PELS & IES)', code: 'PELS/IES', price: 370 },
  { id: 'demo-wie', name: 'Women in Engineering (WIE)', code: 'WIE', price: 0 },
  { id: 'demo-sc', name: 'Sensors Council', code: 'SC', price: 0 },
  { id: 'demo-ssit', name: 'Society on Social Implications of Technology (SSIT)', code: 'SSIT', price: 50 },
];

export const chapterBySlug = (slug: string) =>
  chapters.find(
    (c) =>
      c.slug === slug ||
      ((slug === 'pes' || slug === 'sc') && c.slug === 'pes-sc') ||
      (slug === 'pels' && c.slug === 'pels-ies')
  );

export const pillars = [
  { title: 'Learn', text: 'Workshops and study groups taught by seniors, alumni and industry experts.', stat: '40+', statLabel: 'sessions a year across branches', image: u('photo-1524178232363-1fb2b075b655', 1000, 700), accent: '#18a4fe' },
  { title: 'Build', text: 'Project teams under SIG that turn ideas into reality.', stat: '10+', statLabel: 'active projects', image: u('photo-1518770660439-4636190af475', 1000, 700), accent: '#f26625' },
  { title: 'Compete', text: 'Attend hackathons in campus and across India', stat: '10+', statLabel: 'competitions hosted', image: u('photo-1531482615713-2afd69097998', 1000, 700), accent: '#fbbf24' },
  { title: 'Volunteer', text: 'Volunteer with us and get a chance to network exponentially', stat: '20+', statLabel: 'student leaders', image: u('photo-1540575467063-178a50c2df87', 1000, 700), accent: '#34d399' },
];

export const faqs = [
  { q: 'Who can become a member?', a: 'Any student currently enrolled at B.M.S. College of Engineering: undergraduate, postgraduate or research scholar, from any department.' },
  { q: 'How do I pay?', a: 'With any UPI app. Scan the QR code on the payment step, then upload the screenshot and the 12-digit UTR number. Cash is also accepted at our registration desk.' },
  { q: 'How long does verification take?', a: 'We will match the payments against the bank statement, usually within a week. You get an email once you are verified.' },
  { q: 'When do I get my IEEE.org account?', a: 'Official IEEE credentials are provisioned by IEEE headquarters in batches. We email them to you as soon as they arrive.' },
];

export const tickerItems = [
  'IEEE Week',
  'NEXUS',
  'Special Interest Groups',
  'Sensors Week',
  'IEEEXtreme',
  'Beyond Basics & Geeks Biz',
  'WIE Day',
  'Industry Academia Conclave',
  'DATAVERSE',
  'PELS & IES Week',
  'STARTOPOLIS',
  'PES Day',
  'Yellarigu Electronics',
];

/** Splits the calendar into upcoming (soonest first) and past (latest first). */
export function splitEvents(filter?: (e: SiteEvent) => boolean) {
  const now = Date.now();
  const list = filter ? events.filter(filter) : events;
  return {
    now,
    upcoming: list.filter((e) => !isPastEvent(e, now)).sort((a, b) => eventStart(a) - eventStart(b)),
    past: list.filter((e) => isPastEvent(e, now)).sort((a, b) => eventStart(b) - eventStart(a)),
  };
}

/** Maps a stored chapter name (from any source) to its short code, e.g. "Women in Engineering" -> "WIE". */
export function chapterCode(name: string) {
  const n = name.toLowerCase();
  const rules: [RegExp, string][] = [
    [/computer/, 'CS'],
    [/pels|industrial|power electronics/, 'PELS/IES'],
    [/sensors|\bsc\b/, 'SC'],
    [/power & energy|power and energy|\bpes\b/, 'PES'],
    [/women|wie/, 'WIE'],
    [/social|ssit/, 'SSIT'],
  ];
  return rules.find(([re]) => re.test(n))?.[1] ?? name;
}

export const departments = [
  ['AERO', 'Aerospace Engineering'],
  ['BT', 'Biotechnology'],
  ['CHEM', 'Chemical Engineering'],
  ['CIVIL', 'Civil Engineering'],
  ['MCA', 'Computer Applications'],
  ['CSE', 'Computer Science and Engineering'],
  ['CSE-DS', 'Computer Science and Engineering ( Data Science )'],
  ['CSE-IOT', 'Computer Science and Engineering ( IOT and Cyber Security Including Blockchain Technology )'],
  ['CSE-BS', 'Computer Science and Engineering (Business System)'],
  ['EEE', 'Electrical and Electronics Engineering'],
  ['ECE', 'Electronics and Communication Engineering'],
  ['IEM', 'Industrial Engineering and Management'],
  ['ISE', 'Information Science and Engineering'],
  ['EIE', 'Electronics and Instrumentation Engineering'],
  ['MECH', 'Mechanical Engineering'],
  ['MED', 'Medical Electronics'],
  ['ETE', 'Electronics and Telecommunication Engineering'],
  ['AIML', 'Artificial Intelligence and Machine Learning'],
  ['AIDS', 'Artificial Intelligence and Data Science'],
  ['OTHER', 'Other'],
];

