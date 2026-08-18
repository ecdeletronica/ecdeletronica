// js/modules/orcamento.js - Sistema de Orçamento para ECD Eletrônica
// Versao ESTAVEL v4.0 - CORRECAO: WhatsApp e PDF do Recibo com funcoes embutidas
console.log('orcamento.js carregado - Versao ESTAVEL v4.0');

// ============================================================
// CONFIGURACOES
// ============================================================

var ORCAMENTO_CONFIG = {
    password: "ecd60",
    storageKey: "ecd_orcamentos",
    empresa: {
        nome: "ECD Eletronica",
        cnpj: "57.104.492/0001-82",
        endereco: "R. Monsenhor Luiz Barbosa, n 60, Bairro Prado, Maceio - AL",
        cep: "57010-262",
        email: "elaylton95@gmail.com",
        pix: "82988998040",
        telefone: "(82) 9.9946-8040",
        whatsapp: "5582999468040",
        site: "http://ecdeletronica.com.br",
        logo: "assets/images/logo-ecd.jpg"
    },
    proponente: {
        nome: "ELAYLTON CAVALCANTE DAMASCENO",
        cnpj: "57.104.492/0001-82",
        endereco: "R. Monsenhor Luiz Barbosa, n 60, Bairro Prado, Maceio - AL",
        cep: "57010-262",
        email: "elaylton95@gmail.com",
        pix: "82988998040"
    },
    banco: {
        nome: "Banco do Brasil",
        agencia: "1234-5",
        conta: "67890-1",
        tipo: "Corrente",
        pix: "82988998040",
        chave_pix: "82988998040"
    }
};

// ============================================================
// FUNCAO PARA GERAR NUMERO DO ORCAMENTO COM DIA
// ============================================================

function gerarNumeroOrcamento() {
    var agora = new Date();
    var ano = agora.getFullYear();
    var dia = String(agora.getDate()).padStart(2, '0');
    var ultimo = window.orcamentos.length || 0;
    var sequencial = String(ultimo + 1).padStart(4, '0');
    return "ECD-" + ano + "-" + dia + "-" + sequencial;
}

// ============================================================
// FUNCOES DE FORMATACAO (globais)
// ============================================================

function formatarMoedaGlobal(valor) {
    if (!valor && valor !== 0) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(valor);
}

function formatarDataGlobal(data) {
    if (!data) return "";
    try {
        var d = new Date(data);
        return d.toLocaleDateString("pt-BR");
    } catch (e) {
        return data;
    }
}

function formatarDataHoraGlobal(data) {
    if (!data) return "";
    try {
        var d = new Date(data);
        return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR");
    } catch (e) {
        return data;
    }
}

function converterValorPorExtenso(valor) {
    if (!valor || valor === 0) return "Zero reais";
    
    var partes = valor.toFixed(2).split('.');
    var reais = parseInt(partes[0]);
    var centavos = parseInt(partes[1]);
    
    var extenso = "";
    
    if (reais > 0) {
        extenso = numeroPorExtenso(reais) + " reais";
    }
    if (centavos > 0) {
        if (extenso) extenso += " e ";
        extenso += numeroPorExtenso(centavos) + " centavos";
    }
    return extenso.charAt(0).toUpperCase() + extenso.slice(1);
}

function numeroPorExtenso(num) {
    var unidades = ["", "um", "dois", "tres", "quatro", "cinco", "seis", "sete", "oito", "nove"];
    var especiais = ["dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
    var dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
    var centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
    
    if (num === 0) return "zero";
    if (num === 100) return "cem";
    
    var extenso = "";
    
    if (num >= 1000) {
        var milhares = Math.floor(num / 1000);
        var resto = num % 1000;
        if (milhares === 1) {
            extenso += "mil";
        } else {
            extenso += numeroPorExtenso(milhares) + " mil";
        }
        if (resto > 0) {
            extenso += " e " + numeroPorExtenso(resto);
        }
        return extenso;
    }
    
    if (num >= 100) {
        var centena = Math.floor(num / 100);
        var resto = num % 100;
        if (centena === 1 && resto === 0) {
            return "cem";
        }
        extenso += centenas[centena];
        if (resto > 0) {
            extenso += " e " + numeroPorExtenso(resto);
        }
        return extenso;
    }
    
    if (num >= 20) {
        var dezena = Math.floor(num / 10);
        var unidade = num % 10;
        extenso += dezenas[dezena];
        if (unidade > 0) {
            extenso += " e " + unidades[unidade];
        }
        return extenso;
    }
    
    if (num >= 10) {
        return especiais[num - 10];
    }
    
    return unidades[num];
}

function calcularTotalItens(itens) {
    if (!itens || !itens.length) return 0;
    var total = 0;
    for (var i = 0; i < itens.length; i++) {
        var subtotal = (itens[i].quantidade || 0) * (itens[i].valor_unitario || 0);
        total = total + subtotal;
    }
    return total;
}

// ============================================================
// FUNCAO DE FORMATACAO CPF/CNPJ
// ============================================================

function formatarCpfCnpj(valor) {
    if (!valor) return '';
    var numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 11) {
        if (numeros.length <= 3) return numeros;
        if (numeros.length <= 6) return numeros.substring(0, 3) + '.' + numeros.substring(3);
        if (numeros.length <= 9) return numeros.substring(0, 3) + '.' + numeros.substring(3, 6) + '.' + numeros.substring(6);
        return numeros.substring(0, 3) + '.' + numeros.substring(3, 6) + '.' + numeros.substring(6, 9) + '-' + numeros.substring(9, 11);
    } else {
        if (numeros.length <= 2) return numeros;
        if (numeros.length <= 5) return numeros.substring(0, 2) + '.' + numeros.substring(2);
        if (numeros.length <= 8) return numeros.substring(0, 2) + '.' + numeros.substring(2, 5) + '.' + numeros.substring(5);
        if (numeros.length <= 12) return numeros.substring(0, 2) + '.' + numeros.substring(2, 5) + '.' + numeros.substring(5, 8) + '/' + numeros.substring(8);
        return numeros.substring(0, 2) + '.' + numeros.substring(2, 5) + '.' + numeros.substring(5, 8) + '/' + numeros.substring(8, 12) + '-' + numeros.substring(12, 14);
    }
}

function configurarFormatacaoCpfCnpj() {
    var input = document.getElementById('orcamentoCnpj');
    if (!input) return;
    
    var novoInput = input.cloneNode(true);
    input.parentNode.replaceChild(novoInput, input);
    input = document.getElementById('orcamentoCnpj');
    
    input.addEventListener('input', function(e) {
        var raw = this.value.replace(/\D/g, '');
        if (raw.length === 0) {
            this.value = '';
            return;
        }
        this.value = formatarCpfCnpj(raw);
    });
    
    input.addEventListener('blur', function() {
        var raw = this.value.replace(/\D/g, '');
        if (raw.length > 0) {
            this.value = formatarCpfCnpj(raw);
        }
    });
}

// ============================================================
// FUNCAO PARA FORMATAR CAMPO DESCONTO
// ============================================================

function configurarFormatacaoDesconto() {
    var input = document.getElementById('orcamentoDesconto');
    if (!input) return;
    
    var novoInput = input.cloneNode(true);
    input.parentNode.replaceChild(novoInput, input);
    input = document.getElementById('orcamentoDesconto');
    
    input.addEventListener('blur', function() {
        var raw = this.value.replace(/[^\d,]/g, '').replace(',', '.');
        var num = parseFloat(raw);
        if (!isNaN(num) && num > 0) {
            this.value = num.toFixed(2).replace('.', ',');
        } else {
            this.value = '0,00';
        }
        recalcularTotais();
    });
    
    input.addEventListener('input', function() {
        this.value = this.value.replace(/[^\d,]/g, '');
        recalcularTotais();
    });
}

// ============================================================
// FUNCAO PARA FORMATAR VALORES MONETARIOS DOS ITENS
// ============================================================

function configurarFormatacaoValor() {
    var inputs = document.querySelectorAll('.item-valor');
    for (var i = 0; i < inputs.length; i++) {
        (function(input) {
            input.addEventListener('blur', function() {
                var raw = this.value.replace(/[^\d,]/g, '').replace(',', '.');
                var num = parseFloat(raw);
                if (!isNaN(num) && num > 0) {
                    this.value = num.toFixed(2).replace('.', ',');
                } else {
                    this.value = '0,00';
                }
                var idx = parseInt(this.dataset.index);
                if (!isNaN(idx) && window.orcamentoItens[idx]) {
                    window.orcamentoItens[idx].valor_unitario = parseFloat(this.value.replace(',', '.')) || 0;
                    recalcularTotais();
                }
            });
        })(inputs[i]);
    }
}

// ============================================================
// ESTADO GLOBAL
// ============================================================

window.orcamentos = [];
window.orcamentoEditandoId = null;
window.orcamentoItens = [];

// ============================================================
// FUNCOES DE STORAGE
// ============================================================

function salvarOrcamentos() {
    try {
        localStorage.setItem(ORCAMENTO_CONFIG.storageKey, JSON.stringify(window.orcamentos));
        console.log("Orcamentos salvos com sucesso!");
        return true;
    } catch (error) {
        console.error("Erro ao salvar orcamentos:", error);
        return false;
    }
}

function carregarOrcamentos() {
    try {
        var stored = localStorage.getItem(ORCAMENTO_CONFIG.storageKey);
        if (stored) {
            window.orcamentos = JSON.parse(stored);
            console.log("" + window.orcamentos.length + " orcamentos carregados.");
        } else {
            window.orcamentos = [];
            console.log("Nenhum orcamento encontrado.");
        }
        return true;
    } catch (error) {
        console.error("Erro ao carregar orcamentos:", error);
        window.orcamentos = [];
        return false;
    }
}

