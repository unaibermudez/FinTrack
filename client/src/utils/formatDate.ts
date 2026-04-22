export const formatDate = (date: string | Date): string =>
  new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(date));

export const toInputDate = (date: string | Date): string =>
  new Date(date).toISOString().split('T')[0];
