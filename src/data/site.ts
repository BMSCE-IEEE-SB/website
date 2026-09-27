import { Cpu, Zap, CircuitBoard, Users, Compass, type LucideIcon } from 'lucide-react';

const u = (id: string, w = 900, h = 600) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&auto=format&q=70`;

const local = (name: string) => `/${name}`;

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
  { label: 'Events', href: '/events', id: 'events' },
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
    image: local('gallery_img_48_147.png'),
    about: [
      'IEEE Computer Society at BMSCE is the software home of the branch: hackathons during Phase Shift, weekly problem-solving, and the campus site for IEEEXtreme.',
      'Seniors run DSA rounds, Git/GitHub clinics and project reviews. First-years usually start with a workshop, then join a team shipping something for a fest or a paper.',
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
    image: local('gallery_img_17_55.png'),
    about: [
      'BMSCE IEEE PES & Sensors Council focuses on advancements in Electrical Power & Energy, Electronics, Robotics, and Sensors.',
      'We aim to bridge the gap between academic concepts and real-world applications through hands-on projects, technical workshops, industry interactions, research opportunities, and mentorship.',
    ],
    focus: [
      { title: 'Power & Energy Systems', text: 'Smart grids, renewables, energy storage, EV powertrains, and power distribution.' },
      { title: 'Sensors & Robotics', text: 'Sensor technology, robotics, automation, and embedded sensing systems.' },
      { title: 'Industry & Research', text: 'Industry-academia collaboration, research projects, and standards & regulations.' },
      { title: 'Career Readiness', text: 'Campus-to-corporate programs, professional skills, and placement preparation.' },
    ],
    activities: [
      'Sensors Enclave — 24-hour hardware hackathon with industry guidance',
      'Sensors Week — Week-long technical workshops, expert talks, and hardware challenges',
      'PES Day — Annual celebration with technical, collaborative, and awareness activities',
      'Industry Academia Conclave — Platform connecting students with industry leaders and IEEE professionals',
      'National Conference on Standards, Codes & Regulations in Lighting',
      'Campus to Corporate — Industry-oriented value-added course for placement readiness',
      'Embedded Systems & Analog Design Workshops',
      'Technical sessions, hands-on projects, and industry interactions',
    ],
    stats: { members: '250+', events: '15+', founded: '2014' },
    name: 'Power & Energy Society',
    fullName: 'IEEE Power & Energy Society & Sensors Council',
    tagline: 'Power systems, sensors, robotics & industry readiness',
    description:
      'Power systems, sensors, robotics, and industry readiness through hands-on projects, workshops, and flagship events like Sensors Enclave and PES Day.',
    tracks: ['Power & Energy', 'Sensors & Robotics', 'Industry & Research', 'Career Readiness'],
    icon: Zap,
    tone: { text: 'text-emerald-600', soft: 'bg-emerald-50', bar: 'bg-emerald-500' },
  },
{
    slug: 'pels-ies',
    short: 'Power Electronics',
    code: 'PELS/IES',
    color: '#d97706',
    image: local('gallery_img_14_46.png'),
    about: [
      'BMSCE IEEE PELS & IES is the joint student chapter of the IEEE Power Electronics Society and IEEE Industrial Electronics Society.',
      'Focused on creating opportunities for students to explore power electronics, industrial electronics, VLSI, embedded systems, robotics and emerging technologies. Through technical workshops, competitions, industry interactions, projects and research-oriented initiatives, the chapters encourage students to learn, innovate and apply engineering beyond the classroom.',
    ],
    focus: [
      { title: 'VLSI & Semiconductor', text: 'VLSI design, semiconductor technology, and chip design workflows.' },
      { title: 'Power Electronics', text: 'Power converter design, motor drives, GPU computing, and energy systems.' },
      { title: 'Robotics & Embedded', text: 'SLAM, robotics, embedded systems, automation, and AI-driven technologies.' },
      { title: 'Outreach & Community', text: 'Yellarigu Electronics — taking electronics to school students through hands-on activities.' },
    ],
    activities: [
      'PELS & IES Week — 17+ events over 3 days: competitions, workshops, seminars, games',
      'Beyond Basics & Geeks Biz — Flagship events of PELS & IES Week',
      'GPU Unlocked — GPU computing and applications workshop',
      'Beyond Maps — SLAM in Robotics (Phase Shift)',
      'Project Planet Ideathon — Innovation and project ideation competition',
      'OR(BIT)² — Workshop and codeathon on optimization and algorithms',
      'Tech-Connect — Industry interaction and professional networking',
      'The Last Message — Technical event at Utsav',
      'Yellarigu Electronics — Outreach event introducing school students to electronics',
      'VLSI Workshop with ChipEdge — Industry-partnered VLSI training',
      'Yellarigu Electronics 2.0 — Upcoming expanded outreach initiative',
    ],
    stats: { members: '150+', events: '12+', founded: '2018' },
    name: 'Power & Industrial Electronics',
    fullName: 'IEEE PELS & IES Joint Chapter',
    tagline: 'Power electronics, VLSI, robotics & embedded systems',
    description:
      'Power electronics, VLSI, embedded systems, and robotics through workshops, competitions, and PELS & IES Week. Yellarigu Electronics brings electronics to school students.',
    tracks: ['VLSI & Semiconductor', 'Power Electronics', 'Robotics & Embedded', 'Outreach & Community'],
    icon: CircuitBoard,
    tone: { text: 'text-amber-600', soft: 'bg-amber-50', bar: 'bg-amber-500' },
  },
  {
    slug: 'wie',
    short: 'Women in Engineering',
    code: 'WIE',
    color: '#db2777',
    image: local('gallery_img_37_114.png'),
    about: [
      'BMSCE IEEE Women in Engineering (WIE) is a vibrant community dedicated to empowering students through technical learning, leadership, innovation, collaboration, and community engagement.',
      'Through workshops, hackathons, competitions, panel discussions, awareness initiatives, and collaborative events, WIE provides students with opportunities to explore technology, develop real-world skills, and grow beyond the classroom.',
      'Membership is open to everyone — the goal is more women in labs, on stage, and in leadership roles, with practical support to get there.',
    ],
    focus: [
      { title: 'Technical Learning', text: 'Workshops and hackathons on AI/ML, cybersecurity, web development, data science, AR/VR, and game development.' },
      { title: 'Leadership & Innovation', text: 'Startup competitions, strategy challenges, and panel discussions that build real-world leadership.' },
      { title: 'Awareness & Wellness', text: 'Initiatives on menstrual health, sustainable products, fire safety, BLS training, and women\'s wellness.' },
      { title: 'Community & Outreach', text: 'Walkathons, school outreach, environmental debates with SSIT, and social impact projects.' },
    ],
    activities: [
      'WIE Day — Annual multi-event celebration with technical, creative, and awareness tracks',
      'NEXUS — Two-day technical summit with workshops, panels, startup competitions, and hackathons',
      'DATAVERSE — 8-hour data hackathon for analytics, data science, and ML problem-solving',
      'STARTOPOLIS — Startup-focused initiative for innovative idea development and presentation',
      'Eco-Bid — Environmental strategy debate with SSIT',
      'Walkathon — 5km community initiative for women\'s leadership and wellness',
      'Cyber Talk & Cybersecurity Workshop — Practical security and emerging tech sessions',
      'Fire Safety, Chemical Safety & BLS Training — Emergency response training with IQAC',
      'Menstrual Wellness & Sustainable Products — Health awareness initiative',
      'BrainRush, Game Dev, AR/VR — Upcoming interactive skill-building events',
    ],
    stats: { members: '180+', events: '12+', founded: '2012' },
    name: 'Women in Engineering',
    fullName: 'IEEE Women in Engineering',
    tagline: 'Technical learning, leadership, innovation & community impact',
    description:
      'Technical workshops, hackathons, leadership summits, and wellness initiatives. WIE Day, DATAVERSE, startup pitches, walkathons — explore tech, build skills, lead with impact.',
    tracks: ['Technical Learning', 'Leadership & Innovation', 'Awareness & Wellness', 'Community & Outreach'],
    icon: Users,
    tone: { text: 'text-pink-600', soft: 'bg-pink-50', bar: 'bg-pink-500' },
  },
  {
    slug: 'ssit',
    short: 'Tech & Society',
    code: 'SSIT',
    color: '#4f46e5',
    image: local('gallery_img_36_111.png'),
    about: [
      'SSIT is the chapter that asks who a project is for, and what it breaks, before it ships. Policy reading, ethics debates and civic builds with groups off campus.',
      'It sits well with CS and ECE students who want IEEE work that is not only another hackathon track.',
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
  /** Public registration form. Empty until the branch publishes one. */
  registrationUrl?: string;
  speakers?: { name: string; role: string }[];
  highlights?: string[];
  photos?: string[];
};

export const eventPath = (e: Pick<SiteEvent, 'id'>) => `/events/${e.id}`;
export const hasRegistration = (e: SiteEvent) => Boolean(e.registrationUrl && e.registrationUrl !== '#');

// Calendar copy still needs branch photos; structure is ready for the real programme.
export const events: SiteEvent[] = [
  {
    id: 'ieee-day-2026',
    title: 'IEEE Day 2026',
    category: 'summit',
    chapter: 'branch',
    date: '2026-10-06',
    time: '10:00',
    venue: 'BMSCE Main Auditorium',
    image: local('gallery_img_22_69.png'),
    description: 'Branch-wide talks, member recognition and chapter stalls for IEEE Day on campus.',
    highlights: ['Chapter stalls in the atrium', 'Short talks from execom and faculty advisors', 'Member pin and photo wall'],
  },
  {
    id: 'pes-lab-2026',
    title: 'Power Systems Lab Workshop',
    category: 'workshop',
    chapter: 'pes',
    date: '2026-10-17',
    time: '14:00',
    venue: 'EEE Power Lab',
    image: local('gallery_img_17_55.png'),
    description: 'Hands-on session in the EEE Power Lab on protection, renewable integration and measurement.',
    speakers: [{ name: 'Faculty, EEE', role: 'Lab session lead' }],
    highlights: ['Relay and protection demo', 'Solar integration walkthrough', 'Limited lab benches — register when the form opens'],
  },
  {
    id: 'xtreme-2026',
    title: 'IEEEXtreme 20.0',
    category: 'hackathon',
    chapter: 'cs',
    date: '2026-10-24',
    time: '05:30',
    venue: 'CSE Labs, PJA Block',
    image: local('gallery_img_4_14.png'),
    description: 'The global 24-hour IEEE programming competition, hosted on campus for BMSCE teams.',
    highlights: ['Teams of up to 3', 'CSE labs, PJA Block', 'Proctors from Computer Society'],
  },
{
    id: 'pcb-bootcamp-2026',
    title: 'PCB Design Bootcamp',
    category: 'workshop',
    chapter: 'pels-ies',
    date: '2026-11-28',
    time: '10:00',
    venue: 'ECE Design Lab',
    image: local('gallery_img_14_46.png'),
    description: 'Schematic, layout and a board you can hold, run by PELS/IES in the ECE design lab.',
    speakers: [{ name: 'PELS/IES execom', role: 'Workshop crew' }],
    highlights: ['Bring a laptop with KiCad or Altium', 'Fabrication slot announced in the form', 'Best for 2nd year ECE / EEE / ETE'],
  },
  {
    id: 'wie-summit-2026',
    title: 'WIE Tech Summit 2026',
    category: 'summit',
    chapter: 'wie',
    date: '2026-12-05',
    time: '09:30',
    venue: 'BMSCE Main Auditorium',
    image: local('gallery_img_37_114.png'),
    description: 'Talks, panels and mentorship circles hosted by Women in Engineering on campus.',
    highlights: ['Open to all departments', 'Alumni panel', 'Resume clinic in the afternoon'],
  },
  {
    id: 'aiml-2026',
    title: 'AI/ML Masterclass Series',
    category: 'workshop',
    chapter: 'cs',
    date: '2026-08-22',
    venue: 'BMSCE Campus',
    image: local('gallery_img_15_49.png'),
    description: 'A Computer Society series on models you can actually train and ship, held in the CSE block.',
    speakers: [{ name: 'CS chapter', role: 'Organisers' }],
    highlights: ['Notebooks shared after each session', 'Vision and LLM tracks', 'Recorded for members who missed a week'],
    photos: [local('gallery_img_15_49.png'), local('gallery_img_39_120.png')],
  },
  {
    id: 'quantum-2026',
    title: 'Quantum Computing Workshop',
    category: 'workshop',
    chapter: 'cs',
    date: '2026-07-11',
    venue: 'BMSCE Campus',
    image: local('gallery_img_38_117.png'),
    description: 'Intro to Qiskit and a small algorithm lab for CS and ECE students.',
    highlights: ['No prior quantum course required', 'Laptops provided in the lab if needed'],
    photos: [local('gallery_img_38_117.png')],
  },
  {
    id: 'ethics-2026',
    title: 'AI Ethics Debate',
    category: 'talk',
    chapter: 'ssit',
    date: '2026-04-18',
    venue: 'Seminar Hall 2',
    image: local('gallery_img_36_111.png'),
    description: 'SSIT-hosted floor debate on accountability when software makes the call.',
    speakers: [{ name: 'SSIT + faculty moderator', role: 'Chair' }],
    highlights: ['Two student teams', 'Open Q&A', 'Notes posted for members'],
    photos: [local('gallery_img_36_111.png')],
  },
  {
    id: 'cyber-2026',
    title: 'Cybersecurity Summit',
    category: 'summit',
    chapter: 'branch',
    date: '2026-03-14',
    venue: 'BMSCE Campus',
    image: local('gallery_img_31_96.png'),
    description: 'A branch-level half-day on practical security for student projects and labs.',
    highlights: ['Incident tabletop', 'Password and repo hygiene', 'Open to all years'],
    photos: [local('gallery_img_31_96.png')],
  },
];

export const eventById = (id: string) => events.find((e) => e.id === id);

/** An event is past once its day has ended (IST). */
export const isPastEvent = (e: SiteEvent, now: number) => new Date(`${e.date}T23:59:59+05:30`).getTime() < now;
export const eventStart = (e: SiteEvent) => new Date(`${e.date}T${e.time ?? '09:00'}:00+05:30`).getTime();

export type GalleryCategory = 'hackathon' | 'workshop' | 'summit' | 'student-life';

export type GalleryPhoto = { src: string; full: string; alt: string; title: string; category: GalleryCategory };

const lg = (name: string, alt: string, title: string, category: GalleryCategory): GalleryPhoto => ({
  src: local(name),
  full: local(name),
  alt,
  title,
  category,
});

export const gallery: GalleryPhoto[] = [
  lg('gallery_img_48_147.png', 'Phase Shift Hackathon 2024', 'Phase Shift Hackathon', 'hackathon'),
  lg('gallery_img_15_49.png', 'AI/ML Masterclass workshop', 'AI/ML Masterclass', 'workshop'),
  lg('gallery_img_37_114.png', 'WIE Tech Summit keynote', 'WIE Tech Summit', 'summit'),
  lg('gallery_img_38_117.png', 'Phase Shift Hackathon winners', 'Phase Shift Hackathon', 'hackathon'),
  lg('gallery_img_39_120.png', 'Students at AI/ML workshop', 'AI/ML Masterclass', 'workshop'),
  lg('gallery_img_36_111.png', 'Panel discussion at WIE Summit', 'WIE Tech Summit', 'summit'),
  lg('gallery_img_17_55.png', 'Power Systems Workshop demo', 'Power Systems Workshop', 'workshop'),
  lg('gallery_img_22_69.png', 'IEEE Day 2024 celebration', 'IEEE Day 2024', 'summit'),
  lg('gallery_img_34_105.png', 'Student outreach event', 'Student Outreach', 'student-life'),
  lg('gallery_img_16_52.png', 'Technical talk series', 'Technical Talk Series', 'student-life'),
  lg('gallery_img_44_135.png', 'Industry visit to tech park', 'Industry Visit', 'student-life'),
  lg('gallery_img_31_96.png', 'Cybersecurity Summit workshop', 'Cybersecurity Summit', 'summit'),
  lg('gallery_img_33_102.png', 'Hackathon collaboration', 'Phase Shift Hackathon', 'hackathon'),
  lg('gallery_img_42_129.png', 'IEEE Orientation for new members', 'IEEE Orientation', 'student-life'),
  lg('gallery_img_43_132.png', 'WIE Tech Summit networking', 'WIE Tech Summit', 'summit'),
  lg('gallery_img_14_46.png', 'PCB Design Bootcamp', 'PCB Design Bootcamp', 'workshop'),
  lg('gallery_img_4_14.png', 'IEEEXtreme programming challenge', 'IEEEXtreme', 'hackathon'),
  lg('gallery_img_27_84.png', 'Student life at BMSCE IEEE', 'Student Life', 'student-life'),
  lg('gallery_img_19_61.png', 'WIE Day celebration', 'WIE Day', 'summit'),
  lg('gallery_img_51_158.png', 'Walkathon for women wellness', 'Walkathon', 'student-life'),
  lg('gallery_img_51_159.png', 'Fire safety & BLS training', 'Fire Safety Training', 'workshop'),
  lg('gallery_img_59_186.png', 'Cybersecurity awareness session', 'Cyber Talk', 'workshop'),
  lg('gallery_img_9_31.png', 'Mind Market strategy competition', 'Mind Market', 'summit'),
  lg('gallery_img_35_108.png', 'DATAVERSE data hackathon', 'DATAVERSE', 'hackathon'),
];

export type ExeComMember = { name: string; role: string; photo?: string; linkedin?: string; batch?: string };

export const execom: ExeComMember[] = [
  { 
    name: 'K Sahana', 
    role: 'Chairperson', 
    linkedin: 'https://www.linkedin.com/in/sahana-k-8a3562373/',
    photo: '/team/sahana.jpg'
  },
  { 
    name: 'Ratik Agrawal', 
    role: 'Vice Chairperson', 
    linkedin: 'https://www.linkedin.com/in/ratik-agrawal/',
    photo: '/team/ratik.jpg'
  },
  { 
    name: 'Neha Ramiah', 
    role: 'Treasurer & MD Head', 
    linkedin: 'https://www.linkedin.com/in/neharamiah06',
    photo: '/team/neha.jpg'
  },
  { 
    name: 'Shashwat Goyal', 
    role: 'Joint Treasurer', 
    linkedin: 'http://www.linkedin.com/in/shashwat-goyal-b73b73187',
    photo: '/team/shashwat.jpg'
  },
  { 
    name: 'Nithyaneshwar A', 
    role: 'Secretary & Webmaster', 
    linkedin: 'https://linkedin.com/in/nith27',
    photo: '/team/nithyaneshwar.jpg'
  },
];

export const socialLinks = [
  { key: 'linkedin', href: 'https://linkedin.com/company/bmsce-ieee', label: 'LinkedIn' },
  { key: 'instagram', href: 'https://instagram.com/bmsce_ieee', label: 'Instagram' },
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
export const FALLBACK_BASE_FEE = 1850;
export const FALLBACK_CART_CHAPTERS = [
  { id: 'demo-cs', name: 'Computer Society', code: 'CS', price: 100 },
  { id: 'demo-pes', name: 'Power & Energy Society', code: 'PES', price: 100 },
  { id: 'demo-pels', name: 'PELS & IES Joint Chapter', code: 'PELS/IES', price: 100 },
  { id: 'demo-wie', name: 'Women in Engineering', code: 'WIE', price: 50 },
  { id: 'demo-ssit', name: 'Social Implications of Technology', code: 'SSIT', price: 50 },
];

export const chapterBySlug = (slug: string) => chapters.find((c) => c.slug === slug);

export const pillars = [
  { title: 'Learn', text: 'Workshops and study groups taught by seniors, alumni and industry engineers.', stat: '50+', statLabel: 'sessions a year', image: local('gallery_img_22_69.png'), accent: '#18a4fe' },
  { title: 'Build', text: 'Project teams that turn ideas into boards, circuits, apps and papers.', stat: '30+', statLabel: 'active projects', image: local('gallery_img_14_46.png'), accent: '#f26625' },
  { title: 'Compete', text: 'Hackathons, IEEEXtreme and design contests, on campus and across India.', stat: '12', statLabel: 'competitions hosted', image: local('gallery_img_48_147.png'), accent: '#fbbf24' },
  { title: 'Lead', text: 'Run a chapter, an event or a team, and learn to lead people, not just code.', stat: '60+', statLabel: 'student leaders', image: local('gallery_img_37_114.png'), accent: '#34d399' },
];

// PLACEHOLDER quotes: replace with real member testimonials before launch.
export const testimonials = [
  { quote: 'I joined for the hackathons and stayed for the people. My first PCB, my first paper and my internship all came through IEEE.', name: 'Final-year student', role: 'ECE · PELS/IES' },
  { quote: 'Running a workshop for 200 juniors taught me more about leadership than any course. The seniors trust you with real responsibility.', name: 'Third-year student', role: 'CSE · Computer Society' },
  { quote: 'The WIE mentorship circle connected me with an alumna at a chip company. She reviewed my resume line by line.', name: 'Second-year student', role: 'EEE · WIE' },
  { quote: 'Our IEEE chapter workshops connect theory to practice. Building real projects with guidance from seniors made all the difference.', name: 'Third-year student', role: 'MECH · PES' },
];

export const faqs = [
  { q: 'Who can become a member?', a: 'Any student currently enrolled at B.M.S. College of Engineering: undergraduate, postgraduate or research scholar, from any department.' },
  { q: 'What does the membership cost?', a: 'A base branch membership fee plus an optional fee for each technical chapter you add. You see the exact total before you pay.' },
  { q: 'How do I pay?', a: 'UPI is the usual route. You can also pay from net banking or a card through your bank’s UPI / IMPS flow, then upload the receipt. We match the amount and the reference number.' },
  { q: 'How long does verification take?', a: 'The treasurer matches payments against the bank statement, usually within two to three working days. You get an email once you are verified.' },
  { q: 'Can I join more chapters later?', a: 'Yes. Sign in to the member portal and start a new application with the extra chapters you want.' },
  { q: 'When do I get my IEEE.org account?', a: 'Official IEEE credentials are provisioned by IEEE headquarters in batches. We email them to you as soon as they arrive.' },
];

export const tickerItems = ['IEEE Day 2026', 'IEEEXtreme 20.0', 'WIE Tech Summit', 'PCB Design Bootcamp', 'AI/ML Masterclass', 'Membership Drive 2026'];

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
    [/women/, 'WIE'],
    [/social|ssit/, 'SSIT'],
  ];
  return rules.find(([re]) => re.test(n))?.[1] ?? name;
}

export const departments = [
  ['CSE', 'Computer Science & Engineering'],
  ['ISE', 'Information Science & Engineering'],
  ['AIML', 'Artificial Intelligence & Machine Learning'],
  ['CSE-DS', 'Computer Science (Data Science)'],
  ['CSE-IOT', 'Computer Science (IoT & Cybersecurity)'],
  ['CSE-AI', 'Computer Science (Artificial Intelligence)'],
  ['ECE', 'Electronics & Communication'],
  ['EEE', 'Electrical & Electronics'],
  ['ETE', 'Electronics & Telecommunication'],
  ['EIE', 'Electronics & Instrumentation'],
  ['MED', 'Medical Electronics'],
  ['MECH', 'Mechanical Engineering'],
  ['AE', 'Aerospace Engineering'],
  ['CIVIL', 'Civil Engineering'],
  ['CHEM', 'Chemical Engineering'],
  ['IEM', 'Industrial Engineering & Management'],
  ['BT', 'Biotechnology'],
  ['ARCH', 'Architecture'],
  ['MCA', 'Master of Computer Applications'],
  ['OTHER', 'Other'],
];

/** Chapters we suggest first for each department (everyone is welcome in all of them). */
export const suggestedByDepartment: Record<string, string[]> = {
  CSE: ['CS', 'SSIT'],
  ISE: ['CS', 'SSIT'],
  AIML: ['CS'],
  'CSE-DS': ['CS', 'SSIT'],
  'CSE-IOT': ['CS'],
  'CSE-AI': ['CS', 'SSIT'],
  ECE: ['PELS/IES'],
  EEE: ['PES', 'PELS/IES'],
  ETE: ['PELS/IES', 'CS'],
  EIE: ['PELS/IES'],
  MED: ['PELS/IES', 'SSIT'],
  MECH: ['PES'],
  AE: ['PES'],
  CIVIL: ['SSIT', 'PES'],
  CHEM: ['PES', 'SSIT'],
  IEM: ['SSIT'],
  BT: ['SSIT', 'CS'],
  ARCH: ['SSIT', 'WIE'],
  MCA: ['CS', 'SSIT'],
};
