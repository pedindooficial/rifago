"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  ArrowRight,
  ArrowLeft,
  Check,
  Calendar,
  Ticket,
  Image as ImageIcon,
  CreditCard,
  Clock,
  X,
  SlidersHorizontal,
  Gift,
  Percent,
  Eye,
  EyeOff,
  Trash2,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { criarCampanha, obterCampanha, atualizarCampanha } from "@/lib/api";
import type { TipoRealizacaoSorteio, Campanha } from "@/lib/api";
import { calcularTaxaPorFaixas, formatarMoeda, FAIXAS_TAXA } from "@/lib/taxas";
import {
  type PromocaoItem,
  parsePromocaoFromString,
  serializePromocao,
} from "@/lib/promocao";

const tiposSorteio = [
  { value: "loteria-federal", label: "Loteria Federal" },
  { value: "sorteador", label: "Sorteador" },
  { value: "deu-no-poste", label: "Deu no Poste" },
  { value: "organizador", label: "Organizador" },
];

const quantidadesTitulos = [
  { value: "100", label: "100 títulos - (001 à 100)" },
  { value: "500", label: "500 títulos - (001 à 500)" },
  { value: "1000", label: "1.000 títulos - (001 à 1000)" },
  { value: "2000", label: "2.000 títulos - (0001 à 2000)" },
  { value: "5000", label: "5.000 títulos - (0001 à 5000)" },
  { value: "10000", label: "10 mil títulos - (00000 à 09999)" },
  { value: "70000", label: "70 mil títulos - (00000 à 69999)" },
  { value: "100000", label: "100 mil títulos - (00000 à 99999)" },
  { value: "200000", label: "200 mil títulos - (000000 à 199999)" },
  { value: "300000", label: "300 mil títulos - (000000 à 299999)" },
  { value: "500000", label: "500 mil títulos - (000000 à 499999)" },
  { value: "700000", label: "700 mil títulos - (000000 à 699999)" },
  { value: "1000000", label: "1 milhão de títulos - (000000 à 999999)" },
  { value: "10000000", label: "10 milhões de títulos - (000000 à 9999999)" },
];

const opcoesQuandoSorteio: { value: TipoRealizacaoSorteio; label: string }[] = [
  { value: "venda_total", label: "Quando todas as cotas forem vendidas" },
  { value: "data_encerramento", label: "Na data de encerramento da campanha" },
  { value: "data_especifica", label: "Em uma data específica" },
];

const opcoesMinutosPix = [
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 60, label: "60 minutos" },
  { value: 120, label: "2 horas" },
];

function parseValorMonetario(value: string): number {
  const cleaned = value.replace(/\D/g, "") || "0";
  return parseInt(cleaned, 10) / 100;
}

const opcoesPrazoReserva = [
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 60, label: "1 hora" },
  { value: 120, label: "2 horas" },
];

const schema = z
  .object({
    nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    imagemUrl: z.string().optional(),
    tipoSorteio: z.string().min(1, "Selecione um tipo de sorteio"),
    quantidadeTitulos: z.string().min(1, "Selecione a quantidade de títulos"),
    valorPorTitulo: z.string().min(1, "Informe o valor por título").refine(
      (v) => parseValorMonetario(v) >= 0.01,
      "Valor mínimo por título: R$ 0,01"
    ),
    dataInicio: z.string().optional(),
    dataFim: z.string().optional(),
    tipoRealizacaoSorteio: z.enum(["venda_total", "data_encerramento", "data_especifica"]).optional(),
    dataSorteio: z.string().optional(),
    prazoReservaExpirar: z.coerce.number().min(1).max(1440),
    quantidadeMinimaReserva: z.coerce.number().min(1),
    quantidadeMaximaReserva: z.coerce.number().min(0).optional(),
    regulamento: z.string().optional(),
    minutosPixExpirar: z.coerce.number().min(1).max(1440),
    modoTitulos: z.enum(["aleatorios", "expostos"]).optional(),
    progressoVisivel: z.boolean().optional(),
    premios: z.string().optional(),
    promocao: z.string().optional(),
  })
  .refine(
    (data) => {
      const min = data.quantidadeMinimaReserva ?? 1;
      const max = data.quantidadeMaximaReserva;
      if (max != null && max > 0 && max < min) return false;
      return true;
    },
    { message: "Máxima deve ser maior ou igual à mínima (ou 0 para sem limite)", path: ["quantidadeMaximaReserva"] }
  )
  .refine(
    (data) => {
      if (data.tipoRealizacaoSorteio === "data_especifica") {
        return !!data.dataSorteio && data.dataSorteio.length >= 10;
      }
      return true;
    },
    { message: "Informe a data do sorteio", path: ["dataSorteio"] }
  );

