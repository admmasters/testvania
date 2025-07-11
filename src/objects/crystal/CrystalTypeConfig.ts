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

export class CrystalTypeConfig {
  private static readonly CONFIG: Record<CrystalType, CrystalTypeData> = {
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

  static getColors(type: CrystalType): CrystalColors {
    return this.CONFIG[type]?.colors || this.CONFIG.azure.colors;
  }

  static getExperienceValue(type: CrystalType): number {
    return this.CONFIG[type]?.experienceValue || this.CONFIG.azure.experienceValue;
  }

  static getTypeData(type: CrystalType): CrystalTypeData {
    return this.CONFIG[type] || this.CONFIG.azure;
  }

  static getAllTypes(): CrystalType[] {
    return Object.keys(this.CONFIG) as CrystalType[];
  }

  static isValidType(type: string): type is CrystalType {
    return type in this.CONFIG;
  }
}