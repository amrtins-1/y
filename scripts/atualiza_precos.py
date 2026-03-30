import requests
from bs4 import BeautifulSoup
import json
import os
import re
import unicodedata
from datetime import datetime

# ================= CONFIGURAÇÕES =================
DIR_SCRIPT = os.path.dirname(os.path.abspath(__file__))
# Mantendo sua estrutura de diretórios original
DIR_BASE_ASSETS = os.path.abspath(os.path.join(DIR_SCRIPT, "../src/")) 
DIR_DADOS = os.path.join(DIR_BASE_ASSETS, "data")

CAMINHO_JS = os.path.join(DIR_DADOS, "cotacoes.js")
CAMINHO_HISTORICO = os.path.join(DIR_DADOS, "historico.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

URLS_ALVO = {
    "boi": "https://www.noticiasagricolas.com.br/cotacoes/boi-gordo/",
    "soja": "https://www.noticiasagricolas.com.br/cotacoes/soja/",
    "milho": "https://www.noticiasagricolas.com.br/cotacoes/milho/",
    "cafe": "https://www.noticiasagricolas.com.br/cotacoes/cafe/",
    "arroz": "https://www.noticiasagricolas.com.br/cotacoes/arroz/",
    "algodao": "https://www.noticiasagricolas.com.br/cotacoes/algodao/",
    "trigo": "https://www.noticiasagricolas.com.br/cotacoes/trigo/",
    "feijao": "https://www.noticiasagricolas.com.br/cotacoes/feijao/",
    "suinos": "https://www.noticiasagricolas.com.br/cotacoes/suinos/",
    "frango": "https://www.noticiasagricolas.com.br/cotacoes/frango/",
    "ovos": "https://www.noticiasagricolas.com.br/cotacoes/ovos/",
    "acucar_etanol": "https://www.noticiasagricolas.com.br/cotacoes/sucroenergetico/",
    "leite": "https://www.noticiasagricolas.com.br/cotacoes/leite/",
    "laranja": "https://www.noticiasagricolas.com.br/cotacoes/laranja/",
    "mandioca": "https://www.noticiasagricolas.com.br/cotacoes/mandioca/",
    "dolar": "https://www.noticiasagricolas.com.br/cotacoes/mercado-financeiro/",
    "amendoim": "https://www.noticiasagricolas.com.br/cotacoes/amendoim/",
    "cacau": "https://www.noticiasagricolas.com.br/cotacoes/cacau/",
    "sorgo": "https://www.noticiasagricolas.com.br/cotacoes/sorgo/",
}

# --- FUNÇÕES DE LIMPEZA ---
def limpar_valor(valor_str):
    if not valor_str: return "Indisp."
    match = re.search(r'(-?\d{1,3}(?:\.\d{3})*,\d{2,4})|(-?\d+,\d+)', valor_str)
    return match.group(0) if match else "Indisp."

def str_to_float(valor_str):
    if not valor_str or valor_str == "Indisp.": return 0.0
    try:
        return float(valor_str.replace('.', '').replace(',', '.'))
    except:
        return 0.0

def gerar_slug(texto):
    if not texto: return "geral"
    texto = re.sub(r'\d{1,2}/\d{1,2}(?:/\d{2,4})?', '', texto) 
    nfkd = unicodedata.normalize('NFKD', texto)
    sem_acento = "".join([c for c in nfkd if not unicodedata.combining(c)])
    slug = re.sub(r'[^a-zA-Z0-9\s]', '', sem_acento).strip().lower()
    return re.sub(r'\s+', '_', slug)

# --- CORE DO SCRAPER ---
def extrair_dados():
    print("=== INICIANDO COLETA ESTRUTURADA POR RAIAS ===")
    
    historico_antigo = {}
    if os.path.exists(CAMINHO_HISTORICO):
        try:
            with open(CAMINHO_HISTORICO, "r", encoding="utf-8") as f:
                historico_antigo = json.load(f)
        except:
            historico_antigo = {}

    # Estrutura principal: Raia > Divisória > Item > Atributos
    dados_estruturados = {}
    novo_historico = {}

    for prefixo, url in URLS_ALVO.items():
        print(f"PROCESSANDO {prefixo.upper()}...", end=" ", flush=True)
        dados_estruturados[prefixo] = {}
        
        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            soup = BeautifulSoup(resp.content, 'html.parser')
            tabelas = soup.find_all('table')
            
            for tabela in tabelas:
                # 1. Identificar a Divisória (Título da Tabela)
                titulo_tag = tabela.find_previous(['h2', 'h3', 'div'], class_=['tit-cotacao', 'titulo'])
                slug_tabela = gerar_slug(titulo_tag.get_text(strip=True)) if titulo_tag else "geral"
                
                if slug_tabela not in dados_estruturados[prefixo]:
                    dados_estruturados[prefixo][slug_tabela] = {}

                headers_tab = [gerar_slug(th.get_text(strip=True)) for th in tabela.find_all('th')]
                rows = tabela.find_all('tr')

                for row in rows:
                    cols = row.find_all('td')
                    if not cols or len(cols) < 2: continue
                    
                    # 2. Identificar o Item
                    nome_item_bruto = cols[0].get_text(strip=True)
                    slug_item = gerar_slug(nome_item_bruto)
                    
                    if slug_item not in dados_estruturados[prefixo][slug_tabela]:
                        dados_estruturados[prefixo][slug_tabela][slug_item] = {}

                    # 3. Processar Atributos (Colunas)
                    for i in range(1, len(cols)):
                        valor_bruto = cols[i].get_text(strip=True)
                        valor_limpo = limpar_valor(valor_bruto)
                        
                        if valor_limpo == "Indisp.": continue

                        tipo_coluna = headers_tab[i] if i < len(headers_tab) else f"col_{i}"
                        
                        # Gerar chave única para o histórico (linear como antes para compatibilidade)
                        chave_hist = f"{prefixo}_{slug_tabela}_{slug_item}_{tipo_coluna}"
                        
                        # Cálculo de Status
                        valor_antigo = historico_antigo.get(chave_hist, valor_limpo)
                        v_atual = str_to_float(valor_limpo)
                        v_ant = str_to_float(valor_antigo)

                        status = "equal"
                        if v_atual > v_ant: status = "up"
                        elif v_atual < v_ant: status = "down"

                        # Guardar dado estruturado
                        dados_estruturados[prefixo][slug_tabela][slug_item][tipo_coluna] = {
                            "valor": valor_limpo,
                            "status": status,
                            "label": nome_item_bruto # Mantém o nome original para exibição
                        }
                        
                        # Atualizar histórico
                        novo_historico[chave_hist] = valor_limpo

            print("OK")
        except Exception as e:
            print(f"Erro: {e}")

    # --- SALVAMENTO ---
    os.makedirs(DIR_DADOS, exist_ok=True)
    
    output = {
        "atualizacao": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "raias": dados_estruturados
    }

    # Salva o JS para o Frontend
    with open(CAMINHO_JS, "w", encoding="utf-8") as f:
        f.write(f"export const DADOS_MERCADO = {json.dumps(output, indent=4, ensure_ascii=False)};")
    
    # Salva o JSON de histórico (mantido linear para facilitar a comparação na próxima execução)
    with open(CAMINHO_HISTORICO, "w", encoding="utf-8") as f:
        json.dump(novo_historico, f, indent=4, ensure_ascii=False)

    print(f"Concluido! Dados organizados em {len(dados_estruturados)} raias.")

if __name__ == "__main__":
    extrair_dados()
