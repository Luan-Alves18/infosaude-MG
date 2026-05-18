import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

const DADOS_URL =
  "https://dados.mg.gov.br/dataset/?organization=secretaria-de-estado-de-saude-ses";

const DadosAbertos = () => {
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let cancelado = false;

    try {
      window.location.assign(DADOS_URL);
    } catch {
      try {
        window.location.href = DADOS_URL;
      } catch {
        setFalhou(true);
      }
    }

    const timer = window.setTimeout(() => {
      if (!cancelado) setFalhou(true);
    }, 2500);

    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-3xl font-bold text-foreground mb-3">Dados Abertos</h1>
      <p className="text-muted-foreground mb-6">
        {falhou
          ? "Não foi possível redirecionar automaticamente. Use o link abaixo para acessar o Portal de Dados Abertos do Estado de Minas Gerais."
          : "Redirecionando para o Portal de Dados Abertos do Estado de Minas Gerais…"}
      </p>
      <a
        href={DADOS_URL}
        className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
      >
        Acessar o Portal de Dados Abertos
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
};

export default DadosAbertos;