export interface IEmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface IEmailSender {
  send(message: IEmailMessage): Promise<void>;
}

export const EMAIL_SENDER = Symbol('EMAIL_SENDER');