// ============================================================
// FUNCOES DA PLANILHA (Itens)
// ============================================================

function adicionarItemLinha() {
    console.log('adicionarItemLinha chamado');
    var tbody = document.getElementById("orcamentoItemsBody");
    if (!tbody) {
        console.error('orcamentoItemsBody nao encontrado');
        return;
    }
    
    var index = window.orcamentoItens.length;
    var linha = document.createElement("tr");
    
    var html = '';
    html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 6px; text-align:center; background:#d4d0c8; font-weight:700; font-size:0.65rem; font-family:\'Courier New\',monospace;">' + (index + 1) + '</td>';
    html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;"><input type="text" class="item-descricao" placeholder="Descricao do servico" data-index="' + index + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:100%; background:#f0f0f0; font-family:\'Courier New\',monospace; font-size:0.7rem; color:#000000; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);"></td>';
    html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;"><input type="text" class="item-unidade" value="UN" data-index="' + index + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:38px; background:#f0f0f0; font-family:\'Courier New\',monospace; font-size:0.7rem; color:#000000; text-align:center; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);"></td>';
    html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;"><input type="number" class="item-quantidade" value="1" min="1" data-index="' + index + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:38px; background:#f0f0f0; font-family:\'Courier New\',monospace; font-size:0.7rem; color:#000000; text-align:center; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);"></td>';
    html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;"><input type="text" class="item-valor" value="0,00" data-index="' + index + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:75px; background:#f0f0f0; font-family:\'Courier New\',monospace; font-size:0.7rem; color:#000000; text-align:right; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);"></td>';
    html += '<td class="item-subtotal" data-index="' + index + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 6px; text-align:right; background:#ece9d8; font-family:\'Courier New\',monospace; font-size:0.7rem; font-weight:700;">R$ 0,00</td>';
    html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; text-align:center; background:#d4d0c8;"><button type="button" class="remover-item" data-index="' + index + '" style="background:#f39c12; color:#ffffff; border:2px solid #e67e22; border-top-color:#f1c40f; border-left-color:#f1c40f; padding:0 6px; cursor:pointer; font-size:0.6rem; font-family:\'Courier New\',monospace; font-weight:700; border-radius:0px;" title="Remover item"><i class="fas fa-trash" style="color:#ffffff;"></i></button></td>';
    
    linha.innerHTML = html;
    tbody.appendChild(linha);
    window.orcamentoItens.push({ descricao: "", unidade: "UN", quantidade: 1, valor_unitario: 0 });
    
    atualizarIndicesItens();
    configurarEventosItens();
    configurarFormatacaoValor();
    recalcularTotais();
    console.log('Item adicionado, total de itens:', window.orcamentoItens.length);
}

function removerItemLinha(index) {
    if (window.orcamentoItens.length <= 1) {
        mostrarNotificacao("Mantenha pelo menos um item.", "warning");
        return;
    }
    if (!confirm("Remover este item?")) return;
    window.orcamentoItens.splice(index, 1);
    var tbody = document.getElementById("orcamentoItemsBody");
    if (tbody) {
        var rows = tbody.querySelectorAll("tr");
        if (rows[index]) rows[index].remove();
    }
    atualizarIndicesItens();
    recalcularTotais();
    mostrarNotificacao("Item removido com sucesso!", "success");
}

function atualizarIndicesItens() {
    var tbody = document.getElementById("orcamentoItemsBody");
    if (!tbody) return;
    var rows = tbody.querySelectorAll("tr");
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var inputs = row.querySelectorAll("input");
        for (var j = 0; j < inputs.length; j++) {
            inputs[j].dataset.index = i;
        }
        var subtotal = row.querySelector(".item-subtotal");
        if (subtotal) subtotal.dataset.index = i;
        var removerBtn = row.querySelector(".remover-item");
        if (removerBtn) removerBtn.dataset.index = i;
        var numCell = row.querySelector("td:first-child");
        if (numCell) numCell.textContent = i + 1;
    }
}

function configurarEventosItens() {
    var tbody = document.getElementById("orcamentoItemsBody");
    if (!tbody) return;
    
    var descricoes = tbody.querySelectorAll(".item-descricao");
    for (var i = 0; i < descricoes.length; i++) {
        descricoes[i].oninput = function() {
            var idx = parseInt(this.dataset.index);
            if (!isNaN(idx) && window.orcamentoItens[idx]) {
                window.orcamentoItens[idx].descricao = this.value;
            }
        };
    }
    
    var unidades = tbody.querySelectorAll(".item-unidade");
    for (var i = 0; i < unidades.length; i++) {
        unidades[i].oninput = function() {
            var idx = parseInt(this.dataset.index);
            if (!isNaN(idx) && window.orcamentoItens[idx]) {
                window.orcamentoItens[idx].unidade = this.value || "UN";
            }
        };
    }
    
    var quantidades = tbody.querySelectorAll(".item-quantidade");
    for (var i = 0; i < quantidades.length; i++) {
        quantidades[i].oninput = function() {
            var idx = parseInt(this.dataset.index);
            if (!isNaN(idx) && window.orcamentoItens[idx]) {
                window.orcamentoItens[idx].quantidade = parseFloat(this.value) || 0;
                recalcularTotais();
            }
        };
    }
    
    var valores = tbody.querySelectorAll(".item-valor");
    for (var i = 0; i < valores.length; i++) {
        (function(input) {
            input.oninput = function() {
                var idx = parseInt(this.dataset.index);
                if (!isNaN(idx) && window.orcamentoItens[idx]) {
                    var valor = this.value.replace(/[^\d,]/g, "").replace(",", ".");
                    window.orcamentoItens[idx].valor_unitario = parseFloat(valor) || 0;
                    recalcularTotais();
                }
            };
            input.addEventListener("blur", function() {
                var idx = parseInt(this.dataset.index);
                if (!isNaN(idx) && window.orcamentoItens[idx]) {
                    var val = window.orcamentoItens[idx].valor_unitario;
                    if (val > 0) {
                        this.value = formatarMoedaGlobal(val).replace("R$ ", "");
                    } else {
                        this.value = "0,00";
                    }
                    recalcularTotais();
                }
            });
        })(valores[i]);
    }
    
    var removeBtns = tbody.querySelectorAll(".remover-item");
    for (var i = 0; i < removeBtns.length; i++) {
        removeBtns[i].onclick = function() {
            var idx = parseInt(this.dataset.index);
            if (!isNaN(idx)) removerItemLinha(idx);
        };
    }
}

function recalcularTotais() {
    var tbody = document.getElementById("orcamentoItemsBody");
    if (!tbody) return;
    
    var rows = tbody.querySelectorAll("tr");
    var subtotalGeral = 0;
    
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var descricao = row.querySelector(".item-descricao") ? row.querySelector(".item-descricao").value : "";
        var unidade = row.querySelector(".item-unidade") ? row.querySelector(".item-unidade").value : "UN";
        var quantidade = parseFloat(row.querySelector(".item-quantidade") ? row.querySelector(".item-quantidade").value : 0) || 0;
        var valorStr = row.querySelector(".item-valor") ? row.querySelector(".item-valor").value : "0,00";
        var valor = parseFloat(valorStr.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
        var subtotal = quantidade * valor;
        var subtotalCell = row.querySelector(".item-subtotal");
        if (subtotalCell) subtotalCell.textContent = formatarMoedaGlobal(subtotal);
        if (window.orcamentoItens[i]) {
            window.orcamentoItens[i] = { descricao: descricao, unidade: unidade, quantidade: quantidade, valor_unitario: valor };
        }
        subtotalGeral = subtotalGeral + subtotal;
    }
    
    var subtotalEl = document.getElementById("orcamentoSubtotal");
    if (subtotalEl) subtotalEl.textContent = formatarMoedaGlobal(subtotalGeral);
    
    var descontoInput = document.getElementById("orcamentoDesconto");
    var desconto = 0;
    if (descontoInput) {
        var descontoStr = descontoInput.value.replace(/[^\d,]/g, "").replace(",", ".");
        desconto = parseFloat(descontoStr) || 0;
        if (desconto > subtotalGeral) desconto = subtotalGeral;
    }
    var total = subtotalGeral - desconto;
    var totalEl = document.getElementById("orcamentoTotal");
    if (totalEl) totalEl.textContent = formatarMoedaGlobal(total);
    var totalHidden = document.getElementById("orcamentoTotalHidden");
    if (totalHidden) totalHidden.value = total;
}

// ============================================================
// FUNCOES DO FORMULARIO
// ============================================================

function resetOrcamentoForm() {
    var ids = ["orcamentoCliente", "orcamentoCnpj", "orcamentoEndereco", "orcamentoData", "orcamentoPrazo", "orcamentoObservacoes", "orcamentoDesconto"];
    for (var i = 0; i < ids.length; i++) {
        var el = document.getElementById(ids[i]);
        if (el) el.value = "";
    }
    var statusSelect = document.getElementById("orcamentoStatus");
    if (statusSelect) statusSelect.value = "Pendente";
    var dataEl = document.getElementById("orcamentoData");
    if (dataEl) {
        var hoje = new Date().toISOString().split("T")[0];
        dataEl.value = hoje;
    }
    var prazoEl = document.getElementById("orcamentoPrazo");
    if (prazoEl) {
        var prazo = new Date();
        prazo.setDate(prazo.getDate() + 7);
        prazoEl.value = prazo.toISOString().split("T")[0];
    }
    window.orcamentoItens = [];
    var tbody = document.getElementById("orcamentoItemsBody");
    if (tbody) tbody.innerHTML = "";
    adicionarItemLinha();
    window.orcamentoEditandoId = null;
    var titulo = document.getElementById("orcamentoFormTitle");
    if (titulo) titulo.textContent = "Novo Orcamento";
    var submitBtn = document.getElementById("orcamentoSubmitBtn");
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Criar Orcamento';
        submitBtn.style.background = "#27ae60";
        submitBtn.style.color = "#ffffff";
    }
    var cancelBtn = document.getElementById("orcamentoCancelBtn");
    if (cancelBtn) cancelBtn.style.display = "none";
    
    configurarFormatacaoDesconto();
    recalcularTotais();
}

