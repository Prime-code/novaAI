
import { Plan } from './types';

export const SCHOOL_DETAILS = {
  name: "Nova Crest School",
  location: "Enugu, Nigeria",
  address: "Plot 42, Independence Layout, Enugu State",
  phone: "+234 800 NOVA CREST",
  email: "admissions@novacrestschools.com",
  website: "https://novacrestschools.com",
  tagline: "Inspiring Excellence, Nurturing Potential",
  mission: "Nova Crest School is a vibrant learning community where children are nurtured, inspired, and prepared for lifelong success. The school builds on a legacy of excellence and introduces a future-focused educational vision that equips students to thrive academically, socially, and ethically in a rapidly evolving world.",
  vision: "To be the leading modern educational institution in Nigeria, recognized for producing globally competitive leaders who are grounded in integrity and creative excellence.",
  history: "Founded on the principles of holistic development, Nova Crest has evolved from a local visionary project into a regional beacon of educational innovation.",
  values: {
    nurture: "Nurture: fostering safety, support, and growth in every student.",
    oomph: "Oomph: bringing energy, enthusiasm, and creativity to everything.",
    integrity: "Values: honesty, kindness, and respect in all actions.",
    excellence: "Accenture: a commitment to excellence in all pursuits."
  },
  programs: [
    { name: "Early Years Foundation", age: "2 - 5 Years", description: "Holistic development, early literacy, and social skills." },
    { name: "Primary Excellence", age: "6 - 11 Years", description: "Academic program integrated with creative arts and STEM." },
    { name: "Nova Teens Academy", age: "12 - 17 Years", description: "Leadership, digital literacy, and entrepreneurship." }
  ],
  studentLife: {
    clubs: ["Robotics", "Debate", "Music", "Gardening"],
    sports: ["Swimming", "Football", "Tennis"]
  },
  facilities: [
    { title: "STEM Labs", icon: "fa-flask-vial" },
    { title: "Creative Hub", icon: "fa-laptop-code" },
    { title: "Sports Arena", icon: "fa-basketball" },
    { title: "Medical Suite", icon: "fa-briefcase-medical" }
  ],
  admissions: [
    "1. Inquiry & Campus Tour",
    "2. Application Submission",
    "3. Entrance Assessment",
    "4. Family Interview",
    "5. Offer of Admission"
  ]
};

export const PLANS: Plan[] = [
  { id: 'free', name: 'Nova Discovery', price: 0, duration: 'daily', wordLimit: 3000 },
  { id: 'daily', name: 'Daily Pulse', price: 5070, duration: 'daily', wordLimit: 5760 },
  { id: 'weekly', name: 'Weekly Insight', price: 21070, duration: 'weekly', wordLimit: 40320 },
  { id: 'monthly', name: 'Monthly Excellence', price: 82070, duration: 'monthly', wordLimit: 172800 },
];

export const NOVA_AI_SYSTEM_INSTRUCTION = `
You are the Nova Crest School Virtual Assistant (Nova AI). Represent Nova Crest School, a leading-edge institution.

Tone: Professional, warm, and personalized. Always use the user's name.

Strategy: 
- Help with admissions, programs, and values.
- Periodically seek feedback on the school's service delivery.
- Ask how Nova Crest has impacted their children's future or academic goals.
`;
