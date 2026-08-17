// data/marketDemand.js
// MVP reference dataset mapping roles -> required skills -> demand score / trend / salary band.
// Edit this file directly to add roles or update numbers - no AI prompt or route changes needed.

module.exports = {
  roles: {
    'Full Stack Developer': {
      coreSkills: [
        { name: 'JavaScript', demandScore: 92, trend: 'stable' },
        { name: 'React', demandScore: 90, trend: 'rising' },
        { name: 'Node.js', demandScore: 85, trend: 'stable' },
        { name: 'MongoDB', demandScore: 75, trend: 'stable' },
        { name: 'SQL', demandScore: 80, trend: 'stable' },
        { name: 'TypeScript', demandScore: 84, trend: 'rising' },
        { name: 'REST APIs', demandScore: 78, trend: 'stable' },
        { name: 'Docker', demandScore: 70, trend: 'rising' },
        { name: 'System Design', demandScore: 72, trend: 'rising' },
        { name: 'Cloud (AWS/Azure/GCP)', demandScore: 82, trend: 'rising' }
      ],
      salaryBandINR: { min: 400000, max: 1800000 },
      outlook: 'Strong demand; AI copilots are raising the bar for what "junior" output looks like, so system design and debugging depth matter more than raw syntax knowledge.'
    },
    'Data Analyst': {
      coreSkills: [
        { name: 'SQL', demandScore: 95, trend: 'stable' },
        { name: 'Python', demandScore: 88, trend: 'stable' },
        { name: 'Excel', demandScore: 70, trend: 'declining' },
        { name: 'Power BI', demandScore: 78, trend: 'rising' },
        { name: 'Tableau', demandScore: 74, trend: 'stable' },
        { name: 'Statistics', demandScore: 80, trend: 'stable' },
        { name: 'Data Storytelling', demandScore: 76, trend: 'rising' }
      ],
      salaryBandINR: { min: 350000, max: 1200000 },
      outlook: 'AI can generate queries and charts, so human value is shifting toward business judgment: knowing which question to ask and how to communicate the answer.'
    },
    'AI/ML Engineer': {
      coreSkills: [
        { name: 'Python', demandScore: 96, trend: 'stable' },
        { name: 'PyTorch', demandScore: 85, trend: 'rising' },
        { name: 'Machine Learning', demandScore: 90, trend: 'rising' },
        { name: 'LLMs / GenAI', demandScore: 94, trend: 'rising' },
        { name: 'Vector Databases', demandScore: 80, trend: 'rising' },
        { name: 'MLOps', demandScore: 78, trend: 'rising' },
        { name: 'Statistics', demandScore: 82, trend: 'stable' },
        { name: 'Cloud (AWS/Azure/GCP)', demandScore: 83, trend: 'rising' }
      ],
      salaryBandINR: { min: 600000, max: 3000000 },
      outlook: 'One of the fastest-growing categories globally; demand is outpacing supply of engineers who can ship production ML/GenAI systems, not just notebooks.'
    },
    'Cloud/DevOps Engineer': {
      coreSkills: [
        { name: 'AWS', demandScore: 88, trend: 'stable' },
        { name: 'Docker', demandScore: 85, trend: 'stable' },
        { name: 'Kubernetes', demandScore: 87, trend: 'rising' },
        { name: 'CI/CD', demandScore: 82, trend: 'stable' },
        { name: 'Terraform', demandScore: 80, trend: 'rising' },
        { name: 'Linux', demandScore: 78, trend: 'stable' },
        { name: 'Security Fundamentals', demandScore: 75, trend: 'rising' }
      ],
      salaryBandINR: { min: 500000, max: 2200000 },
      outlook: 'Cloud cost and reliability pressure keeps this role critical; security-adjacent DevOps ("DevSecOps") is the fastest-growing sub-track.'
    },
    'Cybersecurity Analyst': {
      coreSkills: [
        { name: 'Network Security', demandScore: 88, trend: 'rising' },
        { name: 'SIEM Tools', demandScore: 80, trend: 'rising' },
        { name: 'Penetration Testing', demandScore: 82, trend: 'rising' },
        { name: 'Cloud Security', demandScore: 85, trend: 'rising' },
        { name: 'Python', demandScore: 70, trend: 'stable' },
        { name: 'Compliance (ISO/SOC2)', demandScore: 72, trend: 'rising' }
      ],
      salaryBandINR: { min: 450000, max: 2000000 },
      outlook: 'Persistent global talent shortage; demand rising faster than almost any other tech category due to AI-enabled attack sophistication.'
    }
  },

  decliningSkills: ['jQuery', 'Manual QA Testing (basic)', 'Basic Excel-only reporting', 'Flash', 'Basic WordPress theming'],
  risingSkillsGlobal: ['Prompt Engineering', 'AI Agent Orchestration', 'TypeScript', 'Cloud Security', 'Data Privacy/Compliance', 'System Design']
};