function carregarOrcamentoParaEdicao(id) {
    var orcamento = null;
    for (var i = 0; i < window.orcamentos.length; i++) {
        if (window.orcamentos[i].id === id) {
            orcamento = window.orcamentos[i];
            break;
        }
    }
    if (!orcamento) {
        mostrarNotificacao("Orcamento nao encontrado!", "error");
        return;
    }
    var panel = document.getElementById("orcamentoPanel");
    if (panel && panel.style.display !== "block") {
        panel.style.display = "block";
    }
    switchOrcamentoTab("form");
    document.getElementById("orcamentoCliente").value = orcamento.cliente || "";
    document.getElementById("orcamentoCnpj").value = orcamento.cnpj || "";
    document.getElementById("orcamentoEndereco").value = orcamento.endereco || "";
    document.getElementById("orcamentoData").value = orcamento.data || "";
    document.getElementById("orcamentoPrazo").value = orcamento.prazo || "";
    document.getElementById("orcamentoObservacoes").value = orcamento.observacoes || "";
    document.getElementById("orcamentoStatus").value = orcamento.status || "Pendente";
    document.getElementById("orcamentoDesconto").value = orcamento.desconto ? formatarMoedaGlobal(orcamento.desconto).replace("R$ ", "") : "0,00";
    window.orcamentoItens = [];
    if (orcamento.itens) {
        for (var j = 0; j < orcamento.itens.length; j++) {
            window.orcamentoItens.push({
                descricao: orcamento.itens[j].descricao || "",
                unidade: orcamento.itens[j].unidade || "UN",
                quantidade: orcamento.itens[j].quantidade || 1,
                valor_unitario: orcamento.itens[j].valor_unitario || 0
            });
        }
    }
    var tbody = document.getElementById("orcamentoItemsBody");
    if (tbody) {
        tbody.innerHTML = "";
        for (var k = 0; k < window.orcamentoItens.length; k++) {
            var item = window.orcamentoItens[k];
            var linha = document.createElement("tr");
            var html = '';
            html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 6px; text-align:center; background:#d4d0c8; font-weight:700; font-size:0.65rem; font-family:\'Courier New\',monospace;">' + (k + 1) + '</td>';
            html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;"><input type="text" class="item-descricao" value="' + (item.descricao || "") + '" data-index="' + k + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:100%; background:#f0f0f0; font-family:\'Courier New\',monospace; font-size:0.7rem; color:#000000; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);"></td>';
            html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;"><input type="text" class="item-unidade" value="' + (item.unidade || "UN") + '" data-index="' + k + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:38px; background:#f0f0f0; font-family:\'Courier New\',monospace; font-size:0.7rem; color:#000000; text-align:center; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);"></td>';
            html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;"><input type="number" class="item-quantidade" value="' + (item.quantidade || 1) + '" min="1" data-index="' + k + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:38px; background:#f0f0f0; font-family:\'Courier New\',monospace; font-size:0.7rem; color:#000000; text-align:center; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);"></td>';
            html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;"><input type="text" class="item-valor" value="' + (formatarMoedaGlobal(item.valor_unitario || 0).replace("R$ ", "")) + '" data-index="' + k + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:75px; background:#f0f0f0; font-family:\'Courier New\',monospace; font-size:0.7rem; color:#000000; text-align:right; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);"></td>';
            html += '<td class="item-subtotal" data-index="' + k + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 6px; text-align:right; background:#ece9d8; font-family:\'Courier New\',monospace; font-size:0.7rem; font-weight:700;">' + formatarMoedaGlobal((item.quantidade || 0) * (item.valor_unitario || 0)) + '</td>';
            html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; text-align:center; background:#d4d0c8;"><button type="button" class="remover-item" data-index="' + k + '" style="background:#f39c12; color:#ffffff; border:2px solid #e67e22; border-top-color:#f1c40f; border-left-color:#f1c40f; padding:0 6px; cursor:pointer; font-size:0.6rem; font-family:\'Courier New\',monospace; font-weight:700; border-radius:0px;" title="Remover item"><i class="fas fa-trash" style="color:#ffffff;"></i></button></td>';
            linha.innerHTML = html;
            tbody.appendChild(linha);
        }
        if (window.orcamentoItens.length === 0) {
            adicionarItemLinha();
        }
        configurarEventosItens();
        configurarFormatacaoValor();
        atualizarIndicesItens();
    }
    document.getElementById("orcamentoFormTitle").textContent = "Editando: " + (orcamento.numero || "Orcamento");
    var submitBtn = document.getElementById("orcamentoSubmitBtn");
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alteracoes';
        submitBtn.style.background = "#3498db";
        submitBtn.style.color = "#ffffff";
    }
    var cancelBtn = document.getElementById("orcamentoCancelBtn");
    if (cancelBtn) cancelBtn.style.display = "inline-block";
    window.orcamentoEditandoId = id;
    
    configurarFormatacaoDesconto();
    recalcularTotais();
}

function salvarOrcamento() {
    console.log('salvarOrcamento chamado');
    try {
        var cliente = document.getElementById("orcamentoCliente") ? document.getElementById("orcamentoCliente").value.trim() : "";
        var cnpj = document.getElementById("orcamentoCnpj") ? document.getElementById("orcamentoCnpj").value.trim() : "";
        var endereco = document.getElementById("orcamentoEndereco") ? document.getElementById("orcamentoEndereco").value.trim() : "";
        var data = document.getElementById("orcamentoData") ? document.getElementById("orcamentoData").value : "";
        var prazo = document.getElementById("orcamentoPrazo") ? document.getElementById("orcamentoPrazo").value : "";
        var observacoes = document.getElementById("orcamentoObservacoes") ? document.getElementById("orcamentoObservacoes").value.trim() : "";
        var status = document.getElementById("orcamentoStatus") ? document.getElementById("orcamentoStatus").value : "Pendente";
        var descontoInput = document.getElementById("orcamentoDesconto");
        var desconto = 0;
        if (descontoInput) {
            var descontoStr = descontoInput.value.replace(/[^\d,]/g, "").replace(",", ".");
            desconto = parseFloat(descontoStr) || 0;
        }
        
        if (!cliente) {
            mostrarNotificacao("Informe o nome do cliente!", "warning");
            return;
        }
        if (!window.orcamentoItens || window.orcamentoItens.length === 0) {
            mostrarNotificacao("Adicione pelo menos um item!", "warning");
            return;
        }
        
        var subtotal = calcularTotalItens(window.orcamentoItens);
        var total = subtotal - (desconto || 0);
        
        var itens = [];
        for (var i = 0; i < window.orcamentoItens.length; i++) {
            itens.push({
                descricao: window.orcamentoItens[i].descricao || "",
                unidade: window.orcamentoItens[i].unidade || "UN",
                quantidade: window.orcamentoItens[i].quantidade || 1,
                valor_unitario: window.orcamentoItens[i].valor_unitario || 0
            });
        }
        
        var orcamentoData = {
            cliente: cliente,
            cnpj: cnpj,
            endereco: endereco,
            data: data,
            prazo: prazo,
            observacoes: observacoes,
            status: status,
            desconto: desconto || 0,
            subtotal: subtotal,
            total: total,
            itens: itens,
            updated_at: new Date().toISOString()
        };
        
        if (window.orcamentoEditandoId) {
            var index = -1;
            for (var j = 0; j < window.orcamentos.length; j++) {
                if (window.orcamentos[j].id === window.orcamentoEditandoId) {
                    index = j;
                    break;
                }
            }
            if (index !== -1) {
                window.orcamentos[index].cliente = orcamentoData.cliente;
                window.orcamentos[index].cnpj = orcamentoData.cnpj;
                window.orcamentos[index].endereco = orcamentoData.endereco;
                window.orcamentos[index].data = orcamentoData.data;
                window.orcamentos[index].prazo = orcamentoData.prazo;
                window.orcamentos[index].observacoes = orcamentoData.observacoes;
                window.orcamentos[index].status = orcamentoData.status;
                window.orcamentos[index].desconto = orcamentoData.desconto;
                window.orcamentos[index].subtotal = orcamentoData.subtotal;
                window.orcamentos[index].total = orcamentoData.total;
                window.orcamentos[index].itens = orcamentoData.itens;
                window.orcamentos[index].updated_at = orcamentoData.updated_at;
                salvarOrcamentos();
                mostrarNotificacao("Orcamento atualizado com sucesso!", "success");
                listarOrcamentos();
                resetOrcamentoForm();
                switchOrcamentoTab("list");
            }
        } else {
            var novoOrcamento = {
                id: "orc_" + Date.now(),
                numero: gerarNumeroOrcamento(),
                cliente: orcamentoData.cliente,
                cnpj: orcamentoData.cnpj,
                endereco: orcamentoData.endereco,
                data: orcamentoData.data,
                prazo: orcamentoData.prazo,
                observacoes: orcamentoData.observacoes,
                status: orcamentoData.status,
                desconto: orcamentoData.desconto,
                subtotal: orcamentoData.subtotal,
                total: orcamentoData.total,
                itens: orcamentoData.itens,
                created_at: new Date().toISOString(),
                updated_at: orcamentoData.updated_at
            };
            window.orcamentos.unshift(novoOrcamento);
            salvarOrcamentos();
            mostrarNotificacao("Orcamento criado com sucesso!", "success");
            listarOrcamentos();
            resetOrcamentoForm();
            switchOrcamentoTab("list");
        }
        console.log('Orcamento salvo com sucesso!');
    } catch (error) {
        console.error("Erro ao salvar orcamento:", error);
        mostrarNotificacao("Erro ao salvar orcamento: " + error.message, "error");
    }
}

