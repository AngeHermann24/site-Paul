/**
 * Horaires réels de la salle. Affichés tant qu'aucun créneau réel (non DEMO)
 * n'est publié depuis l'admin (`gym_schedules`). Jours ISO : 1 = lundi … 7 = dimanche.
 */
export interface LocalGymClass {
  id: string;
  label: { fr: string; en: string };
  slots: ReadonlyArray<{ days: readonly number[]; startsAt: string; endsAt: string }>;
}

export const GYM_CLASSES: readonly LocalGymClass[] = [
  {
    id: 'boxe-anglaise-adultes',
    label: { fr: 'Boxe anglaise — adultes', en: 'Boxing — adults' },
    slots: [
      { days: [1, 2, 3, 4, 5], startsAt: '18:30', endsAt: '20:00' },
      { days: [6], startsAt: '08:00', endsAt: '09:30' },
    ],
  },
  {
    id: 'boxe-educative',
    label: { fr: 'Boxe éducative', en: 'Educational boxing' },
    slots: [
      { days: [3], startsAt: '16:45', endsAt: '17:45' },
      { days: [6], startsAt: '09:30', endsAt: '10:30' },
    ],
  },
];
