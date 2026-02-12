// Persistência em arquivo para desenvolvimento
// Em produção, substitua por um banco de dados real

import { Campanha } from "./api";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "campanhas.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadCampanhas(): Campanha[] {
  try {
    ensureDataDir();
    if (fs.existsSync(FILE_PATH)) {
      const data = fs.readFileSync(FILE_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Erro ao carregar campanhas:", e);
  }
  return [];
}

function saveCampanhas(campanhas: Campanha[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(FILE_PATH, JSON.stringify(campanhas, null, 2), "utf-8");
  } catch (e) {
    console.error("Erro ao salvar campanhas:", e);
    throw e;
  }
}

export function getCampanhas(): Campanha[] {
  return loadCampanhas();
}

export function getCampanha(id: string): Campanha | undefined {
  return loadCampanhas().find((c) => c.id === id);
}

export function createCampanha(data: Omit<Campanha, "id" | "createdAt">): Campanha {
  const campanhas = loadCampanhas();
  const novaCampanha: Campanha = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  campanhas.push(novaCampanha);
  saveCampanhas(campanhas);
  return novaCampanha;
}

export function updateCampanha(
  id: string,
  data: Partial<Campanha>
): Campanha | undefined {
  const campanhas = loadCampanhas();
  const index = campanhas.findIndex((c) => c.id === id);
  if (index === -1) return undefined;

  campanhas[index] = { ...campanhas[index], ...data };
  saveCampanhas(campanhas);
  return campanhas[index];
}

export function deleteCampanha(id: string): boolean {
  const campanhas = loadCampanhas();
  const index = campanhas.findIndex((c) => c.id === id);
  if (index === -1) return false;

  campanhas.splice(index, 1);
  saveCampanhas(campanhas);
  return true;
}
