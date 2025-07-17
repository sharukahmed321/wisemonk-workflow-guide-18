export interface PublicHoliday {
  id: string;
  name: string;
  date: string;
  type: 'National' | 'Regional' | 'Religious';
  description?: string;
}

export const publicHolidays2024: PublicHoliday[] = [
  // Remaining 2024 holidays
  {
    id: 'diwali-2024',
    name: 'Diwali',
    date: '2024-11-01',
    type: 'National',
    description: 'Festival of Lights'
  },
  {
    id: 'bhai-dooj-2024',
    name: 'Bhai Dooj',
    date: '2024-11-03',
    type: 'Regional',
    description: 'Brother-Sister festival'
  },
  {
    id: 'guru-nanak-jayanti-2024',
    name: 'Guru Nanak Jayanti',
    date: '2024-11-15',
    type: 'National',
    description: 'Birth of Guru Nanak'
  },
  {
    id: 'christmas-2024',
    name: 'Christmas Day',
    date: '2024-12-25',
    type: 'National',
    description: 'Birth of Jesus Christ'
  }
];

export const publicHolidays2025: PublicHoliday[] = [
  {
    id: 'new-year-2025',
    name: 'New Year\'s Day',
    date: '2025-01-01',
    type: 'National',
    description: 'Beginning of the Gregorian calendar year'
  },
  {
    id: 'republic-day-2025',
    name: 'Republic Day',
    date: '2025-01-26',
    type: 'National',
    description: 'Constitution of India came into effect'
  },
  {
    id: 'maha-shivratri-2025',
    name: 'Maha Shivratri',
    date: '2025-02-26',
    type: 'National',
    description: 'Great Night of Shiva'
  },
  {
    id: 'holi-2025',
    name: 'Holi',
    date: '2025-03-14',
    type: 'National',
    description: 'Festival of Colors'
  },
  {
    id: 'good-friday-2025',
    name: 'Good Friday',
    date: '2025-04-18',
    type: 'National',
    description: 'Crucifixion of Jesus Christ'
  },
  {
    id: 'ram-navami-2025',
    name: 'Ram Navami',
    date: '2025-04-06',
    type: 'Regional',
    description: 'Birth of Lord Rama'
  },
  {
    id: 'independence-day-2025',
    name: 'Independence Day',
    date: '2025-08-15',
    type: 'National',
    description: 'Independence from British rule'
  },
  {
    id: 'gandhi-jayanti-2025',
    name: 'Gandhi Jayanti',
    date: '2025-10-02',
    type: 'National',
    description: 'Birth of Mahatma Gandhi'
  },
  {
    id: 'diwali-2025',
    name: 'Diwali',
    date: '2025-10-20',
    type: 'National',
    description: 'Festival of Lights'
  }
];

export const getAllPublicHolidays = (): PublicHoliday[] => {
  return [...publicHolidays2024, ...publicHolidays2025].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};

export const getUpcomingHolidays = (limit: number = 5): PublicHoliday[] => {
  const today = new Date();
  const upcoming = getAllPublicHolidays().filter(holiday => 
    new Date(holiday.date) >= today
  );
  return upcoming.slice(0, limit);
};