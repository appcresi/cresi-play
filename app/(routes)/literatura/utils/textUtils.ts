export function splitIntoPages(text: string, charsPerPage: number = 1200): string[] {
    const words = text.split(' ');
    const pages: string[] = [];
    let currentPage = '';
  
    words.forEach(word => {
      const potentialPage = currentPage ? currentPage + ' ' + word : word;
      
      if (potentialPage.length > charsPerPage) {
        pages.push(currentPage);
        currentPage = word;
      } else {
        currentPage = potentialPage;
      }
    });
  
    if (currentPage) {
      pages.push(currentPage);
    }
  
    return pages;
  }