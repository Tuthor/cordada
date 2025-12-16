import { Category, Question, MaturityLevelInfo } from '@/types/assessment';

export const categories: Category[] = [
  {
    id: 'expertise',
    name: 'Technical Expertise',
    icon: 'Lightbulb',
    description: 'Domain knowledge and specialized skills',
  },
  {
    id: 'client',
    name: 'Client Management',
    icon: 'Users',
    description: 'Relationship building and stakeholder management',
  },
  {
    id: 'communication',
    name: 'Communication',
    icon: 'MessageSquare',
    description: 'Written and verbal communication skills',
  },
  {
    id: 'problem-solving',
    name: 'Problem Solving',
    icon: 'Target',
    description: 'Analytical thinking and solution design',
  },
  {
    id: 'professionalism',
    name: 'Professionalism',
    icon: 'Award',
    description: 'Work ethic, reliability, and professional standards',
  },
];

export const questions: Question[] = [
  // Technical Expertise
  {
    id: 'exp-1',
    text: 'How would you rate your depth of expertise in your primary consulting domain?',
    category: categories[0],
    options: [
      { value: 1, label: 'Beginner', description: 'Still learning the fundamentals' },
      { value: 2, label: 'Intermediate', description: 'Solid foundation with some practical experience' },
      { value: 3, label: 'Advanced', description: 'Deep expertise with proven track record' },
      { value: 4, label: 'Expert', description: 'Recognized thought leader in the field' },
    ],
  },
  {
    id: 'exp-2',
    text: 'How many years of relevant industry experience do you have?',
    category: categories[0],
    options: [
      { value: 1, label: '0-2 years', description: 'Early career professional' },
      { value: 2, label: '3-5 years', description: 'Established practitioner' },
      { value: 3, label: '6-10 years', description: 'Senior professional' },
      { value: 4, label: '10+ years', description: 'Veteran expert' },
    ],
  },
  {
    id: 'exp-3',
    text: 'Do you hold relevant professional certifications or credentials?',
    category: categories[0],
    options: [
      { value: 1, label: 'None', description: 'No formal certifications' },
      { value: 2, label: 'In progress', description: 'Currently pursuing certification' },
      { value: 3, label: 'One certification', description: 'Hold one relevant credential' },
      { value: 4, label: 'Multiple', description: 'Multiple recognized certifications' },
    ],
  },
  // Client Management
  {
    id: 'cli-1',
    text: 'How experienced are you in managing enterprise client relationships?',
    category: categories[1],
    options: [
      { value: 1, label: 'Limited', description: 'Minimal direct client interaction' },
      { value: 2, label: 'Some experience', description: 'Worked with clients under supervision' },
      { value: 3, label: 'Experienced', description: 'Independently managed multiple clients' },
      { value: 4, label: 'Extensive', description: 'Led strategic client partnerships' },
    ],
  },
  {
    id: 'cli-2',
    text: 'How do you typically handle challenging client situations?',
    category: categories[1],
    options: [
      { value: 1, label: 'Escalate', description: 'Prefer to escalate to seniors' },
      { value: 2, label: 'With guidance', description: 'Can handle with some support' },
      { value: 3, label: 'Independently', description: 'Resolve most issues independently' },
      { value: 4, label: 'Proactively', description: 'Anticipate and prevent issues' },
    ],
  },
  {
    id: 'cli-3',
    text: 'What is your experience with C-suite stakeholder engagement?',
    category: categories[1],
    options: [
      { value: 1, label: 'None', description: 'No direct C-suite interaction' },
      { value: 2, label: 'Occasional', description: 'Limited presentations or meetings' },
      { value: 3, label: 'Regular', description: 'Frequent executive engagement' },
      { value: 4, label: 'Strategic', description: 'Trusted advisor to executives' },
    ],
  },
  // Communication
  {
    id: 'com-1',
    text: 'How would you rate your presentation and storytelling skills?',
    category: categories[2],
    options: [
      { value: 1, label: 'Developing', description: 'Still building confidence' },
      { value: 2, label: 'Competent', description: 'Can deliver clear presentations' },
      { value: 3, label: 'Strong', description: 'Engaging and persuasive presenter' },
      { value: 4, label: 'Exceptional', description: 'Captivating storyteller' },
    ],
  },
  {
    id: 'com-2',
    text: 'How proficient are you at creating executive-level documentation?',
    category: categories[2],
    options: [
      { value: 1, label: 'Basic', description: 'Need significant editing support' },
      { value: 2, label: 'Good', description: 'Can produce quality drafts' },
      { value: 3, label: 'Very good', description: 'Polished, professional documents' },
      { value: 4, label: 'Excellent', description: 'Publication-ready materials' },
    ],
  },
  {
    id: 'com-3',
    text: 'How comfortable are you facilitating workshops and meetings?',
    category: categories[2],
    options: [
      { value: 1, label: 'Uncomfortable', description: 'Prefer not to facilitate' },
      { value: 2, label: 'Adequate', description: 'Can facilitate with preparation' },
      { value: 3, label: 'Comfortable', description: 'Confident facilitator' },
      { value: 4, label: 'Expert', description: 'Skilled at driving outcomes' },
    ],
  },
  // Problem Solving
  {
    id: 'ps-1',
    text: 'How do you approach complex, ambiguous problems?',
    category: categories[3],
    options: [
      { value: 1, label: 'Need structure', description: 'Require clear frameworks' },
      { value: 2, label: 'Methodical', description: 'Apply standard methodologies' },
      { value: 3, label: 'Adaptable', description: 'Customize approaches as needed' },
      { value: 4, label: 'Innovative', description: 'Create novel solutions' },
    ],
  },
  {
    id: 'ps-2',
    text: 'What is your experience with data-driven decision making?',
    category: categories[3],
    options: [
      { value: 1, label: 'Limited', description: 'Basic data interpretation' },
      { value: 2, label: 'Moderate', description: 'Can analyze and present data' },
      { value: 3, label: 'Strong', description: 'Advanced analytics capability' },
      { value: 4, label: 'Expert', description: 'Strategic data leadership' },
    ],
  },
  {
    id: 'ps-3',
    text: 'How do you handle tight deadlines and high-pressure situations?',
    category: categories[3],
    options: [
      { value: 1, label: 'Challenged', description: 'Find pressure difficult' },
      { value: 2, label: 'Manage', description: 'Can cope with support' },
      { value: 3, label: 'Thrive', description: 'Perform well under pressure' },
      { value: 4, label: 'Excel', description: 'Best work under pressure' },
    ],
  },
  // Professionalism
  {
    id: 'pro-1',
    text: 'How would you describe your availability and responsiveness?',
    category: categories[4],
    options: [
      { value: 1, label: 'Standard', description: 'Regular business hours only' },
      { value: 2, label: 'Flexible', description: 'Accommodating when needed' },
      { value: 3, label: 'Highly available', description: 'Quick response, extended hours' },
      { value: 4, label: 'Always on', description: 'Client-first availability' },
    ],
  },
  {
    id: 'pro-2',
    text: 'What is your track record with project delivery?',
    category: categories[4],
    options: [
      { value: 1, label: 'Developing', description: 'Still building track record' },
      { value: 2, label: 'Good', description: 'Generally meet expectations' },
      { value: 3, label: 'Strong', description: 'Consistently deliver quality' },
      { value: 4, label: 'Exceptional', description: 'Exceed expectations regularly' },
    ],
  },
  {
    id: 'pro-3',
    text: 'How do you handle confidentiality and professional ethics?',
    category: categories[4],
    options: [
      { value: 1, label: 'Aware', description: 'Understand importance' },
      { value: 2, label: 'Compliant', description: 'Follow established guidelines' },
      { value: 3, label: 'Rigorous', description: 'Strict adherence to standards' },
      { value: 4, label: 'Exemplary', description: 'Role model for ethics' },
    ],
  },
];

