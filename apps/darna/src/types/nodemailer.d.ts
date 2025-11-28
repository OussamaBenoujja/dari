declare module "nodemailer" {
  export interface SendMailOptions {
    from?: string;
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
  }

  export interface Transporter {
    sendMail(options: SendMailOptions): Promise<unknown>;
  }

  interface CreateTransportOptions {
    host: string;
    port: number;
    secure: boolean;
    auth?: {
      user: string;
      pass: string;
    };
  }

  const nodemailer: {
    createTransport(options: CreateTransportOptions): Transporter;
  } & ((options: CreateTransportOptions) => Transporter);

  export const createTransport: (options: CreateTransportOptions) => Transporter;
  export default nodemailer;
}
