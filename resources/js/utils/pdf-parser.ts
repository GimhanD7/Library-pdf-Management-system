export function parsePdfFilename(filename: string): { 
    title: string;
    year?: number;
    month?: number;
    day?: number;
    page?: number;
} {
    // Extract year, month, day from filename if present
    const dateMatch = filename.match(/(\d{4})-(\d{2})-(\d{2})/);
    const year = dateMatch?.[1] ? parseInt(dateMatch[1]) : undefined;
    const month = dateMatch?.[2] ? parseInt(dateMatch[2]) : undefined;
    const day = dateMatch?.[3] ? parseInt(dateMatch[3]) : undefined;

    // Extract page number if present
    const pageMatch = filename.match(/-(\d+)(?=\.PDF$)/i);
    const page = pageMatch?.[1] ? parseInt(pageMatch[1]) : undefined;

    // Return the original filename (without .pdf extension) as the title
    const title = filename.replace(/\.pdf$/i, '');

    return {
        title,
        year,
        month,
        day,
        page
    };
}
