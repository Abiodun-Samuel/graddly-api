/** Variables merged into every email template (layouts + bodies). */
export interface IEmailLayoutContext {
  appName: string;
  copyrightYear: number;
  supportUrl?: string;
  privacyUrl?: string;
}
