import type { ContactWizardStepMeta, OptionItem } from "@/components/contato/credpago-contact-wizard.types";

export const CONTACT_WIZARD_STEPS: ContactWizardStepMeta[] = [
  {
    title: "Primeiro, seus dados iniciais.",
    subtitle:
      "Com essas informações, a Credpagos já consegue iniciar seu atendimento com mais agilidade e contexto.",
  },
  {
    title: "Agora, fale sobre sua empresa e sua necessidade.",
    subtitle:
      "Queremos entender seu perfil para direcionar uma análise de crédito mais precisa.",
  },
  {
    title: "Agora, vamos entender o valor e o objetivo do crédito.",
    subtitle:
      "Com esse recorte, conseguimos avaliar a solicitação com mais clareza.",
  },
  {
    title: "Quais são seus principais desafios financeiros hoje?",
    subtitle:
      "Vamos identificar o principal ponto para indicar a melhor alternativa.",
  },
  {
    title: "Perfeito. Falta só concluir sua simulação.",
    subtitle:
      "Informe seu e-mail corporativo para que a Credpagos possa dar continuidade ao atendimento.",
  },
];

export const SEGMENT_OPTIONS: OptionItem[] = [
  { value: "mei", label: "MEI" },
  { value: "pj", label: "Pessoa Jurídica (PJ)" },
  { value: "pf", label: "Pessoa Física (PF)" },
  { value: "autonomo", label: "Autônomo" },
  { value: "profissional-liberal", label: "Profissional Liberal" },
  { value: "outro", label: "Outro" },
];

export const SALES_CHANNEL_OPTIONS: OptionItem[] = [
  { value: "servicos", label: "Prestação de serviços" },
  { value: "comercio", label: "Comércio" },
  { value: "industria", label: "Indústria" },
  { value: "digital", label: "Atuação digital" },
  { value: "outro", label: "Outro modelo" },
];

export const OPERATION_MODEL_OPTIONS: OptionItem[] = [
  { value: "b2c", label: "Atendimento ao consumidor final" },
  { value: "b2b", label: "Atendimento para empresas" },
  { value: "hibrida", label: "Operação híbrida" },
];

export const TRANSACTION_OPTIONS: OptionItem[] = [
  { value: "ate-500", label: "Até R$ 10 mil" },
  { value: "500-2000", label: "R$ 10 mil a R$ 50 mil" },
  { value: "2000-10000", label: "R$ 50 mil a R$ 200 mil" },
  { value: "10000-plus", label: "Acima de R$ 200 mil" },
];

export const REVENUE_OPTIONS: OptionItem[] = [
  { value: "ate-50k", label: "Até R$ 50 mil" },
  { value: "50k-300k", label: "R$ 50 mil a R$ 300 mil" },
  { value: "300k-1m", label: "R$ 300 mil a R$ 1 milhão" },
  { value: "1m-plus", label: "Acima de R$ 1 milhão" },
];

export const TICKET_OPTIONS: OptionItem[] = [
  { value: "ate-100", label: "Até R$ 10 mil" },
  { value: "100-300", label: "R$ 10 mil a R$ 30 mil" },
  { value: "300-1000", label: "R$ 30 mil a R$ 100 mil" },
  { value: "1000-plus", label: "Acima de R$ 100 mil" },
];

export const MAIN_PAIN_OPTIONS: OptionItem[] = [
  { value: "falta-capital", label: "Falta de capital de giro" },
  { value: "organizar-contas", label: "Organizar contas e fluxo de caixa" },
  { value: "investir-negocio", label: "Investir no negócio" },
  { value: "quitar-dividas", label: "Quitar dívidas" },
  { value: "imprevistos", label: "Cobrir imprevistos" },
  { value: "expansao", label: "Expandir operação" },
  { value: "outro", label: "Outro desafio" },
];

export const LOSS_STAGE_OPTIONS: OptionItem[] = [
  { value: "analise", label: "Entender opções disponíveis" },
  { value: "documentacao", label: "Organizar documentação" },
  { value: "aprovacao", label: "Aguardar avaliação e aprovação" },
  { value: "proposta", label: "Comparar propostas e condições" },
  { value: "contratacao", label: "Concluir contratação" },
];

export const URGENCY_OPTIONS: OptionItem[] = [
  { value: "agora", label: "Preciso resolver agora" },
  { value: "30-dias", label: "Nos próximos 30 dias" },
  { value: "90-dias", label: "Nos próximos 90 dias" },
  { value: "avaliando", label: "Estou avaliando no momento" },
];