// ============================================================
// FUNCOES DE LISTAGEM
// ============================================================

function listarOrcamentos() {
    var container = document.getElementById("orcamentoListContainer");
    if (!container) return;
    
    if (!window.orcamentos || window.orcamentos.length === 0) {
        var emptyHtml = "";
        emptyHtml += '<div style="text-align:center; padding:20px 0; background:#d4d0c8; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 2px 2px 8px rgba(0,0,0,0.15);">';
        emptyHtml += '<i class="fas fa-file-invoice" style="font-size:2rem; color:#404040;"></i>';
        emptyHtml += '<p style="margin-top:8px; color:#404040; font-family:\'Courier New\',monospace; font-weight:700; font-size:0.85rem;">Nenhum orcamento cadastrado.</p>';
        emptyHtml += '<button class="btn-win98" onclick="window.switchOrcamentoTab(\'form\')" style="margin-top:6px; font-size:0.75rem; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:4px 16px; cursor:pointer; font-family:\'Courier New\',monospace; font-weight:700;">';
        emptyHtml += '<i class="fas fa-plus"></i> Criar Primeiro Orcamento';
        emptyHtml += '</button></div>';
        container.innerHTML = emptyHtml;
        return;
    }
    
    var html = "";
    html += '<div style="overflow-x:auto; background:#d4d0c8; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px; box-shadow: inset 2px 2px 6px rgba(0,0,0,0.12);">';
    html += '<table style="width:100%; border-collapse:collapse; background:#ffffff; font-family:\'Courier New\',monospace; font-size:0.7rem;">';
    html += '<thead><tr style="background:#d4d0c8; border-bottom:2px solid #404040;">';
    html += '<th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:left; color:#000000; font-weight:700;">N</th>';
    html += '<th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:left; color:#000000; font-weight:700;">Cliente</th>';
    html += '<th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:left; color:#000000; font-weight:700;">Data</th>';
    html += '<th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:left; color:#000000; font-weight:700;">Status</th>';
    html += '<th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; color:#000000; font-weight:700;">Total</th>';
    html += '<th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center; color:#000000; font-weight:700;">Acoes</th>';
    html += '</tr></thead><tbody>';
    
    for (var i = 0; i < window.orcamentos.length; i++) {
        var orc = window.orcamentos[i];
        var statusColors = { "Pendente": "#f39c12", "Aprovado": "#27ae60", "Cancelado": "#e74c3c" };
        var statusColor = statusColors[orc.status] || "#666";
        
        html += '<tr style="border-bottom:1px solid #808080;">';
        html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px;"><strong>' + (orc.numero || "N/A") + '</strong></td>';
        html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px;">' + (orc.cliente || "Sem cliente") + '</td>';
        html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px;">' + formatarDataGlobal(orc.data) + '</td>';
        html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px;"><span style="background:' + statusColor + '; color:#fff; padding:1px 8px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; font-size:0.6rem; font-weight:700;">' + (orc.status || "Pendente") + '</span></td>';
        html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right;"><strong>' + formatarMoedaGlobal(orc.total || 0) + '</strong></td>';
        html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center;">';
        html += '<span style="display:inline-flex; gap:2px;">';
        html += '<button class="btn-win98-sm" onclick="window.verOrcamento(\'' + orc.id + '\')" title="Visualizar" style="padding:0 4px; font-size:0.65rem; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:\'Courier New\',monospace;"><i class="fas fa-eye"></i></button> ';
        html += '<button class="btn-win98-sm" onclick="window.carregarOrcamentoParaEdicao(\'' + orc.id + '\')" title="Editar" style="padding:0 4px; font-size:0.65rem; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:\'Courier New\',monospace;"><i class="fas fa-edit"></i></button> ';
        html += '<button class="btn-win98-sm" onclick="window.duplicarOrcamento(\'' + orc.id + '\')" title="Duplicar" style="padding:0 4px; font-size:0.65rem; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:\'Courier New\',monospace;"><i class="fas fa-copy"></i></button> ';
        html += '<button class="btn-win98-sm" onclick="window.gerarRecibo(\'' + orc.id + '\')" title="Gerar Recibo" style="padding:0 4px; font-size:0.65rem; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:\'Courier New\',monospace;"><i class="fas fa-file-invoice"></i></button>';
        html += '</span>';
        html += '<span style="display:inline-flex; margin-left:8px; padding-left:8px; border-left:1px solid #808080;">';
        html += '<button class="btn-win98-sm btn-win98-danger" onclick="window.excluirOrcamento(\'' + orc.id + '\')" title="Excluir" style="padding:0 4px; font-size:0.65rem; background:#e74c3c; color:#ffffff; border:2px solid #c0392b; border-top-color:#e74c3c; border-left-color:#e74c3c; cursor:pointer; font-family:\'Courier New\',monospace;"><i class="fas fa-trash"></i></button>';
        html += '</span>';
        html += '</td></tr>';
    }
    
    html += '</tbody></table></div>';
    html += '<div style="margin-top:6px; font-size:0.65rem; color:#404040; font-family:\'Courier New\',monospace; font-weight:700;">';
    html += '<i class="fas fa-info-circle"></i> Total: ' + window.orcamentos.length + ' orcamento(s)';
    html += '</div>';
    
    container.innerHTML = html;
}

// ============================================================
// FUNCAO GERAR RECIBO - COM BOTOES E FUNCOES EMBUTIDAS
// ============================================================

