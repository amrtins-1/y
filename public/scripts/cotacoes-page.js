(function() {
    'use strict';

    // =========================================
    // FUNÇÕES AUXILIARES
    // =========================================
    
    function switchTab(tabId, btn) {
        document.querySelectorAll('.asset-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.quote-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = document.getElementById('tab-' + tabId);
        if (panel) panel.classList.add('active');
    }

    function formatarValor(valorStr) {
        if (!valorStr || valorStr === 'Indisp.' || valorStr === '--') return '--';
        // Remove pontos de milhar e troca vírgula por ponto
        const limpo = valorStr.replace(/\./g, '').replace(',', '.');
        const numero = parseFloat(limpo);
        if (isNaN(numero)) return valorStr;
        return numero.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
    }

    function formatarDetalheSlug(chave) {
        let limpo = chave.replace(/^(boi|soja|milho|cafe|arroz|feijao|trigo|algodao|suinos|suino|frango|ovos|dolar|leite|acucar|etanol|cacau|laranja|mandioca|sorgo|amendoim)_/, '');
        const ignorar = ['indicador', 'mercado', 'fisico', 'cepea', 'esalq', 'geral', 'scot', 'consultoria', 'b3', 'nybot', 'pregao', 'regular', 'do', 'gordo', 'boi', 'da', 'de', 'cepeaesalq', 'esalqb3', 'cambio', 'ptax'];
        const partes = limpo.split('_');
        const partesUteis = partes.filter(p => !ignorar.includes(p) && p.length > 1);
        if (partesUteis.length === 0) return '';
        return partesUteis.slice(0, 2).map(word => {
            if(word.length <= 2) return word.toUpperCase();
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
    }

    function obterNomeProduto(chave) {
        const chaveLower = chave.toLowerCase();
        const mapeamento = {
            'dolar': { nome: 'Dólar', i18n: 'prod_dollar' },
            'euro': { nome: 'Euro', i18n: 'prod_euro' },
            'bezerro': { nome: 'Bezerro', i18n: 'prod_calf' },
            'boi': { nome: 'Boi Gordo', i18n: 'prod_cattle' },
            'soja': { nome: 'Soja', i18n: 'prod_soy' },
            'milho': { nome: 'Milho', i18n: 'prod_corn' },
            'cafe': { nome: 'Café', i18n: 'prod_coffee_arabica' },
            'algodao': { nome: 'Algodão', i18n: 'prod_cotton' },
            'trigo': { nome: 'Trigo', i18n: 'prod_wheat' },
            'feijao': { nome: 'Feijão', i18n: 'prod_bean_carioca' },
            'arroz': { nome: 'Arroz', i18n: 'prod_rice_husk' },
            'suinos': { nome: 'Suínos', i18n: 'quote_widget_swine' },
            'suino': { nome: 'Suínos', i18n: 'quote_widget_swine' },
            'frango': { nome: 'Frango', i18n: 'prod_chicken_frozen' },
            'leite': { nome: 'Leite', i18n: 'prod_milk_producer' },
            'acucar': { nome: 'Açúcar', i18n: 'prod_sugar_crystal' },
            'etanol': { nome: 'Etanol', i18n: 'prod_ethanol_hydrous' },
            'laranja': { nome: 'Laranja', i18n: 'prod_orange_pear' },
            'mandioca': { nome: 'Mandioca', i18n: 'prod_cassava_root' },
            'cacau': { nome: 'Cacau', i18n: 'prod_cocoa' },
            'ovos': { nome: 'Ovos', i18n: 'prod_eggs_white' },
            'sorgo': { nome: 'Sorgo', i18n: 'prod_sorghum' },
            'amendoim': { nome: 'Amendoim', i18n: 'prod_peanut_shell' }
        };
        
        if (chaveLower.includes('bezerro')) return mapeamento['bezerro'];
        
        for (const [key, value] of Object.entries(mapeamento)) {
            if (chaveLower.includes(key)) return value;
        }
        return null;
    }

    // =========================================
    // BUSCA DE COTAÇÕES - ALGORITMO MELHORADO
    // =========================================
    
    function encontrarCotacao(todasCotacoes, keywordsStr) {
        if (!keywordsStr) return null;
        
        const keywordsLower = keywordsStr.toLowerCase();
        const chaves = Object.keys(todasCotacoes);
        
        // PRIMEIRO: Busca exata - se o keywords é uma chave completa ou quase completa
        const chaveExata = chaves.find(c => c.toLowerCase().includes(keywordsLower) || keywordsLower.includes(c.toLowerCase()));
        if (chaveExata) {
            return { nome: chaveExata, dados: todasCotacoes[chaveExata] };
        }
        
        // SEGUNDO: Busca por termos separados por vírgula ou underscore
        const termos = keywordsLower.split(/[,_\s]+/).map(s => s.trim()).filter(s => s.length > 0);
        
        if (termos.length === 0) return null;
        
        // Encontra todas as chaves que contêm TODOS os termos
        const chavesCorrespondentes = chaves.filter(chave => {
            const chaveLower = chave.toLowerCase();
            return termos.every(termo => chaveLower.includes(termo));
        });
        
        if (chavesCorrespondentes.length === 0) {
            // Fallback: tenta encontrar a chave com mais correspondências
            let melhorChave = null;
            let maxCorrespondencias = 0;
            
            chaves.forEach(chave => {
                const chaveLower = chave.toLowerCase();
                const correspondencias = termos.filter(termo => chaveLower.includes(termo)).length;
                if (correspondencias > maxCorrespondencias) {
                    maxCorrespondencias = correspondencias;
                    melhorChave = chave;
                }
            });
            
            if (melhorChave && maxCorrespondencias >= Math.ceil(termos.length * 0.6)) {
                return { nome: melhorChave, dados: todasCotacoes[melhorChave] };
            }
            return null;
        }
        
        // Se há múltiplas correspondências, prioriza:
        // 1. Chaves com 'indicador' ou 'cepea' ou 'esalq' (indicadores oficiais)
        // 2. Chaves com 'geral' (valores gerais)
        // 3. A chave mais curta (mais específica)
        
        let chavePrioritaria = chavesCorrespondentes.find(c => 
            c.includes('indicador') || c.includes('cepea') || c.includes('esalq')
        );
        
        if (!chavePrioritaria) {
            chavePrioritaria = chavesCorrespondentes.find(c => c.includes('geral'));
        }
        
        if (!chavePrioritaria) {
            // Seleciona a chave mais curta (mais específica)
            chavePrioritaria = chavesCorrespondentes.sort((a, b) => a.length - b.length)[0];
        }
        
        return { nome: chavePrioritaria, dados: todasCotacoes[chavePrioritaria] };
    }

    // =========================================
    // TICKER - MAIORES ALTAS E QUEDAS
    // =========================================
    
    function isPriorityItem(chave) {
        const priorityKeywords = [
            'indicador', 'cepea', 'esalq', 'b3', 'ptax',
            'media_sp', 'paranagua', 'parana'
        ];
        const chaveLower = chave.toLowerCase();
        return priorityKeywords.some(kw => chaveLower.includes(kw));
    }

    function construirTicker(precos) {
        const tickerContainer = document.getElementById('dynamic-ticker');
        if (!tickerContainer) return;

        tickerContainer.innerHTML = '';
        
        const entradas = Object.entries(precos);
        
        // Filtra itens com status up ou down e valor válido
        const comMovimentacao = entradas.filter(([k, v]) => {
            if (v.status !== 'up' && v.status !== 'down') return false;
            if (!v.valor || v.valor === "Indisp." || v.valor === "0,00") return false;
            return true;
        });

        // Separa altas e quedas
        const altas = comMovimentacao.filter(([k, v]) => v.status === 'up');
        const quedas = comMovimentacao.filter(([k, v]) => v.status === 'down');

        // Prioriza indicadores principais
        const altasPrioritarias = altas.filter(([k]) => isPriorityItem(k));
        const altasSecundarias = altas.filter(([k]) => !isPriorityItem(k));
        const quedasPrioritarias = quedas.filter(([k]) => isPriorityItem(k));
        const quedasSecundarias = quedas.filter(([k]) => !isPriorityItem(k));

        // Monta a lista final alternando entre altas e quedas
        let listaFinal = [
            ...altasPrioritarias.slice(0, 8),
            ...quedasPrioritarias.slice(0, 8),
            ...altasSecundarias.slice(0, 6),
            ...quedasSecundarias.slice(0, 6)
        ];

        // Se não tem movimentação suficiente, adiciona itens estáveis importantes
        if (listaFinal.length < 10) {
            const estaticos = entradas.filter(([k, v]) => {
                if (v.status === 'up' || v.status === 'down') return false;
                if (!v.valor || v.valor === "Indisp." || v.valor === "0,00") return false;
                return isPriorityItem(k);
            }).slice(0, 10 - listaFinal.length);
            listaFinal = [...listaFinal, ...estaticos];
        }

        // Remove duplicatas por produto
        const produtosVistos = new Set();
        const listaSemDuplicatas = [];
        
        listaFinal.forEach(([chaveLonga, dados]) => {
            const produto = obterNomeProduto(chaveLonga);
            const detalhe = formatarDetalheSlug(chaveLonga);
            const chaveUnica = produto ? `${produto.nome}-${detalhe}` : chaveLonga;
            
            if (!produtosVistos.has(chaveUnica)) {
                produtosVistos.add(chaveUnica);
                listaSemDuplicatas.push([chaveLonga, dados]);
            }
        });

        // Renderiza os itens do ticker
        listaSemDuplicatas.forEach(([chaveLonga, dados]) => {
            const produto = obterNomeProduto(chaveLonga);
            const detalhe = formatarDetalheSlug(chaveLonga);
            const div = document.createElement('div');
            div.className = 't-item';

            let colorClass = '';
            let icon = '';

            if (dados.status === 'up') {
                colorClass = 't-up';
                icon = '<i class="fas fa-caret-up"></i>';
            } else if (dados.status === 'down') {
                colorClass = 't-down';
                icon = '<i class="fas fa-caret-down"></i>';
            }

            let nomeHtml = '';
            if (produto) {
                const detalheHtml = detalhe ? `<span class="t-detail">${detalhe}</span>` : '';
                nomeHtml = `<span class="t-name"><span data-i18n="${produto.i18n}">${produto.nome}</span> ${detalheHtml}</span>`;
            } else {
                nomeHtml = `<span class="t-name">${detalhe || 'MERCADO'}</span>`;
            }

            div.innerHTML = `${nomeHtml} <span class="t-val ${colorClass}">${icon} R$ ${formatarValor(dados.valor)}</span>`;
            tickerContainer.appendChild(div);
        });

        // Duplica os itens para criar loop infinito suave
        if (listaSemDuplicatas.length > 0) {
            const clone = tickerContainer.innerHTML;
            tickerContainer.innerHTML += clone;
        }
    }

    // =========================================
    // CARREGAMENTO PRINCIPAL DOS DADOS
    // =========================================
    
    function carregarDados() {
        if (typeof window.DADOS_MERCADO === 'undefined') {
            console.error("ERRO: cotacoes.js não encontrado.");
            const el = document.getElementById('last-update');
            if (el) el.innerText = "Dados indisponíveis";
            return;
        }

        const json = window.DADOS_MERCADO;
        const precos = json.precos;

        // Atualiza timestamp
        const lastUpdateEl = document.getElementById('last-update');
        if (lastUpdateEl && json.atualizacao) {
            lastUpdateEl.innerText = json.atualizacao;
        }

        // Log para debug
        console.log('📊 Dados carregados:', Object.keys(precos).length, 'cotações');

        // Preenche os elementos com data-keywords
        const elementosParaPreencher = document.querySelectorAll('[data-keywords]');
        console.log('🔍 Elementos para preencher:', elementosParaPreencher.length);
        
        elementosParaPreencher.forEach(el => {
            const keywords = el.getAttribute('data-keywords');
            const resultado = encontrarCotacao(precos, keywords);
            
            // Remove classes anteriores
            el.classList.remove('loading', 't-up', 't-down');

            if (resultado) {
                const dados = resultado.dados;
                el.innerHTML = "R$ " + formatarValor(dados.valor);
                
                if (dados.status === 'up') {
                    el.classList.add('t-up');
                    el.innerHTML += ' <i class="fas fa-arrow-up" style="font-size: 0.7em; margin-left: 5px;"></i>';
                } else if (dados.status === 'down') {
                    el.classList.add('t-down');
                    el.innerHTML += ' <i class="fas fa-arrow-down" style="font-size: 0.7em; margin-left: 5px;"></i>';
                }
                
                // Debug: mostra qual chave foi encontrada
                // console.log(`✅ ${keywords} → ${resultado.nome} = ${dados.valor}`);
            } else {
                el.innerText = "--";
                console.warn(`❌ Não encontrado: ${keywords}`);
            }
        });

        // Constrói o ticker
        construirTicker(precos);

        // Atualiza traduções se disponível
        if (typeof setLanguage === 'function' && typeof currentLang !== 'undefined') {
            setLanguage(currentLang);
        }
    }

    // =========================================
    // INICIALIZAÇÃO
    // =========================================
    
    window.switchTab = switchTab;
    
    // Carrega quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', carregarDados);
    } else {
        carregarDados();
    }
})();
