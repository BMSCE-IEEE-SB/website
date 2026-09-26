import { Cpu, Zap, CircuitBoard, Users, Compass, Bot, type LucideIcon } from 'lucide-react';

const u = (id: string, w = 900, h = 600) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format&q=70`;

export const BRANCH = {
  name: 'BMSCE IEEE Student Branch',
  shortName: 'BMSCE IEEE',
  college: 'B.M.S. College of Engineering',
  branchCode: '06261',
  region: 'IEEE Region 10',
  section: 'Bangalore Section',
  established: '2009',
};

export const contactInfo = {
  address: 'Bull Temple Road, Basavanagudi, Bengaluru 560019',
  email: 'ieee@bmsce.ac.in',
  phone: '+91 80 2662 2130',
};

export const navItems = [
  { label: 'About', href: '/#about', id: 'about' },
  { label: 'Chapters', href: '/#chapters', id: 'chapters' },
  { label: 'Events', href: '/#events', id: 'events' },
  { label: 'Gallery', href: '/gallery', id: 'gallery' },
  { label: 'Team', href: '/#team', id: 'team' },
  { label: 'Contact', href: '/#contact', id: 'contact' },
];

export const metrics = [
  { value: '16+', label: 'Years of technical legacy' },
  { value: '1,000+', label: 'Active members' },
  { value: '6', label: 'Technical chapters & affinity groups' },
  { value: '50+', label: 'Workshops & hackathons every year' },
];

export type Chapter = {
  slug: string;
  /** Compact name for tight layouts. */
  short: string;
  code: string;
  /** Accent colour used for dynamic styling (hex). */
  color: string;
  image: string;
  about: string[];
  focus: { title: string; text: string }[];
  activities: string[];
  stats: { members: string; events: string; founded: string };
  name: string;
  fullName: string;
  tagline: string;
  description: string;
  tracks: string[];
  icon: LucideIcon;
  /** Tailwind classes for the accent colour (text + soft background). */
  tone: { text: string; soft: string; bar: string };
};

export const chapters: Chapter[] = [
  {
    slug: 'cs',
    short: 'Computer Society',
    code: 'CS',
    color: '#0284c7',
    image: u('photo-1517694712202-14dd9538aa97', 1400, 900),
    about: [
      'The Computer Society is the largest chapter in the branch. It is where students learn to ship real software, from their first pull request to production systems.',
      'Members run coding sprints, host the 24-hour IEEEXtreme challenge on campus and work with industry mentors on AI, cloud and systems projects.',
    ],
    focus: [
      { title: 'AI & machine learning', text: 'Study groups and build nights on LLMs, vision and MLOps.' },
      { title: 'Web & cloud', text: 'Full-stack bootcamps, cloud credits and deployment clinics.' },
      { title: 'Competitive programming', text: 'Weekly practice rounds leading up to IEEEXtreme.' },
      { title: 'Open source', text: 'Contribution drives and mentoring for first-time contributors.' },
    ],
    activities: ['IEEEXtreme 24-hour programming challenge', 'Phase Shift inter-college hackathon', 'Weekly DSA practice rounds', 'Industry tech talks'],
    stats: { members: '400+', events: '20+', founded: '2011' },
    name: 'Computer Society',
    fullName: 'IEEE Computer Society',
    tagline: 'Software, algorithms & AI systems',
    description:
      'Workshops, hackathons and industry sessions on software engineering, AI/ML and cloud. Home of the 24-hour IEEEXtreme programming challenge on campus.',
    tracks: ['AI/ML', 'Web & Cloud', 'Systems'],
    icon: Cpu,
    tone: { text: 'text-sky-600', soft: 'bg-sky-50', bar: 'bg-sky-500' },
  },
  {
    slug: 'pes',
    short: 'Power & Energy',
    code: 'PES',
    color: '#059669',
    image: u('photo-1509391366360-2e959784a276', 1400, 900),
    about: [
      'The Power & Energy Society looks at how the world will generate, move and store energy as it decarbonises.',
      'Members get hands-on time in the power labs, visit substations and renewable plants, and design small microgrid and EV projects.',
    ],
    focus: [
      { title: 'Smart grids', text: 'Grid automation, protection and demand response.' },
      { title: 'Renewables', text: 'Solar and wind integration, storage and microgrids.' },
      { title: 'E-mobility', text: 'EV powertrains, battery management and charging.' },
      { title: 'Energy policy', text: 'How regulation and markets shape the grid.' },
    ],
    activities: ['Power systems lab workshops', 'Industrial and substation visits', 'Renewable energy design challenge', 'PES Day celebration'],
    stats: { members: '250+', events: '15+', founded: '2014' },
    name: 'Power & Energy Society',
    fullName: 'IEEE Power & Energy Society',
    tagline: 'Clean tech, smart grids & e-mobility',
    description:
      'Renewable microgrids, energy storage, power distribution and EV powertrains, with hands-on lab sessions and industry visits.',
    tracks: ['Smart Grids', 'Clean Tech', 'EV Systems'],
    icon: Zap,
    tone: { text: 'text-emerald-600', soft: 'bg-emerald-50', bar: 'bg-emerald-500' },
  },
  {
    slug: 'pels-ies',
    short: 'Power Electronics',
    code: 'PELS/IES',
    color: '#d97706',
    image: u('photo-1518770660439-4636190af475', 1400, 900),
    about: [
      'The PELS and IES joint chapter is for students who like to hold their work in their hands: boards, converters, motors and controllers.',
      'Members learn PCB design from schematic to fabrication, build power converters and program the embedded systems that drive industry.',
    ],
    focus: [
      { title: 'PCB design', text: 'Schematic capture, layout and in-house fabrication.' },
      { title: 'Power converters', text: 'DC-DC and inverter topologies, simulation to hardware.' },
      { title: 'Embedded drives', text: 'Motor control and real-time firmware.' },
      { title: 'Industrial IoT', text: 'Sensors, PLCs and factory automation.' },
    ],
    activities: ['PCB design bootcamp', 'Hardware build weekends', 'Converter design contest', 'Industry automation visits'],
    stats: { members: '150+', events: '12+', founded: '2018' },
    name: 'Power & Industrial Electronics',
    fullName: 'IEEE PELS & IES Joint Chapter',
    tagline: 'PCB design, drives & automation',
    description:
      'Electronic prototyping, power converter design, embedded drives, sensor interfacing and industrial automation controls.',
    tracks: ['PCB Design', 'Embedded', 'Industrial IoT'],
    icon: CircuitBoard,
    tone: { text: 'text-amber-600', soft: 'bg-amber-50', bar: 'bg-amber-500' },
  },
  {
    slug: 'ras',
    short: 'Robotics',
    code: 'RAS',
    color: '#7c3aed',
    image: u('photo-1485827404703-89b55fcc595e', 1400, 900),
    about: [
      'The Robotics & Automation Society builds machines that sense, think and move.',
      'From line followers in first year to autonomous rovers and robotic arms, members work across mechanics, electronics and software in small project teams.',
    ],
    focus: [
      { title: 'Autonomy', text: 'Localisation, path planning and ROS.' },
      { title: 'Computer vision', text: 'Perception pipelines for real robots.' },
      { title: 'Controls', text: 'PID to model-predictive control on hardware.' },
      { title: 'Mechatronics', text: 'Actuators, sensors and mechanical design.' },
    ],
    activities: ['Robotics Challenge (maze & manipulation)', 'ROS workshop series', 'Inter-college robo-sumo', 'Project demo day'],
    stats: { members: '200+', events: '18+', founded: '2016' },
    name: 'Robotics & Automation',
    fullName: 'IEEE Robotics & Automation Society',
    tagline: 'Autonomous systems & intelligent machines',
    description:
      'Building autonomous robots, computer-vision pipelines and control systems, from maze solvers to manipulators.',
    tracks: ['Autonomy', 'Vision', 'Controls'],
    icon: Bot,
    tone: { text: 'text-violet-600', soft: 'bg-violet-50', bar: 'bg-violet-500' },
  },
  {
    slug: 'wie',
    short: 'Women in Engineering',
    code: 'WIE',
    color: '#db2777',
    image: u('photo-1573164713714-d95e436ab8d6', 1400, 900),
    about: [
      'Women in Engineering is an affinity group that builds a stronger, more inclusive engineering community on campus and beyond.',
      'The group runs mentorship circles with alumni and industry leaders, leadership programmes, and STEM outreach in local schools. Everyone is welcome.',
    ],
    focus: [
      { title: 'Mentorship', text: 'Paired mentoring with alumni and industry engineers.' },
      { title: 'Leadership', text: 'Workshops on public speaking, negotiation and leading teams.' },
      { title: 'STEM outreach', text: 'Hands-on science sessions for school students.' },
      { title: 'Research', text: 'Support for papers, grants and conference travel.' },
    ],
    activities: ['WIE Tech Summit', 'Mentorship circles', 'School outreach days', 'Resume and interview clinics'],
    stats: { members: '180+', events: '12+', founded: '2012' },
    name: 'Women in Engineering',
    fullName: 'IEEE Women in Engineering',
    tagline: 'Mentorship, leadership & STEM outreach',
    description:
      'A global affinity group empowering women technologists through mentorship, leadership programmes and research initiatives.',
    tracks: ['Mentorship', 'Leadership', 'Outreach'],
    icon: Users,
    tone: { text: 'text-pink-600', soft: 'bg-pink-50', bar: 'bg-pink-500' },
  },
  {
    slug: 'ssit',
    short: 'Tech & Society',
    code: 'SSIT',
    color: '#4f46e5',
    image: u('photo-1559136555-9303baea8ebd', 1400, 900),
    about: [
      'The Society on Social Implications of Technology asks what technology should do, not just what it can do.',
      'Members debate AI ethics and policy, study sustainable design, and build civic-tech projects with NGOs and local communities.',
    ],
    focus: [
      { title: 'AI ethics', text: 'Bias, accountability and responsible AI.' },
      { title: 'Tech policy', text: 'How law and regulation keep up with engineering.' },
      { title: 'Sustainability', text: 'Designing for the planet and its resources.' },
      { title: 'Civic tech', text: 'Projects built with and for local communities.' },
    ],
    activities: ['Ethics in engineering debates', 'Civic-tech build-a-thon', 'Policy reading circles', 'Sustainability audits'],
    stats: { members: '100+', events: '8+', founded: '2021' },
    name: 'Social Implications of Technology',
    fullName: 'IEEE Society on Social Implications of Technology',
    tagline: 'Tech ethics, policy & civic tech',
    description:
      'Engineering ethics, AI governance, sustainability and civic technology built for humanitarian and social progress.',
    tracks: ['AI Ethics', 'Policy', 'Humanitarian Tech'],
    icon: Compass,
    tone: { text: 'text-indigo-600', soft: 'bg-indigo-50', bar: 'bg-indigo-500' },
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
    chapter: 'pes',
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
  {
    id: 'robotics-2026',
    title: 'Robotics Challenge 2026',
    category: 'hackathon',
    chapter: 'ras',
    date: '2026-02-07',
    venue: 'BMSCE Campus',
    image: u('photo-1485827404703-89b55fcc595e'),
    description: 'Autonomous robots take on maze navigation, detection and manipulation rounds.',
    registrationUrl: '#',
  },
];

/** An event is past once its day has ended (IST). */
export const isPastEvent = (e: SiteEvent, now: number) => new Date(`${e.date}T23:59:59+05:30`).getTime() < now;
export const eventStart = (e: SiteEvent) => new Date(`${e.date}T${e.time ?? '09:00'}:00+05:30`).getTime();

export type GalleryCategory = 'hackathon' | 'workshop' | 'summit' | 'student-life';

export type GalleryPhoto = { src: string; full: string; alt: string; title: string; category: GalleryCategory };

const g = (id: string, alt: string, title: string, category: GalleryCategory): GalleryPhoto => ({
  src: u(id, 800, 600),
  full: u(id, 1600, 1066),
  alt,
  title,
  category,
});

export const gallery: GalleryPhoto[] = [
  g('photo-1504384308090-c894fdcc538d', 'Teams coding at Phase Shift Hackathon', 'Phase Shift Hackathon', 'hackathon'),
  g('photo-1555949963-aa79dcee981c', 'Speaker at the AI/ML workshop', 'AI/ML Masterclass', 'workshop'),
  g('photo-1540575467063-178a50c2df87', 'Keynote at WIE Tech Summit', 'WIE Tech Summit', 'summit'),
  g('photo-1531482615713-2afd69097998', 'Winners announced at Phase Shift', 'Phase Shift Hackathon', 'hackathon'),
  g('photo-1531746790731-6c087fecd65a', 'Students building ML models', 'AI/ML Masterclass', 'workshop'),
  g('photo-1573164713714-d95e436ab8d6', 'Panel discussion at WIE Summit', 'WIE Tech Summit', 'summit'),
  g('photo-1485827404703-89b55fcc595e', 'Autonomous robot in competition', 'Robotics Challenge', 'hackathon'),
  g('photo-1497436072909-60f360e1d4b1', 'Smart grid demonstration', 'Power Systems Workshop', 'workshop'),
  g('photo-1519389950473-47ba0277781c', 'IEEE Day celebration', 'IEEE Day 2024', 'summit'),
  g('photo-1522202176988-66273c2fd55f', 'Students at a campus event', 'Student Outreach', 'student-life'),
  g('photo-1505373877841-8d25f7d46678', 'Audience at a technical talk', 'Technical Talk Series', 'student-life'),
  g('photo-1497366216548-37526070297c', 'Industry visit to a tech park', 'Industry Visit', 'student-life'),
  g('photo-1550751827-4bd374c3f58b', 'Hands-on security workshop', 'Cybersecurity Summit', 'summit'),
  g('photo-1517694712202-14dd9538aa97', 'Hackathon participants collaborating', 'Phase Shift Hackathon', 'hackathon'),
  g('photo-1524178232363-1fb2b075b655', 'New members at orientation', 'IEEE Orientation', 'student-life'),
  g('photo-1521737604893-d14cc237f11d', 'Networking session', 'WIE Tech Summit', 'summit'),
];

export type ExeComMember = { name: string; role: string; photo: string; linkedin: string; batch?: string };

export const execom: ExeComMember[] = [
  { name: 'Arjun Sharma', role: 'Chairperson', photo: 'https://randomuser.me/api/portraits/men/32.jpg', linkedin: 'https://linkedin.com/in/arjunsharma', batch: '2025' },
  { name: 'Priya Nair', role: 'Vice Chairperson', photo: 'https://randomuser.me/api/portraits/women/44.jpg', linkedin: 'https://linkedin.com/in/priyanair', batch: '2025' },
  { name: 'Ananya Reddy', role: 'Secretary', photo: 'https://randomuser.me/api/portraits/women/26.jpg', linkedin: 'https://linkedin.com/in/ananyareddy', batch: '2026' },
  { name: 'Rahul Krishnan', role: 'Treasurer', photo: 'https://randomuser.me/api/portraits/men/18.jpg', linkedin: 'https://linkedin.com/in/rahulkrishnan', batch: '2026' },
  { name: 'Vikram Patel', role: 'Joint Treasurer', photo: 'https://randomuser.me/api/portraits/men/75.jpg', linkedin: 'https://linkedin.com/in/vikrampatel', batch: '2025' },
];

export const socialLinks = [
  { key: 'linkedin', href: 'https://linkedin.com/company/bmsce-ieee', label: 'LinkedIn' },
  { key: 'instagram', href: 'https://instagram.com/bmsce_ieee', label: 'Instagram' },
  { key: 'x', href: 'https://twitter.com/bmsce_ieee', label: 'X (Twitter)' },
  { key: 'youtube', href: 'https://youtube.com/@bmsceieee', label: 'YouTube' },
] as const;

export const membershipBenefits = [
  'Full access to the IEEE Xplore digital library',
  'Discounted entry to conferences, workshops and hackathons',
  'Leadership roles in branch and chapter committees',
  'Mentorship on research and technical projects',
  'Global IEEE credentials and the IEEE.org network',
];

/** Used by the chapter cart when the database has no chapters configured yet. */
export const FALLBACK_BASE_FEE = 250;
export const FALLBACK_CART_CHAPTERS = [
  { id: 'demo-cs', name: 'Computer Society', code: 'CS', price: 100 },
  { id: 'demo-pes', name: 'Power & Energy Society', code: 'PES', price: 100 },
  { id: 'demo-pels', name: 'PELS & IES Joint Chapter', code: 'PELS/IES', price: 100 },
  { id: 'demo-ras', name: 'Robotics & Automation Society', code: 'RAS', price: 100 },
  { id: 'demo-wie', name: 'Women in Engineering', code: 'WIE', price: 50 },
  { id: 'demo-ssit', name: 'Social Implications of Technology', code: 'SSIT', price: 50 },
];

export const chapterBySlug = (slug: string) => chapters.find((c) => c.slug === slug);

export const pillars = [
  { title: 'Learn', text: 'Workshops and study groups taught by seniors, alumni and industry engineers.', stat: '50+', statLabel: 'sessions a year' },
  { title: 'Build', text: 'Project teams that turn ideas into boards, robots, apps and papers.', stat: '30+', statLabel: 'active projects' },
  { title: 'Compete', text: 'Hackathons, IEEEXtreme and design contests, on campus and across India.', stat: '12', statLabel: 'competitions hosted' },
  { title: 'Lead', text: 'Run a chapter, an event or a team, and learn to lead people, not just code.', stat: '60+', statLabel: 'student leaders' },
];

// PLACEHOLDER quotes: replace with real member testimonials before launch.
export const testimonials = [
  { quote: 'I joined for the hackathons and stayed for the people. My first PCB, my first paper and my internship all came through IEEE.', name: 'Final-year student', role: 'ECE · PELS/IES' },
  { quote: 'Running a workshop for 200 juniors taught me more about leadership than any course. The seniors trust you with real responsibility.', name: 'Third-year student', role: 'CSE · Computer Society' },
  { quote: 'The WIE mentorship circle connected me with an alumna at a chip company. She reviewed my resume line by line.', name: 'Second-year student', role: 'EEE · WIE' },
  { quote: 'Our robotics team went from a line follower to an autonomous rover in a year. The lab access alone is worth the membership.', name: 'Third-year student', role: 'MECH · RAS' },
];

export const faqs = [
  { q: 'Who can become a member?', a: 'Any student currently enrolled at B.M.S. College of Engineering: undergraduate, postgraduate or research scholar, from any department.' },
  { q: 'What does the membership cost?', a: 'A base branch membership fee plus an optional fee for each technical chapter you add. You see the exact total before you pay.' },
  { q: 'How do I pay?', a: 'With any UPI app. Scan the QR code on the payment step, then upload the screenshot and the 12-digit UTR number.' },
  { q: 'How long does verification take?', a: 'The treasurer matches payments against the bank statement, usually within two to three working days. You get an email once you are verified.' },
  { q: 'Can I join more chapters later?', a: 'Yes. Sign in to the member portal and start a new application with the extra chapters you want.' },
  { q: 'When do I get my IEEE.org account?', a: 'Official IEEE credentials are provisioned by IEEE headquarters in batches. We email them to you as soon as they arrive.' },
];

export const tickerItems = ['IEEE Day 2026', 'IEEEXtreme 20.0', 'Phase Shift Hackathon', 'WIE Tech Summit', 'PCB Design Bootcamp', 'Robotics Challenge', 'AI/ML Masterclass', 'Membership Drive 2026'];

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
    [/power & energy|power and energy|\bpes\b/, 'PES'],
    [/robot/, 'RAS'],
    [/women/, 'WIE'],
    [/social|ssit/, 'SSIT'],
  ];
  return rules.find(([re]) => re.test(n))?.[1] ?? name;
}