function gerarRecibo(id) {
    console.log('gerarRecibo chamado para id:', id);
    var orc = null;
    for (var i = 0; i < window.orcamentos.length; i++) {
        if (window.orcamentos[i].id === id) {
            orc = window.orcamentos[i];
            break;
        }
    }
    if (!orc) {
        mostrarNotificacao("Orcamento nao encontrado!", "error");
        return;
    }
    
    var conteudo = gerarHtmlRecibo(orc);
    var printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
        mostrarNotificacao("Bloqueie o pop-up e tente novamente!", "error");
        return;
    }
    var doc = printWindow.document;
    doc.write('<!DOCTYPE html><html><head><title>NOTA DE RECIBO ' + (orc.numero || "") + '</title>');
    doc.write('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">');
    doc.write('<style>body { padding: 20px; font-family: \'Courier New\', monospace; background: #f0f0f0; } ');
    doc.write('.recibo-container { max-width: 700px; margin: 0 auto; background: #ffffff; padding: 25px; border: 2px solid #000000; box-shadow: 0 4px 20px rgba(0,0,0,0.1); } ');
    doc.write('.recibo-header { text-align: center; border-bottom: 2px solid #000000; padding-bottom: 12px; margin-bottom: 15px; } ');
    doc.write('.recibo-header h1 { font-size: 1.6rem; margin: 0; color: #0a2e4d; text-transform: uppercase; letter-spacing: 3px; } ');
    doc.write('.recibo-header .numero { font-size: 0.85rem; color: #666; margin-top: 4px; } ');
    doc.write('.recibo-corpo { padding: 8px 0; } ');
    doc.write('.recibo-linha { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #ccc; } ');
    doc.write('.recibo-linha .label { font-weight: 700; color: #0a2e4d; } ');
    doc.write('.recibo-linha .valor { font-weight: 600; } ');
    doc.write('.recibo-total { font-size: 1.1rem; background: #0a2e4d; color: #fff; padding: 8px 15px; text-align: center; margin: 12px 0; } ');
    doc.write('.recibo-footer { margin-top: 15px; padding-top: 12px; border-top: 2px solid #000000; font-size: 0.65rem; text-align: center; color: #666; } ');
    doc.write('.recibo-assinaturas { display: flex; justify-content: space-between; margin-top: 25px; padding-top: 8px; } ');
    doc.write('.recibo-assinaturas div { text-align: center; width: 45%; } ');
    doc.write('.recibo-assinaturas .linha { border-top: 1px solid #000000; width: 80%; margin: 25px auto 5px; } ');
    doc.write('.recibo-legal { font-size: 0.6rem; color: #555; margin-top: 12px; text-align: justify; } ');
    doc.write('.btn-win98 { background: #d4d0c8; color: #000000; border: 2px solid #404040; border-top-color: #808080; border-left-color: #808080; padding: 4px 14px; cursor: pointer; font-family: \'Courier New\', monospace; font-weight: 700; font-size: 0.75rem; } ');
    doc.write('.btn-win98:hover { background: #ece9d8; } ');
    doc.write('.btn-win98:active { border-top-color: #404040; border-left-color: #404040; border-bottom-color: #808080; border-right-color: #808080; transform: translateY(1px); } ');
    doc.write('.no-print { display: inline-block; } ');
    doc.write('@media print { body { background: #ffffff; } .recibo-container { box-shadow: none; } .no-print { display: none !important; } }');
    doc.write('</style>');
    
    // ========================================
    // CONTEUDO DO RECIBO
    // ========================================
    doc.write('</head><body>' + conteudo);
    
    // ========================================
    // SCRIPT EMBUTIDO NO RECIBO - FUNCOES COMPLETAS
    // ========================================
    doc.write('<script>');
    doc.write('var ORCAMENTO_CONFIG = ' + JSON.stringify(ORCAMENTO_CONFIG) + ';');
    doc.write('var ORC_ID = "' + orc.id + '";');
    doc.write('var ORC_NUMERO = "' + (orc.numero || "N/A") + '";');
    doc.write('var ORC_CLIENTE = "' + (orc.cliente || "Nao informado") + '";');
    doc.write('var ORC_TOTAL = ' + (orc.total || 0) + ';');
    doc.write('var ORC_DATA = "' + (orc.data || "") + '";');
    doc.write('var ORC_ITENS = ' + JSON.stringify(orc.itens) + ';');
    doc.write('var EMPRESA_NOME = "' + ORCAMENTO_CONFIG.empresa.nome + '";');
    doc.write('var EMPRESA_WHATSAPP = "' + ORCAMENTO_CONFIG.empresa.whatsapp + '";');
    doc.write('var EMPRESA_TELEFONE = "' + ORCAMENTO_CONFIG.empresa.telefone + '";');
    doc.write('var PROPONENTE_PIX = "' + ORCAMENTO_CONFIG.proponente.pix + '";');
    
    // Funcoes auxiliares
    doc.write('function formatarMoedaLocal(valor) { if (!valor && valor !== 0) return "R$ 0,00"; return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor); }');
    doc.write('function formatarDataLocal(data) { if (!data) return ""; try { var d = new Date(data); return d.toLocaleDateString("pt-BR"); } catch(e) { return data; } }');
    doc.write('function converterValorPorExtensoLocal(valor) {');
    doc.write('  if (!valor || valor === 0) return "Zero reais";');
    doc.write('  var unidades = ["", "um", "dois", "tres", "quatro", "cinco", "seis", "sete", "oito", "nove"];');
    doc.write('  var especiais = ["dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];');
    doc.write('  var dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];');
    doc.write('  var centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];');
    doc.write('  function numeroPorExtenso(num) {');
    doc.write('    if (num === 0) return "zero"; if (num === 100) return "cem";');
    doc.write('    if (num >= 1000) { var milhares = Math.floor(num / 1000); var resto = num % 1000; var ext = milhares === 1 ? "mil" : numeroPorExtenso(milhares) + " mil"; if (resto > 0) ext += " e " + numeroPorExtenso(resto); return ext; }');
    doc.write('    if (num >= 100) { var centena = Math.floor(num / 100); var resto = num % 100; if (centena === 1 && resto === 0) return "cem"; var ext = centenas[centena]; if (resto > 0) ext += " e " + numeroPorExtenso(resto); return ext; }');
    doc.write('    if (num >= 20) { var dezena = Math.floor(num / 10); var unidade = num % 10; var ext = dezenas[dezena]; if (unidade > 0) ext += " e " + unidades[unidade]; return ext; }');
    doc.write('    if (num >= 10) return especiais[num - 10]; return unidades[num];');
    doc.write('  }');
    doc.write('  var partes = valor.toFixed(2).split("."); var reais = parseInt(partes[0]); var centavos = parseInt(partes[1]); var extenso = "";');
    doc.write('  if (reais > 0) extenso = numeroPorExtenso(reais) + " reais";');
    doc.write('  if (centavos > 0) { if (extenso) extenso += " e "; extenso += numeroPorExtenso(centavos) + " centavos"; }');
    doc.write('  return extenso.charAt(0).toUpperCase() + extenso.slice(1);');
    doc.write('}');
    
    // Funcao ENVIAR WHATSAPP DO RECIBO
    doc.write('function enviarReciboWhatsApp() {');
    doc.write('  var telefone = EMPRESA_WHATSAPP;');
    doc.write('  var mensagem = "*" + EMPRESA_NOME + "*\\n";');
    doc.write('  mensagem += "NOTA DE RECIBO: " + ORC_NUMERO + "\\n";');
    doc.write('  mensagem += "Data: " + formatarDataLocal(ORC_DATA) + "\\n";');
    doc.write('  mensagem += "Cliente: " + ORC_CLIENTE + "\\n";');
    doc.write('  mensagem += "Valor: " + formatarMoedaLocal(ORC_TOTAL) + "\\n";');
    doc.write('  mensagem += "Por Extenso: " + converterValorPorExtensoLocal(ORC_TOTAL) + "\\n";');
    doc.write('  mensagem += "\\n*ITENS:*\\n";');
    doc.write('  for (var i = 0; i < ORC_ITENS.length; i++) {');
    doc.write('    var item = ORC_ITENS[i];');
    doc.write('    mensagem += (i+1) + ". " + (item.descricao || "Item") + " - " + (item.quantidade || 1) + "x " + formatarMoedaLocal(item.valor_unitario || 0) + " = " + formatarMoedaLocal((item.quantidade || 0) * (item.valor_unitario || 0)) + "\\n";');
    doc.write('  }');
    doc.write('  mensagem += "\\n*PIX:* " + PROPONENTE_PIX;');
    doc.write('  mensagem += "\\n\\n*Assistencia Tecnica Independente*";');
    doc.write('  mensagem += "\\n" + EMPRESA_TELEFONE;');
    doc.write('  var url = "https://wa.me/" + telefone + "?text=" + encodeURIComponent(mensagem);');
    doc.write('  window.open(url, "_blank");');
    doc.write('}');
    
    // Funcao GERAR PDF DO RECIBO
    doc.write('function gerarReciboPDF() {');
    doc.write('  var container = document.querySelector(".recibo-container");');
    doc.write('  if (typeof html2pdf !== "undefined") {');
    doc.write('    var botoes = container.querySelectorAll(".no-print");');
    doc.write('    for (var i = 0; i < botoes.length; i++) { botoes[i].style.display = "none"; }');
    doc.write('    html2pdf().from(container).set({');
    doc.write('      margin: [10, 10, 10, 10],');
    doc.write('      filename: "Recibo_" + ORC_NUMERO.replace(/\\//g, "-") + ".pdf",');
    doc.write('      image: { type: "jpeg", quality: 0.95 },');
    doc.write('      html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" },');
    doc.write('      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }');
    doc.write('    }).save().then(function() {');
    doc.write('      alert("PDF do Recibo gerado com sucesso!");');
    doc.write('    }).catch(function(error) {');
    doc.write('      alert("Erro ao gerar PDF: " + error);');
    doc.write('    });');
    doc.write('  } else {');
    doc.write('    alert("Carregando bibliotecas... Utilize Imprimir e salve como PDF.");');
    doc.write('    var scripts = [');
    doc.write('      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",');
    doc.write('      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",');
    doc.write('      "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"');
    doc.write('    ];');
    doc.write('    var loaded = 0;');
    doc.write('    function carregarScript(url) {');
    doc.write('      var script = document.createElement("script");');
    doc.write('      script.src = url;');
    doc.write('      script.onload = function() { loaded++; if (loaded === scripts.length) { gerarReciboPDF(); } };');
    doc.write('      document.head.appendChild(script);');
    doc.write('    }');
    doc.write('    for (var i = 0; i < scripts.length; i++) { carregarScript(scripts[i]); }');
    doc.write('  }');
    doc.write('}');
    doc.write('</script>');
    
    // ========================================
    // BOTOES DO RECIBO
    // ========================================
    doc.write('<div class="text-center no-print" style="margin-top:15px; text-align:center;">');
    doc.write('<button class="btn-win98" onclick="window.print()"><i class="fas fa-print"></i> Imprimir</button> ');
    doc.write('<button class="btn-win98" onclick="enviarReciboWhatsApp()" style="background:#25D366; color:#ffffff; border:2px solid #1da851; border-top-color:#2ecc71; border-left-color:#2ecc71;"><i class="fab fa-whatsapp"></i> WhatsApp</button> ');
    doc.write('<button class="btn-win98" onclick="gerarReciboPDF()"><i class="fas fa-file-pdf"></i> PDF</button> ');
    doc.write('<button class="btn-win98" onclick="window.close()">Fechar</button>');
    doc.write('</div>');
    
    doc.write('</body></html>');
    doc.close();
}

