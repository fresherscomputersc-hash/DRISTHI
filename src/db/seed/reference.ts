/**
 * Reference data for the synthetic OSRTC network.
 * Scale mirrors published OSRTC figures: 12 depots, ~180 routes, 1,999 vehicles
 * (577 mainline + 1,422 rural), 109 of which are out of service.
 */

export type DepotSeed = {
  id: string;
  name: string;
  region: string;
  district: string;
  regCode: string;
  places: string[];
  /** distance from the depot headquarter to major hubs, used for mainline routes */
  hubs: [string, number][];
};

export const DEPOTS: DepotSeed[] = [
  {
    id: "BBS",
    name: "Bhubaneswar",
    region: "Central",
    district: "Khordha",
    regCode: "33",
    places: [
      "Khordha", "Jatni", "Balipatna", "Begunia", "Bolagarh", "Banpur",
      "Tangi", "Pipili", "Delang", "Gop", "Nimapada",
    ],
    hubs: [
      ["Cuttack", 28], ["Puri", 60], ["Berhampur", 175], ["Sambalpur", 320],
      ["Balasore", 200], ["Angul", 130], ["Dhenkanal", 80], ["Nayagarh", 95],
      ["Jajpur", 120], ["Kendrapara", 150], ["Khordha", 25], ["Rourkela", 410],
    ],
  },
  {
    id: "CTC",
    name: "Cuttack",
    region: "Central",
    district: "Cuttack",
    regCode: "05",
    places: [
      "Athagarh", "Banki", "Baramba", "Niali", "Salepur", "Choudwar",
      "Tigiria", "Narasinghpur", "Mahanga", "Kantapada", "Badamba",
    ],
    hubs: [
      ["Bhubaneswar", 28], ["Puri", 90], ["Berhampur", 160], ["Sambalpur", 290],
      ["Dhenkanal", 55], ["Jagatsinghpur", 70], ["Kendrapara", 85], ["Jajpur", 95],
    ],
  },
  {
    id: "PURI",
    name: "Puri",
    region: "Coastal",
    district: "Puri",
    regCode: "13",
    places: [
      "Konark", "Satyabadi", "Brahmagiri", "Krushnaprasad", "Astaranga",
      "Kakatpur", "Nimapada", "Chandanpur", "Delang", "Pipili", "Gop",
    ],
    hubs: [["Bhubaneswar", 60], ["Cuttack", 90], ["Berhampur", 230]],
  },
  {
    id: "BAM",
    name: "Berhampur",
    region: "South",
    district: "Ganjam",
    regCode: "07",
    places: [
      "Chhatrapur", "Hinjilicut", "Bhanjanagar", "Aska", "Digapahandi",
      "Kodala", "Polasara", "Sorada", "Purushotampur", "Khalikote", "Buguda",
    ],
    hubs: [
      ["Bhubaneswar", 175], ["Cuttack", 160], ["Rayagada", 220], ["Koraput", 340],
      ["Phulbani", 210], ["Gajapati", 350],
    ],
  },
  {
    id: "SBP",
    name: "Sambalpur",
    region: "West",
    district: "Sambalpur",
    regCode: "15",
    places: [
      "Hirakud", "Burla", "Rairakhol", "Kuchinda", "Jamankira", "Dhama",
      "Maneswar", "Jujomura", "Naktideul", "Rengali", "Laida",
    ],
    hubs: [
      ["Bhubaneswar", 320], ["Rourkela", 180], ["Bolangir", 120], ["Jharsuguda", 50],
      ["Deogarh", 90], ["Sonepur", 140], ["Boudh", 160],
    ],
  },
  {
    id: "ROU",
    name: "Rourkela",
    region: "North-West",
    district: "Sundargarh",
    regCode: "14",
    places: [
      "Rajgangpur", "Biramitrapur", "Sundargarh", "Koida", "Lahunipara",
      "Bonai", "Hemgiri", "Bisra", "Kuarmunda", "Tangarpali", "Lephripara",
    ],
    hubs: [["Sambalpur", 180], ["Bhubaneswar", 410], ["Jharsuguda", 130]],
  },
  {
    id: "BLS",
    name: "Balasore",
    region: "Coastal",
    district: "Balasore",
    regCode: "01",
    places: [
      "Jaleswar", "Soro", "Nilagiri", "Basta", "Bhograi", "Remuna",
      "Simulia", "Bahanaga", "Khaira", "Oupada", "Baliapal",
    ],
    hubs: [["Bhubaneswar", 200], ["Cuttack", 170], ["Baripada", 70], ["Bhadrak", 75]],
  },
  {
    id: "BPO",
    name: "Baripada",
    region: "North",
    district: "Mayurbhanj",
    regCode: "11",
    places: [
      "Rairangpur", "Karanjia", "Udala", "Betanati", "Badasahi", "Rasgovindpur",
      "Morada", "Suliapada", "Saraskana", "Jamda", "Bahalda",
    ],
    hubs: [["Balasore", 70], ["Bhubaneswar", 260], ["Keonjhar", 120]],
  },
  {
    id: "KPT",
    name: "Koraput",
    region: "South",
    district: "Koraput",
    regCode: "10",
    places: [
      "Jeypore", "Kotpad", "Boipariguda", "Semiliguda", "Pottangi", "Nandapur",
      "Lamtaput", "Dasmantpur", "Borigumma", "Kundra", "Bandhugaon",
    ],
    hubs: [["Berhampur", 340], ["Rayagada", 120], ["Malkangiri", 190], ["Nabarangpur", 130]],
  },
  {
    id: "KJR",
    name: "Keonjhar",
    region: "North",
    district: "Keonjhar",
    regCode: "09",
    places: [
      "Champua", "Barbil", "Joda", "Anandapur", "Ghatgaon", "Patana",
      "Telkoi", "Harichandanpur", "Banspal", "Saharpada", "Jhumpura",
    ],
    hubs: [["Bhubaneswar", 250], ["Baripada", 120], ["Angul", 150]],
  },
  {
    id: "ANG",
    name: "Angul",
    region: "Central",
    district: "Angul",
    regCode: "19",
    places: [
      "Talcher", "Pallahara", "Athmallik", "Chhendipada", "Banarpal",
      "Kishorenagar", "Kaniha", "Bantala", "Nalco Nagar", "Kosala", "Thakurgarh",
    ],
    hubs: [["Bhubaneswar", 130], ["Cuttack", 100], ["Sambalpur", 160], ["Dhenkanal", 55]],
  },
  {
    id: "BHC",
    name: "Bhadrak",
    region: "Coastal",
    district: "Bhadrak",
    regCode: "22",
    places: [
      "Chandbali", "Basudevpur", "Dhamnagar", "Bhandaripokhari", "Tihidi",
      "Bant", "Bonth", "Dhamara", "Randia", "Asurali", "Naikanidihi",
    ],
    hubs: [["Balasore", 75], ["Bhubaneswar", 145], ["Jajpur", 60]],
  },
];

