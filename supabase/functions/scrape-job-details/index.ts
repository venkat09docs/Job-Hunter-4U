import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobUrl } = await req.json();
    console.log('Scraping job URL:', jobUrl);

    if (!jobUrl) {
      throw new Error('Job URL is required');
    }

    // Fetch the job page content
    const response = await fetch(jobUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch job page: ${response.statusText}`);
    }

    const html = await response.text();
    console.log('HTML fetched, length:', html.length);

    // Extract job details using regex and text parsing
    const jobDetails = {
      companyDetails: extractCompanyDetails(html),
      jobDescription: extractJobDescription(html),
      keySkills: extractKeySkills(html),
      location: extractLocation(html),
      contactDetails: extractContactDetails(html),
      url: jobUrl
    };

    console.log('Extracted job details:', jobDetails);

    return new Response(
      JSON.stringify({ success: true, data: jobDetails }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error scraping job details:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        data: null 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

function extractCompanyDetails(html: string): string {
  // Try multiple patterns for company name
  const patterns = [
    /<meta property="og:site_name" content="([^"]+)"/i,
    /<span[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/span>/i,
    /<div[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/div>/i,
    /<h2[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/h2>/i,
    /Company:\s*([^\n<]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return cleanText(match[1]);
    }
  }

  return 'Company information not available';
}

function extractJobDescription(html: string): string {
  // Try multiple patterns for job description
  const patterns = [
    /<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]{100,5000}?)<\/div>/i,
    /<section[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]{100,5000}?)<\/section>/i,
    /<div[^>]*id="job-details"[^>]*>([\s\S]{100,5000}?)<\/div>/i,
    /<article[^>]*>([\s\S]{100,5000}?)<\/article>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return cleanHtml(match[1]);
    }
  }

  // Fallback: extract text between common markers
  const bodyMatch = html.match(/<body[^>]*>([\s\S]+)<\/body>/i);
  if (bodyMatch) {
    const bodyText = cleanHtml(bodyMatch[1]);
    if (bodyText.length > 100) {
      return bodyText.substring(0, 1000) + '...';
    }
  }

  return 'Job description not available';
}

function extractKeySkills(html: string): string[] {
  const skills: string[] = [];
  
  // Common tech skills and keywords to look for
  const commonSkills = [
    'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'SQL', 'NoSQL', 'MongoDB',
    'PostgreSQL', 'Redis', 'GraphQL', 'REST API', 'Microservices', 'Agile',
    'Git', 'CI/CD', 'DevOps', 'Machine Learning', 'AI', 'Data Science',
    'Angular', 'Vue.js', 'Express', 'Django', 'Flask', 'Spring Boot',
    'Communication', 'Leadership', 'Problem Solving', 'Team Work', 'Analytical'
  ];

  const lowerHtml = html.toLowerCase();
  
  for (const skill of commonSkills) {
    if (lowerHtml.includes(skill.toLowerCase())) {
      skills.push(skill);
    }
  }

  // Look for skills in lists
  const skillListPattern = /<ul[^>]*class="[^"]*skills[^"]*"[^>]*>([\s\S]*?)<\/ul>/gi;
  const skillListMatch = html.match(skillListPattern);
  
  if (skillListMatch) {
    skillListMatch.forEach(list => {
      const liPattern = /<li[^>]*>([^<]+)<\/li>/gi;
      let match;
      while ((match = liPattern.exec(list)) !== null) {
        const skill = cleanText(match[1]);
        if (skill && !skills.includes(skill)) {
          skills.push(skill);
        }
      }
    });
  }

  return skills.slice(0, 10); // Return top 10 skills
}

function extractLocation(html: string): string {
  const patterns = [
    /<meta property="og:location" content="([^"]+)"/i,
    /<span[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/span>/i,
    /<div[^>]*class="[^"]*location[^"]*"[^>]*>([^<]+)<\/div>/i,
    /Location:\s*([^\n<]+)/i,
    /<i[^>]*class="[^"]*map-marker[^"]*"[^>]*><\/i>\s*([^<]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return cleanText(match[1]);
    }
  }

  return 'Location not specified';
}

function extractContactDetails(html: string): { email?: string; phone?: string } {
  const contactDetails: { email?: string; phone?: string } = {};

  // Extract email
  const emailPattern = /[\w.-]+@[\w.-]+\.\w+/gi;
  const emailMatch = html.match(emailPattern);
  if (emailMatch && emailMatch.length > 0) {
    // Filter out common non-contact emails
    const filteredEmails = emailMatch.filter(email => 
      !email.includes('example.com') && 
      !email.includes('domain.com') &&
      !email.includes('test.com')
    );
    if (filteredEmails.length > 0) {
      contactDetails.email = filteredEmails[0];
    }
  }

  // Extract phone
  const phonePatterns = [
    /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
  ];

  for (const pattern of phonePatterns) {
    const phoneMatch = html.match(pattern);
    if (phoneMatch && phoneMatch.length > 0) {
      contactDetails.phone = phoneMatch[0];
      break;
    }
  }

  return contactDetails;
}

function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