function gerarHtmlRecibo(orc) {
    var valorPorExtenso = converterValorPorExtenso(orc.total || 0);
    var orcCliente = orc.cliente || "Nao informado";
    var orcCnpj = orc.cnpj || "";
    var orcEndereco = orc.endereco || "";
    var orcNumero = orc.numero || "N/A";
    var orcData = orc.data || "";
    
    var itensHtml = "";
    for (var i = 0; i < orc.itens.length; i++) {
        var item = orc.itens[i];
        itensHtml += '<div style="font-size:0.7rem; padding:2px 0; border-bottom:1px dotted #eee;">';
        itensHtml += (i + 1) + '. ' + (item.descricao || "Item") + ' - ' + (item.quantidade || 1) + 'x ' + formatarMoedaGlobal(item.valor_unitario || 0);
        itensHtml += ' = ' + formatarMoedaGlobal((item.quantidade || 0) * (item.valor_unitario || 0));
        itensHtml += '</div>';
    }
    
    var html = "";
    html += '<div class="recibo-container">';
    html += '<div class="recibo-header">';
    html += '<h1>NOTA DE RECIBO</h1>';
    html += '<div class="numero"><strong>N:</strong> ' + orcNumero + ' | <strong>Data:</strong> ' + formatarDataGlobal(orcData) + '</div>';
    html += '<div style="font-size:0.75rem; color:#666;">' + ORCAMENTO_CONFIG.empresa.nome + ' - CNPJ: ' + ORCAMENTO_CONFIG.empresa.cnpj + '</div>';
    html += '</div>';
    html += '<div class="recibo-corpo">';
    html += '<p style="text-align:center; font-size:0.85rem; margin-bottom:8px;"><strong>RECEBEMOS DE:</strong></p>';
    html += '<div class="recibo-linha"><span class="label">CLIENTE:</span><span class="valor">' + orcCliente + '</span></div>';
    if (orcCnpj) {
        html += '<div class="recibo-linha"><span class="label">CNPJ/CPF:</span><span class="valor">' + orcCnpj + '</span></div>';
    }
    if (orcEndereco) {
        html += '<div class="recibo-linha"><span class="label">ENDEREÇO:</span><span class="valor">' + orcEndereco + '</span></div>';
    }
    html += '<div style="height:8px;"></div>';
    html += '<div class="recibo-total">VALOR RECEBIDO: <strong>' + formatarMoedaGlobal(orc.total || 0) + '</strong></div>';
    html += '<div style="text-align:center; font-size:0.75rem; margin:4px 0 12px;"><strong>Por Extenso:</strong> ' + valorPorExtenso + '</div>';
    html += '<div style="margin:8px 0; padding:6px; background:#f5f5f5; border:1px solid #ddd;">';
    html += '<p style="font-weight:700; margin-bottom:4px; font-size:0.7rem;">REFERENTE A:</p>';
    html += itensHtml;
    html += '</div>';
    html += '<div style="margin:8px 0; padding:6px; background:#f0f4f8; border:1px solid #d4d0c8;">';
    html += '<p style="font-weight:700; margin-bottom:3px; font-size:0.7rem;">DADOS DO PRESTADOR:</p>';
    html += '<div style="font-size:0.65rem;">';
    html += '<strong>PROPONENTE:</strong> ' + ORCAMENTO_CONFIG.proponente.nome + '<br>';
    html += '<strong>CNPJ:</strong> ' + ORCAMENTO_CONFIG.proponente.cnpj + '<br>';
    html += '<strong>ENDEREÇO:</strong> ' + ORCAMENTO_CONFIG.proponente.endereco + '<br>';
    html += '<strong>PIX:</strong> ' + ORCAMENTO_CONFIG.proponente.pix;
    html += '</div></div>';
    html += '<div class="recibo-assinaturas">';
    html += '<div><div class="linha"></div><strong>Recebedor</strong><br><span style="font-size:0.6rem;">' + ORCAMENTO_CONFIG.proponente.nome + '</span></div>';
    html += '<div><div class="linha"></div><strong>Cliente</strong><br><span style="font-size:0.6rem;">' + orcCliente + '</span></div>';
    html += '</div>';
    html += '<div class="recibo-legal">';
    html += '<p><strong>DISPOSITIVO LEGAL:</strong></p>';
    html += '<p>O presente recibo tem validade como documento de quitação de prestação de serviços, nos termos do Art. 320 do Código Civil Brasileiro (Lei n 10.406/2002), e do Art. 6, inciso III, da Lei n 8.078/1990 (Código de Defesa do Consumidor).</p>';
    html += '</div>';
    html += '<div class="recibo-footer">';
    html += '<p>' + ORCAMENTO_CONFIG.empresa.nome + ' - Assistencia Tecnica Independente</p>';
    html += '<p>CNPJ: ' + ORCAMENTO_CONFIG.empresa.cnpj + ' | Tel: ' + ORCAMENTO_CONFIG.empresa.telefone + ' | Site: ' + ORCAMENTO_CONFIG.empresa.site + '</p>';
    html += '<p>Documento gerado em ' + formatarDataHoraGlobal(new Date().toISOString()) + '</p>';
    html += '</div>';
    html += '</div>';
    
    return html;
}

// ============================================================
// FUNCOES DE VISUALIZACAO
// ============================================================

function verOrcamento(id) {
    var orc = null;
    for (var i = 0; i < window.orcamentos.length; i++) {
        if (window.orcamentos[i].id === id) {
            orc = window.orcamentos[i];
            break;
        }
    }
    if (!orc) {
        mostrarNotificacao("Orcamento nao encontrado!", "error");
        return;
    }
    
    var modalHtml = "";
    modalHtml += '<div class="modal-win98" id="orcamentoModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:10001; display:flex; align-items:center; justify-content:center; padding:20px;">';
    modalHtml += '<div class="modal-win98-content" style="max-width:900px; width:95%; background:#ece9d8; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: 4px 4px 20px rgba(0,0,0,0.3);">';
    modalHtml += '<div class="modal-win98-header" style="background:#000080; color:#ffffff; padding:4px 10px; display:flex; justify-content:space-between; align-items:center; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080;">';
    modalHtml += '<span class="modal-win98-title" style="font-family:\'Courier New\',monospace; font-weight:700; font-size:0.85rem;"><i class="fas fa-file-invoice"></i> Orcamento ' + (orc.numero || "") + '</span>';
    modalHtml += '<button class="modal-win98-close" onclick="window.fecharModalWin98(\'orcamentoModal\')" style="background:#c0c0c0; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:0 8px; cursor:pointer; font-size:1rem; font-weight:700; font-family:\'Courier New\',monospace;">x</button>';
    modalHtml += '</div>';
    modalHtml += '<div class="modal-win98-body" style="background:#d4d0c8; padding:12px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; max-height:60vh; overflow-y:auto;">';
    modalHtml += gerarHtmlOrcamento(orc);
    modalHtml += '</div>';
    modalHtml += '<div class="modal-win98-footer" style="background:#d4d0c8; padding:6px 10px; text-align:right; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080;">';
    modalHtml += '<button class="btn-win98" onclick="window.imprimirOrcamento(\'' + orc.id + '\')" style="font-size:0.75rem; padding:3px 12px; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:\'Courier New\',monospace; font-weight:700;"><i class="fas fa-print"></i> Imprimir</button> ';
    modalHtml += '<button class="btn-win98" onclick="window.enviarWhatsAppOrcamento(\'' + orc.id + '\')" style="font-size:0.75rem; padding:3px 12px; background:#25D366; color:#ffffff; border:2px solid #1da851; border-top-color:#2ecc71; border-left-color:#2ecc71; cursor:pointer; font-family:\'Courier New\',monospace; font-weight:700;"><i class="fab fa-whatsapp"></i> WhatsApp</button> ';
    modalHtml += '<button class="btn-win98" onclick="window.gerarPDFOrcamento(\'' + orc.id + '\')" style="font-size:0.75rem; padding:3px 12px; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:\'Courier New\',monospace; font-weight:700;"><i class="fas fa-file-pdf"></i> PDF</button> ';
    modalHtml += '<button class="btn-win98" onclick="window.fecharModalWin98(\'orcamentoModal\')" style="font-size:0.75rem; padding:3px 12px; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:\'Courier New\',monospace; font-weight:700;">Fechar</button>';
    modalHtml += '</div></div></div>';
    
    var existingModal = document.getElementById("orcamentoModal");
    if (existingModal) existingModal.remove();
    document.body.insertAdjacentHTML("beforeend", modalHtml);
}

function fecharModalWin98(id) {
    var modal = document.getElementById(id);
    if (modal) modal.remove();
}

