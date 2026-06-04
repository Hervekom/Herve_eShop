import { Laptop } from './types';

export const INITIAL_LAPTOPS: Laptop[] = [
  {
    id: 'macm3-01',
    brand: 'Apple',
    model: 'MacBook Pro 14"',
    processor: 'Apple M3 Pro (11-Core CPU, 14-Core GPU)',
    ram: '18GB Unified',
    storage: '512GB SSD SuperFast',
    screenSize: '14.2" Liquid Retina XDR',
    condition: 'Comme neuf',
    source: 'USA',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=1000',
    price: 1350000, // FCFA (Approx 2200 USD)
    stockQuantity: 4,
    status: 'Disponible',
    description: 'Une bête de course pour les créateurs de contenu et développeurs. Importé directement de la Silicon Valley, état esthétique et de batterie exceptionnel (100% de santé).',
    category: 'Ultrabook'
  },
  {
    id: 'xps15-02',
    brand: 'Dell',
    model: 'XPS 15 9530',
    processor: 'Intel Core i7-13700H (14 Cores, up to 5.0 GHz)',
    ram: '32GB DDR5',
    storage: '1TB NVMe PCIe Gen4',
    screenSize: '15.6" OLED 3.5K Tactile',
    condition: 'Comme neuf',
    source: 'Europe',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=1000',
    price: 1100000, // FCFA
    stockQuantity: 3,
    status: 'Disponible',
    description: 'L\'excellence des PC Windows sous son meilleur jour. Écran OLED immersif à couper le souffle, idéal pour la retouche photo professionnelle et les cadres exécutifs.',
    category: 'Ultrabook'
  },
  {
    id: 't14-03',
    brand: 'Lenovo',
    model: 'ThinkPad T14 Gen 4',
    processor: 'AMD Ryzen 7 Pro 7840U (8 Cores, 16 Threads)',
    ram: '32GB LPDDR5',
    storage: '512GB SSD NVMe',
    screenSize: '14.0" WUXGA IPS Anti-reflets',
    condition: 'Excellent',
    source: 'USA',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=1000',
    price: 750000, // FCFA
    stockQuantity: 6,
    status: 'Disponible',
    description: 'La référence absolue en matière de durabilité professionnelle. Performance graphique Radeon intégrée exceptionnelle, clavier légendaire ultra-confortable et autonomie record.',
    category: 'Bureautique'
  },
  {
    id: 'elite-04',
    brand: 'HP',
    model: 'EliteBook 840 G9',
    processor: 'Intel Core i5-1245U vPro',
    ram: '16GB DDR5',
    storage: '512GB NVMe SSD',
    screenSize: '14.0" WUXGA IPS Matte',
    condition: 'Très bon état',
    source: 'Europe',
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&q=80&w=1000',
    price: 490000, // FCFA
    stockQuantity: 2,
    status: 'Disponible',
    description: 'Châssis entièrement en aluminium brossé ultra-léger et sécurisé. Parfait pour les déplacements commerciaux, la bureautique avancée et l\'enseignement supérieur.',
    category: 'Bureautique'
  },
  {
    id: 'rog-05',
    brand: 'Asus',
    model: 'ROG Zephyrus G14',
    processor: 'AMD Ryzen 9 7940HS / RTX 4060 8GB',
    ram: '16GB DDR5 Dual Channel',
    storage: '1TB SSD Gen4',
    screenSize: '14.0" QHD+ 165Hz ROG Nebula',
    condition: 'Comme neuf',
    source: 'Asia',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=1000',
    price: 1250000, // FCFA
    stockQuantity: 1,
    status: 'Arrivage imminent',
    description: 'L\'un des meilleurs ordinateurs portables de jeu et de création ultra-portables au monde. Importé d\'Asie, écran Nebula certifié Pantone d\'une fluidité absolue.',
    category: 'Gaming'
  },
  {
    id: 'macair-06',
    brand: 'Apple',
    model: 'MacBook Air 13" M2',
    processor: 'Apple M2 (8-Core CPU, 8-Core GPU)',
    ram: '8GB Unified',
    storage: '256GB SSD',
    screenSize: '13.6" Liquid Retina',
    condition: 'Excellent',
    source: 'USA',
    image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&q=80&w=1000',
    price: 780000, // FCFA
    stockQuantity: 0,
    status: 'Rupture',
    description: 'Finesse extrême, silence de fonctionnement absolu (conception sans ventilateur) et couleur Minuit élégante. Surtout apprécié pour le style de vie et la productivité nomade.',
    category: 'Ultrabook'
  }
];

export const CAMEROON_CITIES = [
  'Douala',
  'Yaoundé',
  'Garoua',
  'Bafoussam',
  'Bamenda',
  'Maroua',
  'Ngaoundéré',
  'Kribi',
  'Limbe',
  'Buea',
  'Dschang'
];