type FormData = z.infer<typeof schema>;

function CriarCampanhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editarId = searchParams.get("editar");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [etapa, setEtapa] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [loading, setLoading] = useState(false);
  const [campanhaEdit, setCampanhaEdit] = useState<Campanha | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(!!editarId);
  const [modalTabelaAberta, setModalTabelaAberta] = useState(false);
  const [panelPremiosOpen, setPanelPremiosOpen] = useState(false);
  const [panelPromocaoOpen, setPanelPromocaoOpen] = useState(false);
  const [premiosList, setPremiosList] = useState<string[]>([""]);
  const [promocoesList, setPromocoesList] = useState<PromocaoItem[]>([{ quantidade: 1, valorTotal: 0 }]);
  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    trigger,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      valorPorTitulo: "0,00",
      dataInicio: new Date().toISOString().slice(0, 10),
      tipoRealizacaoSorteio: "venda_total",
      prazoReservaExpirar: 60,
      quantidadeMinimaReserva: 1,
      minutosPixExpirar: 30,
      modoTitulos: "aleatorios",
      progressoVisivel: false,
    },
  });

  const quantidadeTitulos = watch("quantidadeTitulos");
  const valorPorTituloStr = watch("valorPorTitulo");
  const tipoRealizacaoSorteio = watch("tipoRealizacaoSorteio");
  const imagemUrl = watch("imagemUrl");
  const modoTitulos = watch("modoTitulos");

  const valorPorTituloNum = parseValorMonetario(valorPorTituloStr || "0");
  const arrecadacao =
    quantidadeTitulos && valorPorTituloNum > 0
      ? parseInt(quantidadeTitulos, 10) * valorPorTituloNum
      : null;
  const taxa = arrecadacao != null && arrecadacao > 0 ? calcularTaxaPorFaixas(arrecadacao) : null;

  useEffect(() => {
    if (!editarId) return;
    obterCampanha(editarId)
      .then(setCampanhaEdit)
      .catch(() => setLoadingEdit(false))
      .finally(() => setLoadingEdit(false));
  }, [editarId]);

  useEffect(() => {
    if (!campanhaEdit) return;
    const valorStr =
      campanhaEdit.valorPorTitulo != null
        ? (campanhaEdit.valorPorTitulo).toFixed(2).replace(".", ",")
        : "0,00";
    const qtdStr = String(campanhaEdit.quantidadeTitulos);
    reset({
      nome: campanhaEdit.nome,
      imagemUrl: campanhaEdit.imagemUrl ?? "",
      tipoSorteio: campanhaEdit.tipoSorteio,
      quantidadeTitulos: quantidadesTitulos.some((o) => o.value === qtdStr) ? qtdStr : "100",
      valorPorTitulo: valorStr,
      dataInicio: campanhaEdit.dataInicio?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      dataFim: campanhaEdit.dataFim?.slice(0, 10) ?? "",
      tipoRealizacaoSorteio: campanhaEdit.tipoRealizacaoSorteio ?? "venda_total",
      dataSorteio: campanhaEdit.dataSorteio?.slice(0, 10) ?? "",
      prazoReservaExpirar: campanhaEdit.prazoReservaExpirar ?? 60,
      quantidadeMinimaReserva: campanhaEdit.quantidadeMinimaReserva ?? 1,
      quantidadeMaximaReserva: campanhaEdit.quantidadeMaximaReserva ?? undefined,
      regulamento: campanhaEdit.regulamento ?? "",
      minutosPixExpirar: campanhaEdit.minutosPixExpirar ?? 30,
      modoTitulos: campanhaEdit.modoTitulos ?? "aleatorios",
      progressoVisivel: campanhaEdit.progressoVisivel ?? false,
      premios: campanhaEdit.premios ?? "",
      promocao: campanhaEdit.promocao ?? "",
    });
  }, [campanhaEdit]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => setValue("imagemUrl", reader.result as string);
    reader.readAsDataURL(file);
  };

  const avancarEtapa1 = async () => {
    const ok = await trigger(["nome", "tipoSorteio", "quantidadeTitulos", "valorPorTitulo"]);
    if (ok) setEtapa(2);
  };

  const avancarEtapa2 = async () => {
    const ok = await trigger(["tipoRealizacaoSorteio", "dataSorteio"]);
    if (ok) setEtapa(3);
  };

  const avancarEtapa3 = async () => {
    setEtapa(4);
  };

  const avancarEtapa4 = async () => {
    const ok = await trigger(["minutosPixExpirar"]);
    if (ok) setEtapa(5);
  };

  const abrirPanelPremios = () => {
    const val = watch("premios");
    setPremiosList(val?.trim() ? val.split("\n").filter(Boolean) : [""]);
    setPanelPremiosOpen(true);
  };

  const aplicarPremios = () => {
    const list = premiosList.map((s) => s.trim()).filter(Boolean);
    setValue("premios", list.length ? list.join("\n") : "");
    setPanelPremiosOpen(false);
  };

  const abrirPanelPromocao = () => {
    const val = watch("promocao");
    const parsed = parsePromocaoFromString(val);
    setPromocoesList(parsed.length > 0 ? parsed : [{ quantidade: 1, valorTotal: 0 }]);
    setPanelPromocaoOpen(true);
  };

  /** Valida: valor total da promoção deve ser menor que quantidade × valor da cota (desconto real). */
  const promocaoItemValido = (item: PromocaoItem): boolean => {
    if (item.quantidade < 1 || item.valorTotal <= 0) return false;
    const totalReal = item.quantidade * valorPorTituloNum;
    return item.valorTotal < totalReal;
  };

  const aplicarPromocao = () => {
    const validas = promocoesList.filter(
      (p) => p.quantidade >= 1 && p.valorTotal > 0 && promocaoItemValido(p)
    );
    setValue("promocao", serializePromocao(validas));
    setPanelPromocaoOpen(false);
  };

  const buildPayload = (data: FormData) => {
    const qtd = parseInt(data.quantidadeTitulos, 10);
    const valor = parseValorMonetario(data.valorPorTitulo);
    const arrecadacaoEstimada = qtd * valor;
    const taxaCalculada = calcularTaxaPorFaixas(arrecadacaoEstimada);
    return {
      nome: data.nome,
      imagemUrl: data.imagemUrl || undefined,
      tipoSorteio: data.tipoSorteio,
      quantidadeTitulos: qtd,
      valorPorTitulo: valor,
      arrecadacaoEstimada,
      taxa: taxaCalculada,
      dataInicio: data.dataInicio || undefined,
      dataFim: data.dataFim || undefined,
      tipoRealizacaoSorteio: data.tipoRealizacaoSorteio || "venda_total",
      dataSorteio: data.tipoRealizacaoSorteio === "data_especifica" ? data.dataSorteio : undefined,
      prazoReservaExpirar: data.prazoReservaExpirar ?? 60,
      quantidadeMinimaReserva: data.quantidadeMinimaReserva ?? 1,
      quantidadeMaximaReserva: data.quantidadeMaximaReserva || undefined,
      regulamento: data.regulamento || undefined,
      minutosPixExpirar: data.minutosPixExpirar ?? 30,
      modoTitulos: data.modoTitulos ?? "aleatorios",
      progressoVisivel: data.progressoVisivel ?? false,
      premios: data.premios || undefined,
      promocao: data.promocao || undefined,
    };
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      if (editarId) {
        let payload = buildPayload(data);
        if (campanhaEdit && (campanhaEdit.titulosVendidos ?? 0) > 0) {
          delete (payload as Record<string, unknown>).quantidadeTitulos;
          delete (payload as Record<string, unknown>).dataInicio;
          const valor = parseValorMonetario(data.valorPorTitulo);
          payload.arrecadacaoEstimada = campanhaEdit.quantidadeTitulos * valor;
          payload.taxa = calcularTaxaPorFaixas(payload.arrecadacaoEstimada);
        }
        await atualizarCampanha(editarId, payload);
        router.push(`/campanhas/${editarId}`);
      } else {
        const campanha = await criarCampanha(buildPayload(data));
        router.push(`/campanhas/${campanha.id}`);
      }
    } catch (error) {
      console.error(editarId ? "Erro ao atualizar campanha:" : "Erro ao criar campanha:", error);
      alert(editarId ? "Erro ao atualizar campanha. Tente novamente." : "Erro ao criar campanha. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const labelQuandoSorteio = (tipo?: TipoRealizacaoSorteio) => {
    const o = opcoesQuandoSorteio.find((x) => x.value === tipo);
    return o?.label ?? "--";
  };

  const steps = [
    { n: 1, label: "Informações" },
    { n: 2, label: "Configurações" },
    { n: 3, label: "Prêmios e promoções" },
    { n: 4, label: "Pagamentos" },
    { n: 5, label: "Finalizar" },
  ];

  if (loadingEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando campanha...</p>
        </div>
      </div>
    );
  }

  if (editarId && !campanhaEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700 mb-4">Campanha não encontrada.</p>
          <Link
            href="/campanhas"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para campanhas
          </Link>
        </div>
      </div>
    );
  }

  const isEdit = !!editarId;
  const bloquearCotasEDataInicio =
    isEdit && campanhaEdit != null && (campanhaEdit.titulosVendidos ?? 0) > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={isEdit && editarId ? `/campanhas/${editarId}` : "/campanhas"}
            className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white hover:opacity-90"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            {isEdit ? <Edit className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{isEdit ? "Editar campanha" : "Criar campanha"}</h1>
        </div>

        {/* Progresso */}
        <div className="flex items-center gap-1 mb-8 flex-wrap">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                  etapa >= s.n ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {etapa > s.n ? <Check className="w-4 h-4" /> : s.n}
              </div>
              <span className={etapa >= s.n ? "font-semibold text-gray-900 text-sm" : "text-gray-500 text-sm"}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className="w-4 h-0.5 bg-gray-200 ml-0.5" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Etapa 1: Informações + FOTO */}
          {etapa === 1 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                1. Informações da campanha
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Foto da campanha */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Foto da campanha
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors"
                    >
                      {imagemUrl ? (
                        <div className="relative">
                          <img
                            src={imagemUrl}
                            alt="Preview"
                            className="max-h-48 mx-auto rounded-lg object-cover"
                          />
                          <span className="text-sm text-gray-500 mt-2 block">
                            Clique para trocar a foto
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <ImageIcon className="w-12 h-12 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Clique para enviar a foto da campanha
                          </span>
                          <span className="text-xs text-gray-400">PNG, JPG até 5MB</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da campanha
                    </label>
                    <input
                      type="text"
                      {...register("nome")}
                      placeholder="Informe o nome da sua campanha"
                      className="input-field"
                    />
                    {errors.nome && (
                      <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantidade de títulos
                    </label>
                    <select
                      {...register("quantidadeTitulos")}
                      className="select-field disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-80"
                      disabled={bloquearCotasEDataInicio}
                      title={bloquearCotasEDataInicio ? "Não pode ser alterado pois a campanha já possui vendas." : undefined}
                    >
                      <option value="">Selecionar</option>
                      {quantidadesTitulos.map((qtd) => (
                        <option key={qtd.value} value={qtd.value}>
                          {qtd.label}
                        </option>
                      ))}
                    </select>
                    {bloquearCotasEDataInicio && (
                      <p className="mt-1 text-xs text-amber-700">
                        Não pode ser alterado pois a campanha já possui vendas.
                      </p>
                    )}
                    {errors.quantidadeTitulos && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.quantidadeTitulos.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor de cada título
                    </label>
                    <Controller
                      name="valorPorTitulo"
                      control={control}
                      render={({ field }) => (
                        <div className="flex rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
                          <span className="inline-flex items-center px-4 bg-primary text-white font-medium text-sm">
                            R$
                          </span>
                          <input
                            type="text"
                            {...field}
                            placeholder="0,00"
                            className="flex-1 px-4 py-3 border-0 focus:ring-0 focus:outline-none"
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "");
                              if (v.length === 0) {
                                field.onChange("0,00");
                                return;
                              }
                              const int = v.replace(/^0+/, "") || "0";
                              const cents = int.slice(-2).padStart(2, "0");
                              const rest = int.slice(0, -2) || "0";
                              const formatted =
                                rest.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "," + cents;
                              field.onChange(formatted);
                            }}
                          />
                        </div>
                      )}
                    />
                    {errors.valorPorTitulo && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.valorPorTitulo.message}
                      </p>
                    )}
                  </div>
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Arrecadação estimada:</span>
                      <span
                        className={`font-semibold ${arrecadacao ? "text-green-700" : "text-gray-400"}`}
                      >
                        {arrecadacao != null && arrecadacao > 0
                          ? `R$ ${formatarMoeda(arrecadacao)}`
                          : "--"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Taxa:</span>
                      <span className="font-semibold text-gray-900">
                        {taxa != null ? `R$ ${formatarMoeda(taxa)}` : "--"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalTabelaAberta(true)}
                      className="text-primary hover:text-primary-dark text-sm font-medium flex items-center gap-1 mt-2"
                    >
                      Ver tabela de taxa
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Por onde será extraído o resultado?
                    </label>
                    <select {...register("tipoSorteio")} className="select-field">
                      <option value="">Selecionar</option>
                      {tiposSorteio.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                    {errors.tipoSorteio && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.tipoSorteio.message}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de início
                      </label>
                      <input
                        type="date"
                        {...register("dataInicio")}
                        className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-80"
                        disabled={bloquearCotasEDataInicio}
                        title={bloquearCotasEDataInicio ? "Não pode ser alterada pois a campanha já possui vendas." : undefined}
                      />
                      {bloquearCotasEDataInicio && (
                        <p className="mt-1 text-xs text-amber-700">
                          Não pode ser alterada pois a campanha já possui vendas.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de encerramento
                      </label>
                      <input type="date" {...register("dataFim")} className="input-field" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Etapa 2: Configurações do sorteio */}
          {etapa === 2 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                2. Configurações do sorteio
              </h2>
              <p className="text-gray-600 mb-6">
                Defina quando o sorteio será realizado.
              </p>
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quando o sorteio será realizado?
                  </label>
                  <select
                    {...register("tipoRealizacaoSorteio")}
                    className="select-field"
                  >
                    {opcoesQuandoSorteio.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>
                {tipoRealizacaoSorteio === "data_especifica" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data do sorteio
                    </label>
                    <input
                      type="date"
                      {...register("dataSorteio")}
                      className="input-field"
                    />
                    {errors.dataSorteio && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.dataSorteio.message}
                      </p>
                    )}
                  </div>
                )}
                {tipoRealizacaoSorteio === "data_encerramento" && (
                  <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                    O sorteio ocorrerá na <strong>data de encerramento</strong> que você
                    informou na etapa anterior.
                  </p>
                )}
                {tipoRealizacaoSorteio === "venda_total" && (
                  <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                    O sorteio será realizado <strong>assim que todas as cotas forem
                    vendidas</strong>.
                  </p>
                )}

                <div className="border-t pt-6 mt-6 space-y-4">
                  <h3 className="text-base font-semibold text-gray-900">Configurações de reserva</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prazo para uma reserva expirar
                    </label>
                    <select {...register("prazoReservaExpirar")} className="select-field max-w-xs">
                      {opcoesPrazoReserva.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantidade mínima de títulos para reserva
                      </label>
                      <input
                        type="number"
                        min={1}
                        {...register("quantidadeMinimaReserva")}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantidade máxima de títulos para reserva
                      </label>
                      <input
                        type="number"
                        min={1}
                        {...register("quantidadeMaximaReserva")}
                        placeholder="Sem limite"
                        className="input-field"
                      />
                      {errors.quantidadeMaximaReserva && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.quantidadeMaximaReserva.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modo: Títulos Aleatórios ou Expostos + progresso visível */}
                <div className="border-t pt-6 mt-6 space-y-4">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                    Modo
                  </h3>
                  <div className="flex rounded-xl overflow-hidden border border-gray-200 p-1 bg-gray-50">
                    <button
                      type="button"
                          onClick={() => setValue("modoTitulos", "aleatorios")}
                          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                            modoTitulos === "aleatorios"
                              ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          Títulos Aleatórios
                        </button>
                    <button
                      type="button"
                          onClick={() => setValue("modoTitulos", "expostos")}
                          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                            modoTitulos === "expostos"
                              ? "bg-white text-gray-900 shadow-sm border border-gray-200"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          Títulos Expostos
                        </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    {modoTitulos === "aleatorios"
                      ? "As cotas são selecionadas aleatoriamente para o participante."
                      : "As pessoas selecionam as cotas que desejam comprar."}
                  </p>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-gray-50">
                    <Controller
                      name="progressoVisivel"
                      control={control}
                      render={({ field }) => (
                        <div className="relative w-11 h-6 shrink-0">
                          <input
                            type="checkbox"
                            checked={!!field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="absolute inset-0 w-11 h-6 rounded-full bg-gray-300 peer-checked:bg-primary transition-colors" />
                          <div className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                        </div>
                      )}
                    />
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      {watch("progressoVisivel") ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                      Deixar o progresso da campanha visível para os participantes
                    </span>
                  </label>
                </div>

                <div className="border-t pt-6 mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Regulamento da Campanha (Não é obrigatório)
                  </label>
                  <textarea
                    {...register("regulamento")}
                    rows={8}
                    placeholder="Descreva as regras, prêmios e como funciona o sorteio. Serve também como descrição da campanha."
                    className="input-field resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Etapa 3: Prêmios e promoções (aba dedicada) */}
          {etapa === 3 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                3. Prêmios e promoções
              </h2>
              <p className="text-gray-600 mb-6">
                Descreva os prêmios da campanha e adicione promoções (desconto, bônus, etc.). Opcional.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <button
                  type="button"
                  onClick={abrirPanelPremios}
                  className="rounded-xl border-2 border-dashed border-gray-200 p-6 hover:border-primary/50 hover:bg-primary/5 transition-colors text-left flex flex-col items-center gap-3"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Gift className="w-7 h-7 text-primary" />
                  </div>
                  <span className="font-medium text-gray-900">Adicionar prêmios</span>
                  <span className="text-xs text-gray-500 text-center">
                    Descreva os prêmios da campanha...
                  </span>
                  {watch("premios")?.trim() && (
                    <span className="text-xs text-primary font-medium">
                      {watch("premios")!.split("\n").filter(Boolean).length} prêmio(s)
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={abrirPanelPromocao}
                  className="rounded-xl border-2 border-dashed border-gray-200 p-6 hover:border-primary/50 hover:bg-primary/5 transition-colors text-left flex flex-col items-center gap-3"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Percent className="w-7 h-7 text-primary" />
                  </div>
                  <span className="font-medium text-gray-900">Adicionar promoção</span>
                  <span className="text-xs text-gray-500 text-center">
                    Descreva a promoção (desconto, bônus, etc.)...
                  </span>
                  {parsePromocaoFromString(watch("promocao")).length > 0 && (
                    <span className="text-xs text-primary font-medium">
                      {parsePromocaoFromString(watch("promocao")).length} promoção(ões)
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Etapa 4: Opções de pagamento da campanha (ex.: tempo PIX) */}
          {etapa === 4 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                4. Opções de pagamento
              </h2>
              <p className="text-gray-600 mb-6">
                Configure as opções de pagamento desta campanha. Meios de pagamento (ex.: Mercado Pago) são configurados em Configurações → Adicionar meio de pagamento.
              </p>
              <div className="space-y-6 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Minutos para o PIX expirar
                  </label>
                  <select {...register("minutosPixExpirar")} className="select-field">
                    {opcoesMinutosPix.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    O comprador terá esse tempo para pagar o PIX após gerar o código.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Etapa 5: Finalizar - Resumo */}
          {etapa === 5 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-success" />
                5. Revisar e criar campanha
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 text-gray-700">
                  {imagemUrl && (
                    <div>
                      <span className="text-gray-500 block text-sm">Foto</span>
                      <img
                        src={imagemUrl}
                        alt="Campanha"
                        className="h-32 rounded-lg object-cover mt-1"
                      />
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 block text-sm">Nome</span>
                    <span className="font-medium">{watch("nome")}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-sm">Tipo de sorteio</span>
                    <span className="font-medium">
                      {tiposSorteio.find((t) => t.value === watch("tipoSorteio"))?.label ?? "--"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-sm">Quantidade de títulos</span>
                    <span className="font-medium">
                      {watch("quantidadeTitulos")
                        ? parseInt(watch("quantidadeTitulos"), 10).toLocaleString("pt-BR")
                        : "--"}{" "}
                      títulos
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-sm">Valor por título</span>
                    <span className="font-medium">
                      R$ {valorPorTituloNum > 0 ? formatarMoeda(valorPorTituloNum) : "--"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-sm">Arrecadação estimada</span>
                    <span className="font-medium text-green-700">
                      {arrecadacao != null && arrecadacao > 0
                        ? `R$ ${formatarMoeda(arrecadacao)}`
                        : "--"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-sm">Taxa</span>
                    <span className="font-medium">
                      {taxa != null ? `R$ ${formatarMoeda(taxa)}` : "--"}
                    </span>
                  </div>
                </div>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <span className="text-gray-500 block text-sm">Quando o sorteio</span>
                    <span className="font-medium">
                      {labelQuandoSorteio(watch("tipoRealizacaoSorteio"))}
                      {watch("tipoRealizacaoSorteio") === "data_especifica" && watch("dataSorteio") && (
                        <> — {new Date(watch("dataSorteio")!).toLocaleDateString("pt-BR")}</>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-sm">PIX expira em</span>
                    <span className="font-medium">
                      {opcoesMinutosPix.find((o) => o.value === watch("minutosPixExpirar"))?.label ?? watch("minutosPixExpirar") + " min"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-sm">Modo</span>
                    <span className="font-medium">
                      {watch("modoTitulos") === "expostos" ? "Títulos Expostos" : "Títulos Aleatórios"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-sm">Progresso visível</span>
                    <span className="font-medium">
                      {watch("progressoVisivel") ? "Sim" : "Não"}
                    </span>
                  </div>
                  {watch("premios")?.trim() && (
                    <div>
                      <span className="text-gray-500 block text-sm">Prêmios</span>
                      <span className="font-medium text-sm line-clamp-2">{watch("premios")}</span>
                    </div>
                  )}
                  {parsePromocaoFromString(watch("promocao")).length > 0 && (
                    <div>
                      <span className="text-gray-500 block text-sm">Promoção</span>
                      <span className="font-medium text-sm">
                        {parsePromocaoFromString(watch("promocao")).map(
                          (p, i) => `${p.quantidade} cota(s) por R$ ${formatarMoeda(p.valorTotal)}`
                        ).join("; ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Botões de navegação */}
          <div className="flex justify-between items-center">
            {etapa === 1 ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                Cancelar
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setEtapa((e) => (e - 1) as 1 | 2 | 3 | 4 | 5)}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
                Voltar
              </button>
            )}
            {etapa === 1 && (
              <button type="button" onClick={avancarEtapa1} className="btn-success">
                Continuar
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            {etapa === 2 && (
              <button type="button" onClick={avancarEtapa2} className="btn-success">
                Continuar
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            {etapa === 3 && (
              <button type="button" onClick={avancarEtapa3} className="btn-success">
                Continuar
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            {etapa === 4 && (
              <button type="button" onClick={avancarEtapa4} className="btn-success">
                Continuar
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            {etapa === 5 && (
              <button type="submit" disabled={loading} className="btn-success">
                {loading
                  ? isEdit
                    ? "Salvando..."
                    : "Criando..."
                  : isEdit
                    ? "Salvar alterações"
                    : "Criar campanha"}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>

        {/* Modal Tabela de Taxas */}
        {modalTabelaAberta && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setModalTabelaAberta(false)}
          >
            <div
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Tabela de Taxas</h2>
                <button
                  type="button"
                  onClick={() => setModalTabelaAberta(false)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-gray-800 font-medium mb-2">Como funciona:</p>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Nós do Rifago não cobramos comissão na venda de seus títulos, e todo o valor que você arrecadar vai diretamente para sua conta. Isso mesmo, nós não retemos o valor arrecadado por você em nossa plataforma!
                  </p>
                  <p className="text-gray-700 text-sm mt-3">
                    <strong>Exemplo:</strong> Se você fizer uma campanha com 100 títulos e cada título for vendido a R$ 1,00, isso vai totalizar R$ 100,00 no valor da sua arrecadação. Diante disso vamos cobrar apenas uma taxa de: <strong>R$ 7,00</strong>.
                  </p>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Veja a nossa tabela abaixo:</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Arrecadação</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Taxa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FAIXAS_TAXA.map((faixa, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
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
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setModalTabelaAberta(false)}
                    className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Painel lateral: Adicionar prêmio */}
        {panelPremiosOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setPanelPremiosOpen(false)} aria-hidden />
            <div className="relative w-full max-w-md bg-white shadow-xl flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Adicionar prêmio</h2>
                <button
                  type="button"
                  onClick={() => setPanelPremiosOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {premiosList.map((item, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <label className="shrink-0 pt-3 text-sm font-medium text-gray-600 w-20">
                      {i + 1}º prêmio
                    </label>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const next = [...premiosList];
                        next[i] = e.target.value;
                        setPremiosList(next);
                      }}
                      placeholder="Ex. iPhone"
                      className="flex-1 input-field"
                    />
                    {premiosList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPremiosList(premiosList.filter((_, j) => j !== i))}
                        className="shrink-0 p-2 text-gray-400 hover:text-red-600 rounded-lg"
                        aria-label="Remover prêmio"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPremiosList([...premiosList, ""])}
                  className="flex items-center gap-2 text-primary font-medium text-sm hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar mais prêmios
                </button>
              </div>
              <div className="p-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={aplicarPremios}
                  className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold transition-colors"
                >
                  Aplicar prêmio
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Painel lateral: Adicionar promoção */}
        {panelPromocaoOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setPanelPromocaoOpen(false)} aria-hidden />
            <div className="relative w-full max-w-md bg-white shadow-xl flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Adicionar promoção</h2>
                <button
                  type="button"
                  onClick={() => setPanelPromocaoOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <p className="text-sm text-gray-600">
                  Preço da cota nesta campanha: <strong>R$ {formatarMoeda(valorPorTituloNum)}</strong>. O valor total da promoção deve ser menor que o valor das cotas ao preço normal (desconto).
                </p>
                {promocoesList.map((item, i) => {
                  const valorPorCota = item.quantidade > 0 ? item.valorTotal / item.quantidade : 0;
                  const totalReal = item.quantidade * valorPorTituloNum;
                  const preenchido = item.quantidade >= 1 && item.valorTotal > 0;
                  const invalido = preenchido && !promocaoItemValido(item);
                  const valorTotalStr =
                    item.valorTotal > 0
                      ? item.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : "";
                  return (
                    <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{i + 1}º promoção</span>
                        {promocoesList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setPromocoesList(promocoesList.filter((_, j) => j !== i))}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
                            aria-label="Remover promoção"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Quantidade</label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantidade || ""}
                          onChange={(e) => {
                            const next = [...promocoesList];
                            const v = parseInt(e.target.value, 10);
                            next[i] = { ...next[i], quantidade: isNaN(v) ? 0 : Math.max(1, v) };
                            setPromocoesList(next);
                          }}
                          placeholder="Ex. 10"
                          className="input-field w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Valor total</label>
                        <div className="flex rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
                          <span className="inline-flex items-center px-4 bg-primary text-white font-medium text-sm">
                            R$
                          </span>
                          <input
                            type="text"
                            value={valorTotalStr}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\D/g, "");
                              if (v.length === 0) {
                                const next = [...promocoesList];
                                next[i] = { ...next[i], valorTotal: 0 };
                                setPromocoesList(next);
                                return;
                              }
                              const int = v.replace(/^0+/, "") || "0";
                              const cents = int.slice(-2).padStart(2, "0");
                              const rest = int.slice(0, -2) || "0";
                              const num = parseInt(rest + cents, 10) / 100;
                              const next = [...promocoesList];
                              next[i] = { ...next[i], valorTotal: num };
                              setPromocoesList(next);
                            }}
                            placeholder="0,00"
                            className="flex-1 px-4 py-3 border-0 focus:ring-0 focus:outline-none"
                          />
                        </div>
                      </div>
                      {preenchido && (
                        <>
                          <p className={`text-sm ${invalido ? "text-red-600 font-medium" : "text-gray-700"}`}>
                            Valor de cada número custará: R$ {formatarMoeda(valorPorCota)}
                          </p>
                          {invalido && (
                            <p className="text-sm text-red-600">
                              Valor inválido! O valor total da promoção (R$ {formatarMoeda(item.valorTotal)}) não pode ser maior ou igual ao valor das {item.quantidade} cotas ao preço normal (R$ {formatarMoeda(totalReal)}). A promoção precisa ser um desconto.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setPromocoesList([...promocoesList, { quantidade: 1, valorTotal: 0 }])}
                  className="flex items-center gap-2 text-primary font-medium text-sm hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar mais promoções
                </button>
              </div>
              <div className="p-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={aplicarPromocao}
                  disabled={promocoesList.some(
                    (p) => p.quantidade >= 1 && p.valorTotal > 0 && !promocaoItemValido(p)
                  )}
                  className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                >
                  Aplicar promoção
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const fallbackCriar = (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600">Carregando...</p>
    </div>
  </div>
);

export default function CriarCampanhaPage() {
  return (
    <Suspense fallback={fallbackCriar}>
      <CriarCampanhaContent />
    </Suspense>
  );
}