function gerarHtmlOrcamento(orc) {
    var statusColors = { "Pendente": "#f39c12", "Aprovado": "#27ae60", "Cancelado": "#e74c3c" };
    var statusColor = statusColors[orc.status] || "#666";
    
    var html = "";
    html += '<div style="font-family:\'Courier New\',monospace; font-size:0.75rem; color:#000000;">';
    html += '<div style="text-align:center; padding:8px 0; margin-bottom:10px; background:#0a2e4d; color:#ffffff; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080;">';
    html += '<h2 style="margin:0; font-family:\'Courier New\',monospace; font-weight:700; font-size:1.2rem; letter-spacing:3px;">NOTA DE ORCAMENTO</h2>';
    html += '<div style="font-size:0.65rem; opacity:0.8;">' + (orc.numero || "N/A") + ' | ' + formatarDataGlobal(orc.data) + '</div>';
    html += '</div>';
    html += '<div style="display:flex; align-items:center; gap:12px; padding:6px 10px; margin-bottom:8px; background:#f0f0f0; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 1px 1px 4px rgba(0,0,0,0.1);">';
    html += '<div style="flex-shrink:0;"><img src="' + ORCAMENTO_CONFIG.empresa.logo + '" alt="ECD Eletronica" style="max-height:50px; width:auto; border:1px solid #808080; padding:3px; background:#ffffff;"></div>';
    html += '<div style="flex:1;"><strong style="font-size:0.9rem; color:#0a2e4d;">' + ORCAMENTO_CONFIG.empresa.nome + '</strong><br>';
    html += 'CNPJ: ' + ORCAMENTO_CONFIG.empresa.cnpj + ' | Tel: ' + ORCAMENTO_CONFIG.empresa.telefone + '<br>';
    html += ORCAMENTO_CONFIG.empresa.endereco + ' - CEP: ' + ORCAMENTO_CONFIG.empresa.cep;
    html += '<br>Site: ' + ORCAMENTO_CONFIG.empresa.site + '</div>';
    html += '</div>';
    html += '<div style="background:#d4d0c8; padding:4px 10px; margin-bottom:6px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 1px 1px 4px rgba(0,0,0,0.1);">';
    html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; font-size:0.65rem;">';
    html += '<div><strong>PROPONENTE:</strong> ' + ORCAMENTO_CONFIG.proponente.nome + '</div>';
    html += '<div style="text-align:right;"><strong>CNPJ:</strong> ' + ORCAMENTO_CONFIG.proponente.cnpj + '</div>';
    html += '<div style="grid-column:1/3;"><strong>END:</strong> ' + ORCAMENTO_CONFIG.proponente.endereco + '</div>';
    html += '<div><strong>CEP:</strong> ' + ORCAMENTO_CONFIG.proponente.cep + '</div>';
    html += '<div style="text-align:right;"><strong>E-MAIL:</strong> ' + ORCAMENTO_CONFIG.proponente.email + '</div>';
    html += '<div style="grid-column:1/3;"><strong>PIX:</strong> ' + ORCAMENTO_CONFIG.proponente.pix + '</div>';
    html += '</div></div>';
    html += '<div style="background:#d4d0c8; padding:4px 10px; margin-bottom:6px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 1px 1px 4px rgba(0,0,0,0.1);">';
    html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; font-size:0.65rem;">';
    html += '<div><strong>CLIENTE:</strong> ' + (orc.cliente || "Nao informado") + '</div>';
    html += '<div style="text-align:right;"><strong>CNPJ/CPF:</strong> ' + (orc.cnpj || "Nao informado") + '</div>';
    html += '<div style="grid-column:1/3;"><strong>ENDEREÇO:</strong> ' + (orc.endereco || "Nao informado") + '</div>';
    html += '<div><strong>DATA:</strong> ' + formatarDataGlobal(orc.data) + '</div>';
    html += '<div style="text-align:right;"><strong>PRAZO:</strong> ' + formatarDataGlobal(orc.prazo) + '</div>';
    html += '<div><strong>STATUS:</strong> <span style="background:' + statusColor + '; color:#fff; padding:0 8px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; font-weight:700; font-size:0.6rem;">' + (orc.status || "Pendente") + '</span></div>';
    html += '</div></div>';
    html += '<div style="overflow-x:auto; background:#d4d0c8; padding:3px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 2px 2px 6px rgba(0,0,0,0.12);">';
    html += '<table style="width:100%; border-collapse:collapse; background:#ffffff; font-family:\'Courier New\',monospace; font-size:0.65rem;">';
    html += '<thead><tr style="background:#d4d0c8; border-bottom:2px solid #404040;">';
    html += '<th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center; font-weight:700;">Item</th>';
    html += '<th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:left; font-weight:700;">Descricao</th>';
    html += '<th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center; font-weight:700;">UN</th>';
    html += '<th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center; font-weight:700;">Quant.</th>';
    html += '<th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; font-weight:700;">Valor Unit.</th>';
    html += '<th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; font-weight:700;">Subtotal</th>';
    html += '</tr></thead><tbody>';
    for (var i = 0; i < orc.itens.length; i++) {
        var item = orc.itens[i];
        var subtotal = (item.quantidade || 0) * (item.valor_unitario || 0);
        html += '<tr>';
        html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center;">' + (i + 1) + '</td>';
        html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px;">' + (item.descricao || "") + '</td>';
        html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center;">' + (item.unidade || "UN") + '</td>';
        html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center;">' + (item.quantidade || 1) + '</td>';
        html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right;">' + formatarMoedaGlobal(item.valor_unitario || 0) + '</td>';
        html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right;">' + formatarMoedaGlobal(subtotal) + '</td>';
        html += '</tr>';
    }
    html += '</tbody><tfoot>';
    html += '<tr><td colspan="5" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; background:#f0f0f0;"><strong>Subtotal</strong></td>';
    html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; background:#f0f0f0;"><strong>' + formatarMoedaGlobal(orc.subtotal || 0) + '</strong></td></tr>';
    html += '<tr><td colspan="5" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; background:#f0f0f0;"><strong>Desconto</strong></td>';
    html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; background:#f0f0f0;"><strong>' + formatarMoedaGlobal(orc.desconto || 0) + '</strong></td></tr>';
    html += '<tr style="background:#d4e6f1;"><td colspan="5" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; font-weight:700; font-size:0.8rem;"><strong>TOTAL GERAL</strong></td>';
    html += '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; font-weight:700; font-size:0.8rem;"><strong>' + formatarMoedaGlobal(orc.total || 0) + '</strong></td></tr>';
    html += '</tfoot></table></div>';
    if (orc.observacoes) {
        html += '<div style="background:#d4d0c8; padding:4px 10px; margin-top:6px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 1px 1px 4px rgba(0,0,0,0.1);">';
        html += '<strong>Observacoes:</strong><br>' + orc.observacoes;
        html += '</div>';
    }
    html += '<div style="text-align:center; margin-top:8px; padding-top:6px; border-top:2px solid #808080; font-size:0.5rem; color:#404040; font-family:\'Courier New\',monospace;">';
    html += '<p style="margin:1px 0;">' + ORCAMENTO_CONFIG.empresa.nome + ' - Assistencia Tecnica Independente</p>';
    html += '<p style="margin:1px 0;">CNPJ: ' + ORCAMENTO_CONFIG.empresa.cnpj + ' | Tel: ' + ORCAMENTO_CONFIG.empresa.telefone + ' | Site: ' + ORCAMENTO_CONFIG.empresa.site + '</p>';
    html += '<p style="margin:1px 0;">Documento gerado em ' + formatarDataHoraGlobal(new Date().toISOString()) + '</p>';
    html += '</div></div>';
    return html;
}

// ============================================================
// FUNCOES DE EXPORTACAO
// ============================================================

function imprimirOrcamento(id) {
    var orc = null;
    for (var i = 0; i < window.orcamentos.length; i++) {
        if (window.orcamentos[i].id === id) {
            orc = window.orcamentos[i];
            break;
        }
    }
    if (!orc) {
        mostrarNotificacao("Orcamento nao encontrado!", "error");
        return;
    }
    
    var conteudo = gerarHtmlOrcamento(orc);
    var printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
        mostrarNotificacao("Bloqueie o pop-up e tente novamente!", "error");
        return;
    }
    var doc = printWindow.document;
    doc.write('<!DOCTYPE html><html><head><title>Orcamento ' + (orc.numero || "") + '</title>');
    doc.write('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">');
    doc.write('<style>body { padding: 20px; font-family: \'Courier New\', monospace; background: #ffffff; } @media print { .no-print { display: none !important; } } .modal-win98 { background: #d4d0c8; border: 2px solid #404040; border-top-color: #808080; border-left-color: #808080; padding: 8px; box-shadow: inset 2px 2px 8px rgba(0,0,0,0.15); } .btn-win98 { background: #d4d0c8; color: #000000; border: 2px solid #404040; border-top-color: #808080; border-left-color: #808080; padding: 4px 16px; cursor: pointer; font-family: \'Courier New\', monospace; font-weight: 700; }</style>');
    doc.write('</head><body>' + conteudo);
    doc.write('<div class="text-center mt-4 no-print">');
    doc.write('<button class="btn-win98" onclick="window.print()">Imprimir</button> ');
    doc.write('<button class="btn-win98" onclick="window.close()">Fechar</button>');
    doc.write('</div>');
    doc.write('<script>setTimeout(function(){ window.print(); }, 800);<\/script>');
    doc.write('</body></html>');
    doc.close();
}

function gerarPDFOrcamento(id) {
    var orc = null;
    for (var i = 0; i < window.orcamentos.length; i++) {
        if (window.orcamentos[i].id === id) {
            orc = window.orcamentos[i];
            break;
        }
    }
    if (!orc) {
        mostrarNotificacao("Orcamento nao encontrado!", "error");
        return;
    }
    
    if (typeof html2pdf === "undefined") {
        mostrarNotificacao("Carregando bibliotecas...", "info");
        var scripts = [
            "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
        ];
        var loaded = 0;
        function carregarScriptPDF(url) {
            var script = document.createElement("script");
            script.src = url;
            script.onload = function() { loaded++; if (loaded === scripts.length) { gerarPDFOrcamento(id); } };
            script.onerror = function() { mostrarNotificacao("Erro ao carregar bibliotecas!", "error"); };
            document.head.appendChild(script);
        }
        for (var i = 0; i < scripts.length; i++) { carregarScriptPDF(scripts[i]); }
        return;
    }
    
    mostrarNotificacao("Gerando PDF...", "info");
    try {
        var conteudo = gerarHtmlOrcamento(orc);
        var container = document.createElement("div");
        container.innerHTML = conteudo;
        container.style.padding = "20px";
        container.style.background = "#ffffff";
        container.style.width = "100%";
        container.style.maxWidth = "800px";
        container.style.margin = "0 auto";
        container.style.fontFamily = "'Courier New', monospace";
        container.style.fontSize = "12px";
        
        var opt = {
            margin: [10, 10, 10, 10],
            filename: "Orcamento_" + (orc.numero || "ECD") + ".pdf",
            image: { type: "jpeg", quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff", allowTaint: true, width: 800, height: 1100, scrollY: 0 },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        html2pdf().set(opt).from(container).save().then(function() {
            mostrarNotificacao("PDF gerado com sucesso!", "success");
        }).catch(function(error) {
            mostrarNotificacao("Erro ao gerar PDF.", "error");
        });
    } catch (error) {
        mostrarNotificacao("Erro ao gerar PDF.", "error");
    }
}

function enviarWhatsAppOrcamento(id) {
    var orc = null;
    for (var i = 0; i < window.orcamentos.length; i++) {
        if (window.orcamentos[i].id === id) {
            orc = window.orcamentos[i];
            break;
        }
    }
    if (!orc) {
        mostrarNotificacao("Orcamento nao encontrado!", "error");
        return;
    }
    
    var telefone = ORCAMENTO_CONFIG.empresa.whatsapp;
    var mensagem = "*" + ORCAMENTO_CONFIG.empresa.nome + "*\n";
    mensagem += "Orcamento: " + (orc.numero || "N/A") + "\n";
    mensagem += "Data: " + formatarDataGlobal(orc.data) + "\n";
    mensagem += "Cliente: " + (orc.cliente || "Nao informado") + "\n";
    mensagem += "Total: " + formatarMoedaGlobal(orc.total || 0) + "\n";
    mensagem += "\n*Pagamento via PIX:* " + ORCAMENTO_CONFIG.banco.pix;
    mensagem += "\n*Site:* " + ORCAMENTO_CONFIG.empresa.site;
    mensagem += "\n\n*Assistencia Tecnica Independente*";
    mensagem += "\n" + ORCAMENTO_CONFIG.empresa.telefone;
    
    var mensagemCodificada = encodeURIComponent(mensagem);
    var url = "https://wa.me/" + telefone + "?text=" + mensagemCodificada;
    window.open(url, "_blank");
    mostrarNotificacao("Mensagem enviada via WhatsApp!", "info");
}

