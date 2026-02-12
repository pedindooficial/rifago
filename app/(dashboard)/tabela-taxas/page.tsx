import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FAIXAS_TAXA, calcularTaxaPorFaixas, formatarMoeda } from "@/lib/taxas";

export default function TabelaTaxas() {
  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/campanhas/criar"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </Link>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Tabela de Taxas
          </h1>

          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-gray-800 font-medium mb-2">
              Como funciona:
            </p>
            <p className="text-gray-700 text-sm leading-relaxed">
              Nós do Rifago não cobramos comissão na venda de seus títulos, e todo o valor que você arrecadar vai diretamente para sua conta. Isso mesmo, nós não retemos o valor arrecadado por você em nossa plataforma!
            </p>
            <p className="text-gray-700 text-sm mt-3">
              <strong>Exemplo:</strong> Se você fizer uma campanha com 100 títulos e cada título for vendido a R$ 1,00, isso vai totalizar R$ 100,00 no valor da sua arrecadação. Diante disso vamos cobrar apenas uma taxa de: <strong>R$ 7,00</strong>.
            </p>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Veja a nossa tabela abaixo:
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Arrecadação
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Taxa
                  </th>
                </tr>
              </thead>
              <tbody>
                {FAIXAS_TAXA.map((faixa, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4 text-gray-700">
                      {faixa.ate === Infinity
                        ? "Acima de R$ 100.000,00"
                        : `R$ ${formatarMoeda(faixa.ate)}`}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      R$ {formatarMoeda(faixa.taxa)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              A taxa é definida pela faixa de arrecadação da sua campanha. O valor arrecadado com as vendas vai integralmente para você; cobramos apenas a taxa fixa da tabela.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
