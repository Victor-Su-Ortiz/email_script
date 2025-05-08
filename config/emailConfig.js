/**
 * Email configuration settings
 */
module.exports = {
    // Default email service providers
    services: [
      'gmail',
      'outlook',
      'yahoo',
      'hotmail',
      'aol',
      'zoho'
    ],
    
    // Maximum recipients per batch
    maxRecipientsPerBatch: 100,
    
    // Rate limiting (emails per hour)
    rateLimit: {
      gmail: 500,
      outlook: 300,
      yahoo: 200,
      other: 100
    },
    
    // Send delay between emails (ms)
    sendDelay: 200,
    
    // Default email templates
    defaultTemplates: [
      {
        name: 'AgentHacks Sponsorship',
        subject: 'Join Us: AgentHacks — Applied AI Hackathon by AfterQuery & Dexterity (YC-backed)',
        content: `Hi [Name],
        
  I hope your week is going well! My name is [Your Name], and I am reaching out on behalf of the AfterQuery (AQ) and Dexterity (Dex) teams—both Y Combinator-backed startups—to share an exciting sponsorship opportunity for a student-led applied AI research hackathon we're organizing in the Bay Area on May 23–24, 2025.
  
  **AgentHacks** will be a high-intensity, research-driven weekend bringing together 300–600 of the Bay Area's top students to explore real-world problems in AI systems, and we're looking for sponsors like [Sponsor Name] to support the next generation of AI builders.
  
  Over 36 hours, students from Stanford, Berkeley, and beyond will prototype tools and run experiments across tracks like agentic workflows, human-AI collaboration, memory systems, and safety frameworks. This isn't just app building — participants will design evaluations, test hypotheses, and ship short-form research grounded in agent behavior, interface design, multimodal workflows, and alignment challenges.
  
  We'd love to explore a partnership through bounties or research challenges using your tech, workshops or talks, judging, or monetary sponsorship to support operations, food, and prizes. Would love to connect or be pointed to the right person on your team.
  
  Looking forward to hearing back from you.
  
  Best regards,
  [Your Full Name]
  AgentHacks Team
  [Your Email] | [Website]`
      },
      {
        name: 'Job Application Follow-up',
        subject: 'Following Up on My Application for [Position]',
        content: `Dear [Recipient Name],
  
  I hope this email finds you well. I recently submitted my application for the [Position] role at [Company Name], and I wanted to follow up to express my continued interest in the position.
  
  I am particularly excited about the opportunity to [specific aspect of the role or company]. With my background in [relevant experience], I believe I can contribute significantly to your team.
  
  I would be grateful for the opportunity to discuss how my skills and experience align with your needs. Please let me know if you need any additional information from me.
  
  Thank you for your time and consideration.
  
  Best regards,
  [Your Name]
  [Your Phone]
  [Your Email]`
      }
    ]
  };