// ============================================================
// FUNCOES DE INTERFACE
// ============================================================

function switchOrcamentoTab(tab) {
    var tabs = ["form", "list"];
    for (var i = 0; i < tabs.length; i++) {
        var content = document.getElementById("orcamento" + tabs[i].charAt(0).toUpperCase() + tabs[i].slice(1) + "Content");
        if (content) {
            if (tabs[i] === tab) {
                content.style.display = "block";
            } else {
                content.style.display = "none";
            }
        }
        var btn = document.querySelector('.orcamento-tab[data-tab="' + tabs[i] + '"]');
        if (btn) {
            if (tabs[i] === tab) {
                btn.classList.add("active");
                btn.style.background = "#ece9d8";
                btn.style.borderLeft = "1px solid #808080";
                btn.style.borderTop = "1px solid #808080";
                btn.style.borderRight = "1px solid #ffffff";
                btn.style.borderBottom = "none";
                btn.style.zIndex = "4";
                btn.style.marginTop = "1px";
                btn.style.paddingTop = "4px";
                btn.style.paddingBottom = "6px";
                var icon = btn.querySelector("i");
                if (icon) icon.style.color = "#ffd700";
            } else {
                btn.classList.remove("active");
                btn.style.background = "#ece9d8";
                btn.style.borderLeft = "1px solid #ffffff";
                btn.style.borderTop = "1px solid #ffffff";
                btn.style.borderRight = "1px solid #808080";
                btn.style.borderBottom = "none";
                btn.style.zIndex = "1";
                btn.style.marginTop = "0";
                btn.style.paddingTop = "4px";
                btn.style.paddingBottom = "5px";
                var icon2 = btn.querySelector("i");
                if (icon2) icon2.style.color = "#555555";
            }
        }
    }
}

function toggleOrcamentoPanel() {
    console.log("Botao clicado! Solicitando senha...");
    
    var panel = document.getElementById("orcamentoPanel");
    if (!panel) {
        console.error("Painel nao encontrado!");
        alert("Erro: Painel de orcamentos nao encontrado!");
        return;
    }
    
    if (panel.style.display === "block") {
        panel.style.display = "none";
        return;
    }
    
    var password = prompt("Acesso ao Painel de Orcamentos\n\nDigite a senha:");
    
    if (password === null) {
        console.log("Usuario cancelou a senha.");
        return;
    }
    
    if (password === "") {
        alert("Digite a senha para acessar.");
        return;
    }
    
    if (password !== ORCAMENTO_CONFIG.password) {
        alert("Senha incorreta! Tente novamente.");
        console.log("Senha incorreta fornecida.");
        return;
    }
    
    console.log("Senha correta! Abrindo painel...");
    
    panel.style.display = "block";
    resetOrcamentoForm();
    listarOrcamentos();
    switchOrcamentoTab("list");
    
    var titulo = panel.querySelector("h3");
    if (titulo) {
        titulo.style.textAlign = "center";
        titulo.style.width = "100%";
    }
    
    setTimeout(function() {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
}

// ============================================================
// FUNCOES DE CRUD
// ============================================================

function excluirOrcamento(id) {
    if (!confirm("Tem certeza que deseja excluir este orcamento?")) return;
    var novosOrcamentos = [];
    for (var i = 0; i < window.orcamentos.length; i++) {
        if (window.orcamentos[i].id !== id) {
            novosOrcamentos.push(window.orcamentos[i]);
        }
    }
    window.orcamentos = novosOrcamentos;
    salvarOrcamentos();
    listarOrcamentos();
    mostrarNotificacao("Orcamento excluido!", "success");
}

function duplicarOrcamento(id) {
    var original = null;
    for (var i = 0; i < window.orcamentos.length; i++) {
        if (window.orcamentos[i].id === id) {
            original = window.orcamentos[i];
            break;
        }
    }
    if (!original) {
        mostrarNotificacao("Orcamento nao encontrado!", "error");
        return;
    }
    
    var novo = {
        id: "orc_" + Date.now(),
        numero: gerarNumeroOrcamento(),
        cliente: original.cliente + " (copia)",
        cnpj: original.cnpj || "",
        endereco: original.endereco || "",
        data: original.data || "",
        prazo: original.prazo || "",
        observacoes: original.observacoes || "",
        status: original.status || "Pendente",
        desconto: original.desconto || 0,
        subtotal: original.subtotal || 0,
        total: original.total || 0,
        itens: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
    
    for (var j = 0; j < original.itens.length; j++) {
        novo.itens.push({
            descricao: original.itens[j].descricao || "",
            unidade: original.itens[j].unidade || "UN",
            quantidade: original.itens[j].quantidade || 1,
            valor_unitario: original.itens[j].valor_unitario || 0
        });
    }
    
    window.orcamentos.unshift(novo);
    salvarOrcamentos();
    listarOrcamentos();
    mostrarNotificacao("Orcamento duplicado!", "success");
}

// ============================================================
// NOTIFICACOES
// ============================================================

function mostrarNotificacao(mensagem, tipo, duracao) {
    if (tipo === undefined) tipo = "info";
    if (duracao === undefined) duracao = 4000;
    
    var cores = { success: "#27ae60", error: "#e74c3c", warning: "#f39c12", info: "#3498db" };
    var icon = { success: "fa-check-circle", error: "fa-times-circle", warning: "fa-exclamation-triangle", info: "fa-info-circle" };
    
    var notificacao = document.createElement("div");
    notificacao.style.cssText = "position: fixed; top: 20px; right: 20px; background: " + (cores[tipo] || "#3498db") + "; color: white; padding: 12px 20px; border-radius: 0px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); z-index: 9999999; font-family: 'Courier New', monospace; font-size: 0.85rem; display: flex; align-items: center; gap: 10px; max-width: 420px; opacity: 1; transition: opacity 0.5s ease; border: 2px solid #404040; border-top-color: #808080; border-left-color: #808080; font-weight: 700;";
    notificacao.innerHTML = '<i class="fas ' + (icon[tipo] || "fa-info-circle") + '"></i> ' + mensagem;
    document.body.appendChild(notificacao);
    
    setTimeout(function() {
        notificacao.style.opacity = "0";
        setTimeout(function() { notificacao.remove(); }, 500);
    }, duracao);
}

// ============================================================
// INICIALIZACAO
// ============================================================

function initializeOrcamento() {
    console.log("Inicializando...");
    carregarOrcamentos();
    
    var panel = document.getElementById("orcamentoPanel");
    if (panel) panel.style.display = "none";
    
    var toggleBtn = document.querySelector(".orcamento-toggle");
    if (toggleBtn) {
        toggleBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleOrcamentoPanel();
        };
    }
    
    var addBtn = document.getElementById("orcamentoAddItemBtn");
    if (addBtn) {
        addBtn.onclick = function(e) {
            e.preventDefault();
            console.log('Botao Adicionar Item clicado!');
            adicionarItemLinha();
        };
    }
    
    var cancelBtn = document.getElementById("orcamentoCancelBtn");
    if (cancelBtn) {
        cancelBtn.onclick = function() {
            if (window.orcamentoEditandoId) {
                if (confirm("Cancelar edicao?\n\nOs dados nao salvos serao perdidos.")) {
                    resetOrcamentoForm();
                    switchOrcamentoTab("list");
                    listarOrcamentos();
                }
            } else {
                resetOrcamentoForm();
                switchOrcamentoTab("list");
                listarOrcamentos();
            }
        };
        cancelBtn.style.display = "none";
    }
    
    var form = document.getElementById("orcamentoForm");
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            console.log('Formulario submetido!');
            salvarOrcamento();
        };
    }
    
    configurarFormatacaoCpfCnpj();
    configurarFormatacaoDesconto();
    
    setTimeout(function() {
        switchOrcamentoTab("list");
        listarOrcamentos();
    }, 100);
    
    console.log("Inicializado com sucesso!");
}

// ============================================================
// EXPOSICAO GLOBAL
// ============================================================

window.toggleOrcamentoPanel = toggleOrcamentoPanel;
window.switchOrcamentoTab = switchOrcamentoTab;
window.resetOrcamentoForm = resetOrcamentoForm;
window.salvarOrcamento = salvarOrcamento;
window.listarOrcamentos = listarOrcamentos;
window.adicionarItemLinha = adicionarItemLinha;
window.removerItemLinha = removerItemLinha;
window.recalcularTotais = recalcularTotais;
window.carregarOrcamentoParaEdicao = carregarOrcamentoParaEdicao;
window.verOrcamento = verOrcamento;
window.imprimirOrcamento = imprimirOrcamento;
window.gerarPDFOrcamento = gerarPDFOrcamento;
window.enviarWhatsAppOrcamento = enviarWhatsAppOrcamento;
window.excluirOrcamento = excluirOrcamento;
window.duplicarOrcamento = duplicarOrcamento;
window.mostrarNotificacao = mostrarNotificacao;
window.fecharModalWin98 = fecharModalWin98;
window.gerarRecibo = gerarRecibo;

console.log('orcamento.js v4.0 carregado - RECIBO COM WHATSAPP E PDF FUNCIONAIS!');

// ============================================================
// INICIALIZAR
// ============================================================

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeOrcamento);
} else {
    initializeOrcamento();
}
