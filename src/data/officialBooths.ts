import { PollingBooth } from '../types';
import { ALL_124_VILLAGES } from './officialVillages';

// Generate 262 official polling booths for Sindhanur AC-58
export const ALL_262_POLLING_BOOTHS: PollingBooth[] = Array.from({ length: 262 }, (_, index) => {
  const boothNumber = index + 1;
  const id = `PB-${String(boothNumber).padStart(3, '0')}`;

  // Distribute across villages
  let villageObj = ALL_124_VILLAGES[index % ALL_124_VILLAGES.length];
  // Allocate first 35 booths to Sindhanur City / Town Wards
  if (boothNumber <= 35) {
    villageObj = ALL_124_VILLAGES.find((v) => v.name.includes('Sindhanur')) || ALL_124_VILLAGES[0];
  }

  const wingTypes = ['East Wing', 'West Wing', 'North Wing', 'South Wing', 'Central Wing', 'Main Building'];
  const schoolTypes = [
    'Government Higher Primary School',
    'Government Model Primary School',
    'Government High School',
    'Government Urdu Primary School',
    'Gram Panchayat Sabha Bhavana',
    'Community Hall (Samudaya Bhavana)',
    'Anganwadi Kendra No. 1',
    'Government Composite Junior College',
  ];

  const wing = wingTypes[boothNumber % wingTypes.length];
  const schoolType = schoolTypes[(boothNumber * 3) % schoolTypes.length];
  const boothName = `${schoolType}, ${villageObj.name} (${wing})`;
  const buildingName = `Room No. ${(boothNumber % 4) + 1}, ${schoolType}`;

  // Deterministic realistic voter counts
  const baseVoters = 680 + ((boothNumber * 19) % 480);
  const male = Math.round(baseVoters * 0.51);
  const female = baseVoters - male - ((boothNumber % 3 === 0) ? 1 : 0);
  const other = baseVoters - male - female;

  const coordinatorFirstNames = [
    'Basavaraj', 'Sharanappa', 'Veeresh', 'Mallikarjun', 'Hanumanthappa',
    'Goudappa', 'Eshwarappa', 'Prabhakar', 'Manjunath', 'Somashekhar',
    'Pampapathi', 'Nagaraj', 'Rudrappa', 'Chandrashekhar', 'Anand'
  ];
  const coordinatorLastNames = ['Patil', 'Gowda', 'Nayak', 'Hiremath', 'Badarli', 'Kambali', 'Desai', 'Kuruba'];
  const coordName = `${coordinatorFirstNames[boothNumber % coordinatorFirstNames.length]} ${coordinatorLastNames[(boothNumber * 2) % coordinatorLastNames.length]}`;
  const coordPhone = `+91 9448${String((boothNumber * 37) % 90000 + 10000).padStart(5, '0')}`;

  const isSensitive = boothNumber % 17 === 0;

  return {
    id,
    boothNumber,
    boothName,
    village: villageObj.name,
    gramPanchayat: villageObj.gramPanchayat,
    buildingName,
    votersCount: baseVoters,
    maleVoters: male,
    femaleVoters: female,
    otherVoters: other,
    coordinatorName: coordName,
    coordinatorPhone: coordPhone,
    volunteersCount: 4 + (boothNumber % 5),
    lastFieldVisitDate: `2025-02-${String((boothNumber % 24) + 1).padStart(2, '0')}`,
    status: isSensitive ? 'Sensitive' : 'Active',
  };
});
