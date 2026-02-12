import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Personalizar() {
  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/configuracao" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5" /> Voltar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Personalize do seu jeito</h1>
        <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
          <p>Em breve: cores e identidade visual.</p>
        </div>
      </div>
    </div>
  );
}
