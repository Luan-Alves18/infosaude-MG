import { Link } from "@/lib/router-compat";
import { Mail, MapPin, ExternalLink } from "lucide-react";
import brasaoMG from "@/assets/brasao-mg.jpg";

export const Footer = () => (
  <footer className="gradient-footer text-primary-foreground mt-20">
    <div className="container mx-auto px-4 py-12 grid gap-10 md:grid-cols-12">
      {/* Marca */}
      <div className="md:col-span-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 shrink-0 rounded-md bg-primary-foreground/10 p-1 flex items-center justify-center">
            <img
              src={brasaoMG}
              alt="Brasão de Minas Gerais"
              className="h-full w-auto object-contain"
              loading="lazy"
            />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">
              InfoSaúde<span className="opacity-80"> MG</span>
            </div>
            <div className="text-xs opacity-80">Portal de Informações em Saúde</div>
          </div>
        </div>
        <p className="text-sm opacity-90 max-w-md leading-relaxed">
          Integração das informações em saúde do Estado de Minas Gerais por meio
          de ferramentas interativas e produtos de dados.
        </p>
        <a
          href="https://www.saude.mg.gov.br"
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium opacity-90 hover:opacity-100 underline underline-offset-4"
        >
          Site oficial SES-MG <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Navegação */}
      <div className="md:col-span-3">
        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide opacity-90">
          Navegação
        </h4>
        <ul className="space-y-2 text-sm">
          <li><Link to="/" className="opacity-80 hover:opacity-100 hover:underline">Início</Link></li>
          <li><Link to="/paineis" className="opacity-80 hover:opacity-100 hover:underline">Galeria de Painéis</Link></li>
          <li><Link to="/dados-abertos" className="opacity-80 hover:opacity-100 hover:underline">Dados Abertos</Link></li>
          <HideInModoEleitoral>
            <li><Link to="/sobre" className="opacity-80 hover:opacity-100 hover:underline">Sobre</Link></li>
          </HideInModoEleitoral>
          <li><Link to="/contato" className="opacity-80 hover:opacity-100 hover:underline">Contato</Link></li>
        </ul>
      </div>

      {/* Contato */}
      <div className="md:col-span-4">
        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide opacity-90">
          Contato
        </h4>
        <ul className="space-y-3 text-sm">
          <li className="flex items-start gap-2">
            <Mail className="h-4 w-4 mt-0.5 shrink-0" />
            <a
              href="mailto:nucleodedados@saude.mg.gov.br"
              className="opacity-90 hover:opacity-100 hover:underline break-all"
            >
              nucleodedados@saude.mg.gov.br
            </a>
          </li>
          <li className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="opacity-90">Belo Horizonte – MG</span>
          </li>
        </ul>
      </div>
    </div>

    <div className="border-t border-primary-foreground/15">
      <div className="container mx-auto px-4 py-4 text-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3 opacity-90">
        <div className="flex flex-col gap-0.5">
          <span>© {new Date().getFullYear()} Secretaria de Estado de Saúde de Minas Gerais</span>
          <span className="opacity-80">Dados oficiais · Atualização contínua</span>
        </div>
        <div className="text-xs md:text-right">
          <div className="font-semibold opacity-95">Desenvolvido por: Luan Rodrigues</div>
          <div className="opacity-80">Assessoria de Tecnologia e Informação – NIGD</div>
        </div>
      </div>
    </div>
  </footer>
);
