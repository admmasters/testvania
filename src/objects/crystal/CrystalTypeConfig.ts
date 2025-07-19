export type CrystalType = "azure" | "amethyst" | "emerald" | "golden";

export interface CrystalColors {
  primary: string;
  secondary: string;
  glow: string;
}

export interface CrystalTypeData {
  colors: CrystalColors;
  experienceValue: number;
}

// Crystal configuration data
const CRYSTAL_CONFIG: Record<CrystalType, CrystalTypeData> = {
  azure: {
    colors: { primary: "#4169E1", secondary: "#87CEEB", glow: "#00BFFF" },
    experienceValue: 5
  },
  amethyst: {
    colors: { primary: "#9966CC", secondary: "#DA70D6", glow: "#FF00FF" },
    experienceValue: 10
  },
  emerald: {
    colors: { primary: "#50C878", secondary: "#98FB98", glow: "#00FF7F" },
    experienceValue: 15
  },
  golden: {
    colors: { primary: "#FFD700", secondary: "#FFF8DC", glow: "#FFFF00" },
    experienceValue: 25
  }
};

// Type safety utilities
export function isValidCrystalType(type: string): type is CrystalType {
  return type in CRYSTAL_CONFIG;
}

export function toCrystalType(type: string): CrystalType {
  return isValidCrystalType(type) ? type : "azure";
}

// Utility functions to replace static class methods
export function getCrystalColors(type: CrystalType): CrystalColors {
  return CRYSTAL_CONFIG[type]?.colors || CRYSTAL_CONFIG.azure.colors;
}

export function getCrystalExperienceValue(type: CrystalType): number {
  return CRYSTAL_CONFIG[type]?.experienceValue || CRYSTAL_CONFIG.azure.experienceValue;
}

export function getCrystalTypeData(type: CrystalType): CrystalTypeData {
  return CRYSTAL_CONFIG[type] || CRYSTAL_CONFIG.azure;
}

export function getAllCrystalTypes(): CrystalType[] {
  return Object.keys(CRYSTAL_CONFIG) as CrystalType[];
}

