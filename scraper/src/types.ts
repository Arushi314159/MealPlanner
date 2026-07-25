export type SpecialItem = {
  id: string;
  name: string;
  size: string;
  wasPrice: number | null;
  specialPrice: number;
  saveText: string;
  unitPrice: string;
  imageUrl: string;
};

export type SpecialsData = {
  scrapedAt: string;
  items: SpecialItem[];
};
