"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Gift } from "lucide-react";

export default function CaixaPremiadaPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <Link
        href={`/campanhas/${id}`}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para gerenciar campanha
      </Link>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Gift className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Caixa Premiada</h1>
        <p className="text-gray-600 mb-6">
          Gerencie a caixa premiada desta campanha.
        </p>
        <p className="text-sm text-gray-500">Em breve.</p>
      </div>
    </div>
  );
}
