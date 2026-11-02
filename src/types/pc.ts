/**
 * What the user told us about their machine.
 * Every field is optional on purpose: people often name only one part
 * ("Will Hades run on a GTX 1050 Ti?").
 */
export interface UserPcSpecs {
  cpu?: string;
  gpu?: string;
  ramGB?: number;
  storageGB?: number;
}
