import type { CraftableCategory, MaterialKey } from '../types/game';

export const NEWS_EVENT_INTERVAL_MS = 180_000;
export const INITIAL_NEWS_EVENT_DELAY_MS = 30_000;
export const NEWS_EVENT_TICK_MS = 1_000;
export const MAX_ACTIVE_NEWS_EVENTS = 3;
export const NEWS_HISTORY_LIMIT = 30;

export const FICTIONAL_KINGDOMS = [
  'Ashenford',
  'Moonmere',
  'Coppervale',
  'Brindlekeep',
  'Northreach',
  'Embermarch',
  'Frostglen',
  'Gilded Hollow',
];

export const FICTIONAL_COMPANIES = [
  'Moonfall Tools',
  'ThunderPick Outfitters',
  'Brass Badger Foundry',
  'Cinder & Sons',
  'Cloudcap Imports',
  'Definitely Safe Devices',
  'Owlglass Trading',
  'Wobblecart Wholesale',
];

export const FICTIONAL_MARKETS = [
  'Eastern Forge',
  'Tinbell Bazaar',
  'Lowgate Market',
  'Dragonwharf Exchange',
  'Anvil Row',
  'Westwick Night Market',
];

export const FICTIONAL_GUILDS = [
  'Red Banner Guild',
  'Polished Hammer Society',
  'Quiet Tongs League',
  'Blue Apron Smiths',
  'Lantern Ledger Guild',
  'Order of Very Certain Appraisers',
];

export const FICTIONAL_DISASTERS = [
  'Great Emberwood Fire',
  'Sootfall Storm',
  'Molequake',
  'Cursed Rain Week',
  'Wagon Wheel Shortage',
  'Unscheduled Volcano Mood',
];

export const FICTIONAL_NEWSPAPERS = [
  'The Anvil Gazette',
  'Forgefront Daily',
  'The Bellows Bulletin',
  'Market Crier Illustrated',
  'The Hammer & Quill',
  'The Coalpit Chronicle',
];

export const FICTIONAL_PRODUCTS = [
  'ThunderPick 9000',
  'Miracle Haft Wax',
  'Pocket Bellows',
  'Royal-Grade Tin Sword',
  'Self-Sharpening Spoonblade',
  'Discount Dragonproof Buckle',
];

export const NEWS_CATEGORIES: CraftableCategory[] = ['tools', 'melee', 'ranged', 'armor', 'accessories'];

export const NEWS_RESOURCES: MaterialKey[] = [
  'wood',
  'stone',
  'copper',
  'iron',
  'gold',
  'emerald',
  'diamond',
  'ruby',
  'mithril',
];
