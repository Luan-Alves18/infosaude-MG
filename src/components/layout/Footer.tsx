import { Link } from "@/lib/router-compat";
import { Mail, MapPin, Phone, ExternalLink } from "lucide-react";
import seloGovernoMG from "@/assets/selo-governo-mg.png";
import seloMG from "@/assets/selo-mg.png";

export const Footer = () => (
  <footer className="gradient-footer text-primary-foreground mt-20">
    <div className="container mx-auto px-4 py-10 md:py-12 grid gap-8 md:gap-10 sm:grid-cols-2 md:grid-cols-4">
      <div className="sm:col-span-2 md:col-span-2">
        <div className="flex items-center gap-3 mb-4">
          <img src={seloMG} alt="Selo MG" className="h-10 w-10 object-contain" />
          <div>
            <div className="font-bold text-lg">InfoSaúde MG</div>
            <div className="text-xs opacity-80">Portal de Informações em Saúde</div>
          </div>
        </div>
        <p className="text-sm opacity-90 max-w-md leading-relaxed">
          Integração das informações em saúde do Estado de Minas Gerais.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <img
            src={seloGovernoMG}
            alt="Governo de Minas Gerais"
            className="h-8 object-contain"
          />
          <a
            href="https://www.saude.mg.gov.br"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] opacity-80 hover:opacity-100 inline-flex items-center gap-1 underline"
          >
            SES-MG <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide opacity-90">Navegação</h4>
        <ul className="space-y-2 text-sm">
          <li><Link to="/" className="opacity-80 hover:opacity-100 hover:underline">Início</Link></li>
          <li><Link to="/paineis" className="opacity-80 hover:opacity-100 hover:underline">Galeria de Painéis</Link></li>
          <li><Link to="/dados-abertos" className="opacity-80 hover:opacity-100 hover:underline">Dados Abertos</Link></li>
          <li><Link to="/sobre" className="opacity-80 hover:opacity-100 hover:underline">Sobre</Link></li>
          <li><Link to="/contato" className="opacity-80 hover:opacity-100 hover:underline">Contato</Link></li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide opacity-90">Contato</h4>
        <ul className="space-y-3 text-sm">
          <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> 136</li>
          <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> faleconosco@saude.mg.gov.br</li>
          <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 shrink-0" /> Belo Horizonte – MG</li>
        </ul>
      </div>
    </div>

    <div className="border-t border-primary-foreground/15">
      <div className="container mx-auto px-4 py-4 text-xs flex flex-col md:flex-row items-center justify-between gap-2 opacity-80">
        <span>© {new Date().getFullYear()} Secretaria de Estado de Saúde de Minas Gerais</span>
        <span>Dados oficiais · Atualização contínua</span>
      </div>
    </div>
  </footer>
);
