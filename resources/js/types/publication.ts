export interface PublicationFile {
    name: string;
    path: string;
    date: string;
    month: string;
    year: string;
}

export interface PublicationMonth {
    name: string;
    path: string;
    year: string;
    days: {
        date: string;
        files: PublicationFile[];
    }[];
}
