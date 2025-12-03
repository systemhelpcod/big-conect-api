export const formatLastActivity = (timestamp: string | number | undefined): string => {
  if (!timestamp) return 'Sem atividade';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Desconhecido';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `${diffMins} min atrás`;
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  // Se for hoje
  if (date.toDateString() === now.toDateString()) {
      return `${hours}:${minutes}`;
  }

  // Se for outro dia
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month} ${hours}:${minutes}`;
};