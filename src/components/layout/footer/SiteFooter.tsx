import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="footer-social-icon"
      fill="currentColor"
    >
      <path d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19ZM8.34 17.34V10.32H6V17.34H8.34ZM7.17 9.36C7.92 9.36 8.39 8.86 8.39 8.23C8.38 7.58 7.92 7.1 7.19 7.1C6.46 7.1 6 7.58 6 8.23C6 8.86 6.45 9.36 7.17 9.36ZM18 17.34V13.43C18 11.34 16.88 10.37 15.39 10.37C14.19 10.37 13.66 11.03 13.36 11.49V10.32H11.02C11.05 11.09 11.02 17.34 11.02 17.34H13.36V13.42C13.36 13.21 13.37 13 13.44 12.85C13.61 12.43 14 11.99 14.65 11.99C15.5 11.99 15.84 12.64 15.84 13.59V17.34H18Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="footer-social-icon"
      fill="currentColor"
    >
      <path d="M7.75 3H16.25C18.87 3 21 5.13 21 7.75V16.25C21 18.87 18.87 21 16.25 21H7.75C5.13 21 3 18.87 3 16.25V7.75C3 5.13 5.13 3 7.75 3ZM7.6 5C6.16 5 5 6.16 5 7.6V16.4C5 17.84 6.16 19 7.6 19H16.4C17.84 19 19 17.84 19 16.4V7.6C19 6.16 17.84 5 16.4 5H7.6ZM17.25 6.5C17.66 6.5 18 6.84 18 7.25C18 7.66 17.66 8 17.25 8C16.84 8 16.5 7.66 16.5 7.25C16.5 6.84 16.84 6.5 17.25 6.5ZM12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" />
    </svg>
  );
}

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <div className="footer-brand">
          <Link href="/" className="footer-logo" aria-label="Credpagos Início">
            <Image
              src="/assets/img/logo/logo.svg"
              alt="Credpagos"
              className="site-logo-image"
              width={160}
              height={33}
              priority
            />
          </Link>

          <p className="footer-description">
            A Credpagos oferece soluções de crédito para MEI, PJ e PF com
            análise simples, atendimento próximo e soluções pensadas para cada
            momento financeiro.
          </p>

          <div className="footer-socials" aria-label="Redes sociais">
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="footer-social-link"
            >
              <LinkedInIcon />
            </a>

            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="footer-social-link"
            >
              <InstagramIcon />
            </a>
          </div>
        </div>

        <nav className="footer-column" aria-label="Soluções">
          <h4>Soluções</h4>
          <Link href="/solucoes/credito-para-mei">Crédito para MEI</Link>
          <Link href="/solucoes/credito-para-pj">Crédito para PJ</Link>
          <Link href="/solucoes/credito-para-pf">Crédito para PF</Link>
          <Link href="/solucoes/capital-de-giro">Capital de Giro</Link>
          <Link href="/solucoes/consultoria-de-credito">
            Consultoria de Crédito
          </Link>
        </nav>

        <nav className="footer-column" aria-label="Empresa">
          <h4>Empresa</h4>
          <Link href="/">Início</Link>
          <Link href="/solucoes">Soluções</Link>
          <Link href="/#como-funciona">Como Funciona</Link>
          <Link href="/sobre">Quem Somos</Link>
          <Link href="/contato">Contato</Link>
        </nav>

        <nav className="footer-column" aria-label="Suporte">
          <h4>Suporte</h4>
          <Link href="/simular-credito">Simular Crédito</Link>
          <Link href="/duvidas-frequentes">Dúvidas Frequentes</Link>
          <Link href="/terms-of-services">Termos de Serviço</Link>
          <Link href="/privacy-policy">Política de Privacidade</Link>
          <Link href="/cookie-policy">Política de Cookies</Link>
        </nav>

        <div className="footer-contact">
          <h4>Atendimento em dias úteis das 8h às 20h (Horário de Brasília)</h4>


          <div className="footer-contact-item">
            <Mail size={18} strokeWidth={2} />
            <a href="mailto:contato@credpagos.com.br">contato@credpagos.com.br</a>
          </div>

        </div>
      </div>

      <div className="footer-legal">
        <p>
          A Credpagos atua para facilitar o acesso a soluções de crédito para
          pessoas físicas, microempreendedores individuais e empresas. A
          aprovação, valores, prazos, taxas e condições dependem da análise de
          crédito, perfil do solicitante e políticas das instituições parceiras.
        </p>
      </div>

      <div className="site-footer-content">
        <p>&copy; {new Date().getFullYear()} Credpagos - Todos os direitos reservados</p>

        <div className="site-footer-links">
          <Link href="/terms-of-services">Termos de Serviço</Link>
          <Link href="/privacy-policy">Política de Privacidade</Link>
          <Link href="/cookie-policy">Política de Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