export const VEHICLE_MODELS = [
  { model: "Ashok Leyland Viking", capacity: 52, routeType: "mainline" as const, premium: false },
  { model: "Tata Starbus Ultra", capacity: 44, routeType: "mainline" as const, premium: false },
  { model: "Ashok Leyland Oyster", capacity: 40, routeType: "mainline" as const, premium: false },
  { model: "Volvo 9400 B11R", capacity: 45, routeType: "mainline" as const, premium: true },
  { model: "Tata LPS 1612", capacity: 52, routeType: "mainline" as const, premium: false },
  { model: "Eicher Skyline Pro", capacity: 40, routeType: "rural" as const, premium: false },
  { model: "Ashok Leyland Falcon", capacity: 32, routeType: "rural" as const, premium: false },
  { model: "Tata Winger", capacity: 17, routeType: "rural" as const, premium: false },
];

export const FAULT_CODES = [
  { code: "BRK-201", label: "Brake pad wear beyond limit", severity: "high" as const },
  { code: "ENG-114", label: "Coolant temperature anomaly", severity: "critical" as const },
  { code: "TRN-330", label: "Gearbox oil leak", severity: "medium" as const },
  { code: "SUS-088", label: "Rear suspension bush worn", severity: "medium" as const },
  { code: "ELC-410", label: "Alternator output low", severity: "low" as const },
  { code: "TYR-015", label: "Uneven tyre wear", severity: "low" as const },
  { code: "CLT-502", label: "Clutch plate slipping", severity: "high" as const },
  { code: "STR-072", label: "Steering play above tolerance", severity: "high" as const },
];

export const ASSIGNEES = [
  "R. Mohapatra (Finance)",
  "S. Patnaik (Revenue Audit)",
  "B. Das (Depot BBS)",
  "A. Behera (Depot CTC)",
  "M. Sahu (Maintenance)",
];
