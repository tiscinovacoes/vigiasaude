/**
 * validate-cns.ts — Validação de Cartão Nacional de Saúde (CNS)
 * Algoritmo conforme Ministério da Saúde
 */

/**
 * Valida Cartão Nacional de Saúde (CNS) conforme algoritmo MinSaúde
 * Suporta formatos antigos (inicia com 1, 2) e novos (inicia com 7, 8, 9)
 *
 * @param cns - String com dígitos ou formatada
 * @returns boolean - true se CNS é válido
 */
export function validateCNS(cns: string): boolean {
  const cleanCNS = cns.replace(/\D/g, "");

  if (cleanCNS.length !== 15) return false;

  // Formato antigo (1, 2) — baseado em PIS
  if (["1", "2"].includes(cleanCNS[0])) {
    const pis = cleanCNS.substring(0, 11);
    let soma = 0;
    for (let i = 0; i < 11; i++) {
      soma += parseInt(pis[i]) * (15 - i);
    }

    let resto = soma % 11;
    let dv = 11 - resto;

    if (dv === 11) dv = 0;

    if (dv === 10) {
      soma = 0;
      for (let i = 0; i < 11; i++) {
        soma += parseInt(pis[i]) * (15 - i);
      }
      soma += 2;
      resto = soma % 11;
      dv = 11 - resto;
      return cleanCNS === pis + "001" + dv.toString();
    } else {
      return cleanCNS === pis + "000" + dv.toString();
    }
  }

  // Formato novo (7, 8, 9) — checksum simples
  if (["7", "8", "9"].includes(cleanCNS[0])) {
    let soma = 0;
    for (let i = 0; i < 15; i++) {
      soma += parseInt(cleanCNS[i]) * (15 - i);
    }
    return soma % 11 === 0;
  }

  return false;
}

/**
 * Formata CNS para exibição: 123 4567 8901 2345
 *
 * @param cns - String com dígitos
 * @returns String formatada com espaços
 */
export function formatCNS(cns: string): string {
  const clean = cns.replace(/\D/g, "");
  if (clean.length === 0) return "";
  if (clean.length <= 3) return clean;
  if (clean.length <= 7) return clean.replace(/(\d{3})(\d+)/, "$1 $2");
  if (clean.length <= 11) return clean.replace(/(\d{3})(\d{4})(\d+)/, "$1 $2 $3");
  return clean.replace(/(\d{3})(\d{4})(\d{4})(\d{4})/, "$1 $2 $3 $4");
}

/**
 * Normaliza CPF para busca (remove tudo que não é dígito)
 *
 * @param cpf - String com dígitos ou formatada
 * @returns String com 11 dígitos ou menos
 */
export function normalizeCPF(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

/**
 * Normaliza CNS para busca (remove tudo que não é dígito)
 *
 * @param cns - String com dígitos ou formatada
 * @returns String com até 15 dígitos
 */
export function normalizeCNS(cns: string): string {
  return cns.replace(/\D/g, "");
}
