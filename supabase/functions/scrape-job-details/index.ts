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
    console.log('Starting job scraping for URL:', jobUrl);

    if (!jobUrl) {
      console.error('No job URL provided');
      throw new Error('Job URL is required');
    }

    console.log('Fetching job page...');
    // Fetch the job page content with retry logic
    let response;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        response = await fetch(jobUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          redirect: 'follow'
        });
        
        console.log('Fetch response status:', response.status);
        console.log('Fetch response status text:', response.statusText);
        
        if (response.ok) {
          break;
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
          console.log(`Retry ${retryCount}/${maxRetries} after status ${response.status}`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      } catch (fetchError) {
        console.error(`Fetch attempt ${retryCount + 1} failed:`, fetchError);
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to fetch after ${maxRetries} attempts: ${fetchError.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Failed to fetch job page: ${response?.status} ${response?.statusText}`);
    }

    const html = await response.text();
    console.log('HTML fetched successfully, length:', html.length);

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
      const cleaned = cleanText(match[1]);
      if (cleaned && cleaned.length > 0) {
        return cleaned;
      }
    }
  }

  return '';
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
      const cleaned = cleanHtml(match[1]);
      if (cleaned && cleaned.length > 100) {
        return cleaned;
      }
    }
  }

  return '';
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
      const cleaned = cleanText(match[1]);
      if (cleaned && cleaned.length > 0) {
        return cleaned;
      }
    }
  }

  return '';
}

function extractContactDetails(html: string): { email?: string; phone?: string } {
  const contactDetails: { email?: string; phone?: string } = {};

  // Extract email - only real contact emails
  const emailPattern = /[\w.-]+@[\w.-]+\.\w+/gi;
  const emailMatch = html.match(emailPattern);
  if (emailMatch && emailMatch.length > 0) {
    // Filter out common non-contact emails and generic ones
    const filteredEmails = emailMatch.filter(email => {
      const lower = email.toLowerCase();
      return !lower.includes('example.com') && 
             !lower.includes('domain.com') &&
             !lower.includes('test.com') &&
             !lower.includes('noreply') &&
             !lower.includes('no-reply') &&
             !lower.includes('@w3.org') &&
             !lower.includes('@schema.org') &&
             lower.length > 5; // Must have reasonable length
    });
    if (filteredEmails.length > 0) {
      contactDetails.email = filteredEmails[0];
    }
  }

  // Extract phone - be more strict
  const phonePatterns = [
    /(?:tel:|phone:|call:)\s*(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/gi,
    /contact.*?(\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/gi,
  ];

  for (const pattern of phonePatterns) {
    const phoneMatch = html.match(pattern);
    if (phoneMatch && phoneMatch.length > 0) {
      contactDetails.phone = phoneMatch[1] || phoneMatch[0];
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
