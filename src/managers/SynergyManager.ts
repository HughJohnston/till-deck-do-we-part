import { SYNERGY_SEQUENCE } from '../config/assetManifest';

export class SynergyManager {
  private collectedIndex = 0;

  get nextLetterNeeded(): string {
    return SYNERGY_SEQUENCE[this.collectedIndex];
  }

  get collectedLetters(): string[] {
    return SYNERGY_SEQUENCE.slice(0, this.collectedIndex) as unknown as string[];
  }

  get progress(): number {
    return this.collectedIndex;
  }

  get isComplete(): boolean {
    return this.collectedIndex >= SYNERGY_SEQUENCE.length;
  }

  get hasMoreLetters(): boolean {
    return this.collectedIndex < SYNERGY_SEQUENCE.length;
  }

  get nextLetterKey(): string | undefined {
    if (!this.hasMoreLetters) return undefined;
    return `synergy-${SYNERGY_SEQUENCE[this.collectedIndex]}`;
  }

  collectLetter(letterKey: string): boolean {
    const letter = letterKey.replace('synergy-', '');
    if (letter === this.nextLetterNeeded) {
      this.collectedIndex++;
      return true;
    }
    return false;
  }

  reset() {
    this.collectedIndex = 0;
  }
}
