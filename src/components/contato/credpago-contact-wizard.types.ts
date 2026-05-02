export type ContactWizardStep = 0 | 1 | 2 | 3 | 4;

export type OptionItem = {
  label: string;
  value: string;
};

export type ContactWizardStepMeta = {
  title: string;
  subtitle: string;
};

export type ContactWizardData = {
  name: string;
  company: string;
  website: string;
  segment: string;
  salesChannel: string;
  operationModel: string;
  transactionsVolume: string;
  revenueVolume: string;
  ticketAverage: string;
  mainPain: string;
  lossStage: string;
  urgency: string;
  corporateEmail: string;
  whatsapp: string;
  improvementGoal: string;
};

export type ContactWizardErrors = Partial<Record<keyof ContactWizardData, string>>;
