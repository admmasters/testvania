export interface Memory {
  id: string;
  type: string;
  text: string;
  discovered: string;
}

export interface PlayerInput {
  isKeyDown(key: string): boolean;
  isKeyPressed(key: string): boolean;
}
