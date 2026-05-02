import type {
  ProfileOption,
  StatusOption,
  WizardStepMeta,
} from "@/components/credito/types";
import {
  CREDIT_PROFILE_LABELS,
  CREDIT_STATUS_LABELS,
} from "@/lib/credit/constants";

export const REQUEST_PURPOSE_OPTIONS = [
  "Capital de giro",
  "Compra de estoque",
  "Organizar dívidas",
  "Emergência",
  "Expansão",
  "Equipamentos",
  "Marketing",
  "Outro",
];

export const PF_INCOME_TYPE_OPTIONS = [
  "CLT",
  "Autônomo",
  "Empresário",
  "Aposentadoria",
  "Benefício",
  "Outro",
];

export const ACCOUNT_TYPE_OPTIONS = [
  "Corrente",
  "Poupança",
  "Conta de pagamento",
];

export const CREDIT_TERM_OPTIONS = [6, 9, 12, 18, 24, 36, 48];

export const PF_STEPS: WizardStepMeta[] = [
  {
    id: "dados-pessoais",
    title: "Dados pessoais",
    description: "Preencha os dados principais para iniciarmos sua análise.",
  },
  {
    id: "endereco",
    title: "Endereço",
    description: "Informe o endereço residencial atualizado.",
  },
  {
    id: "renda",
    title: "Renda e profissão",
    description: "Nos ajude a entender sua capacidade financeira.",
  },
  {
    id: "banco",
    title: "Dados bancários",
    description: "Dados para conferência de titularidade e futura liberação.",
  },
  {
    id: "solicitacao",
    title: "Solicitação de crédito",
    description: "Defina valor, prazo e finalidade da solicitação.",
  },
  {
    id: "revisao",
    title: "Revisão",
    description: "Revise seus dados e envie para análise.",
  },
];

export const MEI_STEPS: WizardStepMeta[] = [
  {
    id: "responsavel",
    title: "Dados do responsável",
    description: "Precisamos dos dados do titular do MEI.",
  },
  {
    id: "mei",
    title: "Dados do MEI",
    description: "Informações de cadastro e faturamento da empresa.",
  },
  {
    id: "endereco",
    title: "Endereço comercial",
    description: "Endereço utilizado na operação do negócio.",
  },
  {
    id: "solicitacao",
    title: "Solicitação de crédito",
    description: "Defina valor, prazo e finalidade desejada.",
  },
  {
    id: "banco",
    title: "Dados bancários",
    description: "Informe a conta para contratação e liberação.",
  },
  {
    id: "revisao",
    title: "Revisão",
    description: "Confira as informações antes de enviar.",
  },
];

export const PJ_STEPS: WizardStepMeta[] = [
  {
    id: "empresa",
    title: "Dados da empresa",
    description: "Dados cadastrais e financeiros da pessoa jurídica.",
  },
  {
    id: "socios",
    title: "Sócios",
    description: "Cadastre os sócios para composição da análise.",
  },
  {
    id: "endereco",
    title: "Endereço da empresa",
    description: "Endereço principal da operação.",
  },
  {
    id: "financeiro",
    title: "Dados financeiros",
    description: "Receitas, despesas e histórico financeiro.",
  },
  {
    id: "solicitacao",
    title: "Solicitação de crédito",
    description: "Defina valor, prazo e objetivo do crédito.",
  },
  {
    id: "banco",
    title: "Dados bancários",
    description: "Conta para formalização e eventual liberação.",
  },
  {
    id: "revisao",
    title: "Revisão",
    description: "Valide os dados antes de enviar.",
  },
];

export const ADMIN_STATUS_OPTIONS: StatusOption[] = [
  { value: "", label: "Todos os status" },
  ...Object.entries(CREDIT_STATUS_LABELS).map(([value, label]) => ({
    value: value as StatusOption["value"],
    label,
  })),
];

export const ADMIN_PROFILE_OPTIONS: ProfileOption[] = [
  { value: "", label: "Todos os perfis" },
  ...Object.entries(CREDIT_PROFILE_LABELS).map(([value, label]) => ({
    value: value as ProfileOption["value"],
    label,
  })),
];