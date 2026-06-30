import type { ContractClientType } from '../types/contracts';

export interface ContractClient {
  name: string;
  type: ContractClientType;
}

export const CONTRACT_CLIENTS: ContractClient[] = [
  { name: 'Emberfall Kingdom', type: 'kingdom' },
  { name: 'Northreach Mining Union', type: 'guild' },
  { name: 'Moonfall Trading Co.', type: 'company' },
  { name: 'Red Anvil Guild', type: 'guild' },
  { name: 'Silver Coast Republic', type: 'republic' },
  { name: 'Blackstone Arsenal', type: 'military' },
  { name: 'Iron Valley Workers League', type: 'guild' },
  { name: 'Crystal Harbor Merchants', type: 'merchant' },
  { name: 'Sunspire Defense Council', type: 'military' },
  { name: 'Frostgate Expedition', type: 'research' },
  { name: 'Obsidian Crown Bureau', type: 'kingdom' },
  { name: 'Starforge Logistics', type: 'company' },
  { name: 'Dawnmere Republic', type: 'republic' },
  { name: 'Hollowpeak Mining Board', type: 'guild' },
  { name: 'Guild of Brass Lanterns', type: 'guild' },
];

export const CONTRACT_TYPES = [
  'Military supply order',
  'Mining tool order',
  'Royal tournament order',
  'Emergency disaster relief order',
  'Merchant export order',
  'Guild challenge order',
  'Festival decoration order',
  'Monster defense order',
  'Experimental prototype order',
  'Frontier settlement order',
  'Secret royal commission',
  'Trade convoy supply order',
] as const;

export const CONTRACT_FLAVOR_LINES = [
  'The wax seal is still warm and the clerk looks nervous.',
  'Payment is guaranteed by three signatures and one very shiny stamp.',
  'The client insists the deadline is generous. It is not.',
  'A courier dropped this order, bowed twice, and sprinted away.',
  'The posting smells faintly of ink, ambition, and expensive mistakes.',
  'Someone underlined the penalty clause several times.',
];
