import type { MarketCapTier, StockRiskLevel, StockSector } from '../types/stocks';

export interface StockCompanyDefinition {
  id: string;
  name: string;
  ticker: string;
  sector: StockSector;
  description: string;
  basePrice: number;
  volatility: number;
  trendBias: number;
  marketCapTier: MarketCapTier;
  dividendYield?: number;
  riskLevel: StockRiskLevel;
}

export const STOCK_COMPANY_DEFINITIONS: StockCompanyDefinition[] = [
  { id: 'ionia-brewing', name: 'Ionia Brewing Co.', ticker: 'IBC', sector: 'Beverages', description: 'Regional brewer known for banquet ales and stubborn barrel inspectors.', basePrice: 42, volatility: 1.15, trendBias: 0.02, marketCapTier: 'large', dividendYield: 0.01, riskLevel: 'moderate' },
  { id: 'plymouth-apple', name: 'Plymouth Apple Orchards', ticker: 'PAO', sector: 'Agriculture', description: 'Orchards, cider presses, and seasonal fruit caravans.', basePrice: 28, volatility: 1.25, trendBias: 0.01, marketCapTier: 'mid', riskLevel: 'moderate' },
  { id: 'moonwell-tea', name: 'Moonwell Tea House', ticker: 'MTH', sector: 'Beverages', description: 'Quiet tea rooms with loud expansion plans.', basePrice: 19, volatility: 1.05, trendBias: 0.015, marketCapTier: 'small', dividendYield: 0.006, riskLevel: 'low' },
  { id: 'sunspire-textiles', name: 'Sunspire Textiles', ticker: 'SPT', sector: 'Clothing', description: 'Colorful cloth, uniforms, and festival banners.', basePrice: 33, volatility: 1.2, trendBias: 0.005, marketCapTier: 'mid', riskLevel: 'moderate' },
  { id: 'frostgate-fisheries', name: 'Frostgate Fisheries', ticker: 'FGF', sector: 'Food', description: 'Cold-water fishing fleets and preserved seafood.', basePrice: 24, volatility: 1.35, trendBias: -0.005, marketCapTier: 'small', riskLevel: 'high' },
  { id: 'emberline-rail', name: 'Emberline Rail', ticker: 'ELR', sector: 'Transport', description: 'Passenger and freight rail lines between busy market towns.', basePrice: 76, volatility: 0.9, trendBias: 0.018, marketCapTier: 'large', dividendYield: 0.012, riskLevel: 'low' },
  { id: 'crystal-harbor-shipping', name: 'Crystal Harbor Shipping', ticker: 'CHS', sector: 'Logistics', description: 'Harbor cargo, ship ledgers, and suspiciously punctual dock bells.', basePrice: 61, volatility: 1.05, trendBias: 0.01, marketCapTier: 'large', riskLevel: 'moderate' },
  { id: 'northreach-paperworks', name: 'Northreach Paperworks', ticker: 'NRP', sector: 'Publishing', description: 'Paper mills supplying books, contracts, and stern notices.', basePrice: 22, volatility: 1.15, trendBias: 0.004, marketCapTier: 'mid', riskLevel: 'moderate' },
  { id: 'starfall-lantern', name: 'Starfall Lantern Co.', ticker: 'SLC', sector: 'Home Goods', description: 'Lantern makers popular with inns and late-night accountants.', basePrice: 31, volatility: 1.1, trendBias: 0.012, marketCapTier: 'mid', dividendYield: 0.007, riskLevel: 'low' },
  { id: 'golden-goose-bakery', name: 'Golden Goose Bakery', ticker: 'GGB', sector: 'Food', description: 'Bakery chain famous for honey rolls and aggressive window displays.', basePrice: 27, volatility: 1.0, trendBias: 0.02, marketCapTier: 'mid', riskLevel: 'low' },
  { id: 'velvet-fox-tailors', name: 'Velvet Fox Tailors', ticker: 'VFT', sector: 'Clothing', description: 'High-fashion tailoring for nobles, actors, and confident merchants.', basePrice: 47, volatility: 1.45, trendBias: 0.006, marketCapTier: 'small', riskLevel: 'high' },
  { id: 'bluebell-dairy', name: 'Bluebell Dairy Farms', ticker: 'BDF', sector: 'Agriculture', description: 'Milk, cheese, and milk-adjacent arguments.', basePrice: 21, volatility: 0.95, trendBias: 0.008, marketCapTier: 'mid', dividendYield: 0.008, riskLevel: 'low' },
  { id: 'red-maple-furniture', name: 'Red Maple Furniture', ticker: 'RMF', sector: 'Home Goods', description: 'Tables, chairs, cabinets, and chairs sold as tables.', basePrice: 35, volatility: 1.1, trendBias: 0.006, marketCapTier: 'mid', riskLevel: 'moderate' },
  { id: 'silverfin-markets', name: 'Silverfin Markets', ticker: 'SFM', sector: 'Retail', description: 'General stores with bright counters and ruthless shelf spacing.', basePrice: 54, volatility: 1.0, trendBias: 0.014, marketCapTier: 'large', dividendYield: 0.009, riskLevel: 'low' },
  { id: 'dawnmere-glassworks', name: 'Dawnmere Glassworks', ticker: 'DGW', sector: 'Manufacturing', description: 'Window glass, bottles, lenses, and fragile promises.', basePrice: 39, volatility: 1.25, trendBias: 0.01, marketCapTier: 'mid', riskLevel: 'moderate' },
  { id: 'hollowpeak-resorts', name: 'Hollowpeak Resorts', ticker: 'HPR', sector: 'Travel', description: 'Mountain lodges for travelers who enjoy views and fees.', basePrice: 68, volatility: 1.55, trendBias: 0.004, marketCapTier: 'mid', riskLevel: 'high' },
  { id: 'cloudcap-balloons', name: 'Cloudcap Balloons', ticker: 'CCB', sector: 'Entertainment', description: 'Festival balloon rides with dramatic waivers.', basePrice: 18, volatility: 1.8, trendBias: 0.008, marketCapTier: 'small', riskLevel: 'wild' },
  { id: 'willowbend-books', name: 'Willowbend Books', ticker: 'WBB', sector: 'Publishing', description: 'Bookshops, serialized adventure scrolls, and bookmark monopolies.', basePrice: 26, volatility: 1.15, trendBias: 0.002, marketCapTier: 'small', riskLevel: 'moderate' },
  { id: 'cinderstone-coffee', name: 'Cinderstone Coffee', ticker: 'CSC', sector: 'Beverages', description: 'Strong coffee for weak mornings.', basePrice: 44, volatility: 1.35, trendBias: 0.018, marketCapTier: 'mid', riskLevel: 'moderate' },
  { id: 'rivergate-couriers', name: 'Rivergate Couriers', ticker: 'RGC', sector: 'Logistics', description: 'Fast courier routes, faster excuses.', basePrice: 32, volatility: 1.4, trendBias: 0.01, marketCapTier: 'small', riskLevel: 'high' },
  { id: 'oak-lantern-inns', name: 'Oak & Lantern Inns', ticker: 'OLI', sector: 'Hospitality', description: 'Roadside inns with clean sheets and negotiable stew.', basePrice: 37, volatility: 1.2, trendBias: 0.008, marketCapTier: 'mid', dividendYield: 0.006, riskLevel: 'moderate' },
  { id: 'copperleaf-cosmetics', name: 'Copperleaf Cosmetics', ticker: 'CLC', sector: 'Beauty', description: 'Lotions, powders, and reputation in jars.', basePrice: 52, volatility: 1.5, trendBias: 0.006, marketCapTier: 'mid', riskLevel: 'high' },
  { id: 'snowmelt-ice', name: 'Snowmelt Ice Co.', ticker: 'SIC', sector: 'Utilities', description: 'Ice blocks, cold rooms, and seasonal miracles.', basePrice: 23, volatility: 1.1, trendBias: 0.003, marketCapTier: 'small', dividendYield: 0.01, riskLevel: 'moderate' },
  { id: 'brightpath-academy', name: 'Brightpath Academy', ticker: 'BPA', sector: 'Education', description: 'Private academies for arithmetic, rhetoric, and prestigious uniforms.', basePrice: 58, volatility: 0.85, trendBias: 0.012, marketCapTier: 'large', dividendYield: 0.005, riskLevel: 'low' },
  { id: 'azure-wave-cruises', name: 'Azure Wave Cruises', ticker: 'AWC', sector: 'Travel', description: 'Pleasure cruises with harp music and seasick nobles.', basePrice: 49, volatility: 1.65, trendBias: 0.005, marketCapTier: 'mid', riskLevel: 'high' },
  { id: 'foxglove-apothecary', name: 'Foxglove Apothecary', ticker: 'FGA', sector: 'Health', description: 'Herbal tonics, salves, and careful labels.', basePrice: 63, volatility: 1.35, trendBias: 0.015, marketCapTier: 'large', riskLevel: 'moderate' },
  { id: 'meadowlark-music', name: 'Meadowlark Music', ticker: 'MLM', sector: 'Entertainment', description: 'Instrument makers and traveling performance contracts.', basePrice: 29, volatility: 1.45, trendBias: 0.007, marketCapTier: 'small', riskLevel: 'high' },
  { id: 'crownside-theater', name: 'Crownside Theater Group', ticker: 'CTG', sector: 'Entertainment', description: 'Theaters, touring troupes, and very expensive curtains.', basePrice: 36, volatility: 1.55, trendBias: 0.004, marketCapTier: 'mid', riskLevel: 'high' },
  { id: 'greenhill-grain', name: 'Greenhill Grain Exchange', ticker: 'GGE', sector: 'Agriculture', description: 'Grain warehouses and harvest futures written in flour dust.', basePrice: 41, volatility: 1.05, trendBias: 0.011, marketCapTier: 'large', dividendYield: 0.01, riskLevel: 'low' },
  { id: 'nightjar-candleworks', name: 'Nightjar Candleworks', ticker: 'NJC', sector: 'Home Goods', description: 'Candles, wax seals, and suspiciously calming scents.', basePrice: 17, volatility: 1.2, trendBias: 0.007, marketCapTier: 'small', riskLevel: 'moderate' },
  { id: 'pearl-coast-imports', name: 'Pearl Coast Imports', ticker: 'PCI', sector: 'Retail', description: 'Imported luxuries, tariff complaints, and polished shelves.', basePrice: 73, volatility: 1.4, trendBias: 0.006, marketCapTier: 'large', riskLevel: 'high' },
  { id: 'little-dragon-noodles', name: 'Little Dragon Noodles', ticker: 'LDN', sector: 'Food', description: 'Popular noodle stalls with ambitious broth distribution.', basePrice: 25, volatility: 1.7, trendBias: 0.012, marketCapTier: 'small', riskLevel: 'wild' },
  { id: 'whitecap-laundry', name: 'Whitecap Laundry', ticker: 'WCL', sector: 'Services', description: 'Laundry routes for inns, academies, and anyone near mud.', basePrice: 20, volatility: 0.95, trendBias: 0.006, marketCapTier: 'small', dividendYield: 0.006, riskLevel: 'low' },
  { id: 'dreamroot-toymakers', name: 'Dreamroot Toymakers', ticker: 'DRT', sector: 'Toys', description: 'Wooden toys, puzzle boxes, and seasonal gift surges.', basePrice: 34, volatility: 1.45, trendBias: 0.01, marketCapTier: 'small', riskLevel: 'high' },
  { id: 'blackbird-postal', name: 'Blackbird Postal', ticker: 'BBP', sector: 'Services', description: 'Postal routes with black uniforms and white-knuckle schedules.', basePrice: 46, volatility: 1.05, trendBias: 0.01, marketCapTier: 'mid', dividendYield: 0.008, riskLevel: 'moderate' },
];

export const STOCK_SECTORS = Array.from(new Set(STOCK_COMPANY_DEFINITIONS.map((company) => company.sector))).sort();
