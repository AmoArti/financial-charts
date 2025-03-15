// src/utils/utils.ts
export const formatQuarter = (dateString: string): string => {
    const [year, month] = dateString.split('-');
    const quarter = Math.ceil(parseInt(month) / 3);
    return `Q${quarter} ${year}`;
  };
  
  export const getLast10Years = (): number[] => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - 9 + i);
  };