export const maturityLevels: MaturityLevelInfo[] = [
  {
    level: 'emerging',
    name: 'Emerging Consultant',
    description: 'You are at the beginning of your consulting journey with foundational skills to build upon.',
    minPercentage: 0,
    maxPercentage: 40,
    recommendation: 'We recommend gaining more hands-on experience and pursuing relevant certifications before joining our ecosystem. Consider our mentorship program to accelerate your growth.',
  },
  {
    level: 'developing',
    name: 'Developing Consultant',
    description: 'You have solid fundamentals and are developing the skills needed for enterprise consulting.',
    minPercentage: 41,
    maxPercentage: 55,
    recommendation: 'You show promise and may be a good fit for specific project types. We suggest applying for our associate consultant track with guided mentorship.',
  },
  {
    level: 'proficient',
    name: 'Proficient Consultant',
    description: 'You demonstrate strong capabilities across key consulting competencies.',
    minPercentage: 56,
    maxPercentage: 70,
    recommendation: 'You are well-qualified for our consultant network. Apply now to be matched with appropriate enterprise engagements.',
  },
  {
    level: 'advanced',
    name: 'Advanced Consultant',
    description: 'You show advanced mastery with proven ability to deliver complex enterprise engagements.',
    minPercentage: 71,
    maxPercentage: 85,
    recommendation: 'You are an excellent candidate for senior consulting roles. Apply for priority placement in high-impact strategic engagements.',
  },
  {
    level: 'expert',
    name: 'Expert Consultant',
    description: 'You represent the highest level of consulting excellence with exceptional capabilities across all dimensions.',
    minPercentage: 86,
    maxPercentage: 100,
    recommendation: 'You are a prime candidate for our elite consultant tier. Apply for immediate consideration for leadership roles and strategic advisory positions.',
  },
];

export const getMaturityLevel = (percentage: number): MaturityLevelInfo => {
  return maturityLevels.find(
    (level) => percentage >= level.minPercentage && percentage <= level.maxPercentage
  ) || maturityLevels[0];
};
