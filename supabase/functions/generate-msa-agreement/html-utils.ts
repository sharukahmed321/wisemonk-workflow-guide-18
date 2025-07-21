
export const htmlToPlainText = (html: string): string => {
  if (!html) return '';
  
  // Remove HTML tags and decode entities
  let text = html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&')  // Replace HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Clean up extra whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  return text;
};

export const cleanText = (text: string): string => {
  if (!text) return '';
  
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\r/g, '\n')   // Convert remaining \r to \n
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
    .replace(/[ \t]+$/gm, '') // Remove trailing whitespace
    .trim();
};
