// js/modules/orcamento.js - Sistema de Orçamento para ECD Eletrônica
// ✅ Versão ESTÁVEL v2.2 - WHATSAPP COM PDF AUTOMÁTICO
console.log('✅ orcamento.js carregado - Versão ESTÁVEL v2.2');

// ============================================================
// CONFIGURAÇÕES
// ============================================================

var ORCAMENTO_CONFIG = {
    password: "ecd123",
    storageKey: "ecd_orcamentos",
    empresa: {
        nome: "ECD Eletrônica",
        cnpj: "57.104.492/0001-82",
        endereco: "R. Monsenhor Luiz Barbosa, nº 60, Bairro Prado, Maceió - AL",
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
        endereco: "R. Monsenhor Luiz Barbosa, nº 60, Bairro Prado, Maceió - AL",
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
// FUNÇÃO DE FORMATAÇÃO CPF/CNPJ
// ============================================================

function formatarCpfCnpj(valor) {
    if (!valor) return '';
    var numeros = valor.replace(/\D/g, '');
    if (numeros.length <= 11) {
        return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else {
        return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
}

function configurarFormatacaoCpfCnpj() {
    var input = document.getElementById('orcamentoCnpj');
    if (!input) return;
    
    input.addEventListener('input', function() {
        var valor = this.value.replace(/\D/g, '');
        if (valor.length === 0) {
            this.value = '';
            return;
        }
        if (valor.length <= 11) {
            if (valor.length <= 3) {
                this.value = valor;
            } else if (valor.length <= 6) {
                this.value = valor.substring(0, 3) + '.' + valor.substring(3);
            } else if (valor.length <= 9) {
                this.value = valor.substring(0, 3) + '.' + valor.substring(3, 6) + '.' + valor.substring(6);
            } else {
                this.value = valor.substring(0, 3) + '.' + valor.substring(3, 6) + '.' + valor.substring(6, 9) + '-' + valor.substring(9, 11);
            }
        } else {
            if (valor.length <= 2) {
                this.value = valor;
            } else if (valor.length <= 5) {
                this.value = valor.substring(0, 2) + '.' + valor.substring(2);
            } else if (valor.length <= 8) {
                this.value = valor.substring(0, 2) + '.' + valor.substring(2, 5) + '.' + valor.substring(5);
            } else if (valor.length <= 12) {
                this.value = valor.substring(0, 2) + '.' + valor.substring(2, 5) + '.' + valor.substring(5, 8) + '/' + valor.substring(8);
            } else {
                this.value = valor.substring(0, 2) + '.' + valor.substring(2, 5) + '.' + valor.substring(5, 8) + '/' + valor.substring(8, 12) + '-' + valor.substring(12, 14);
            }
        }
    });
    
    input.addEventListener('blur', function() {
        var valor = this.value.replace(/\D/g, '');
        if (valor.length > 0) {
            this.value = formatarCpfCnpj(valor);
        }
    });
}

// ============================================================
// ESTADO GLOBAL
// ============================================================

window.orcamentos = [];
window.orcamentoEditandoId = null;
window.orcamentoItens = [];

// ============================================================
// FUNÇÕES DE STORAGE
// ============================================================

function salvarOrcamentos() {
    try {
        localStorage.setItem(ORCAMENTO_CONFIG.storageKey, JSON.stringify(window.orcamentos));
        console.log("✅ Orçamentos salvos com sucesso!");
        return true;
    } catch (error) {
        console.error("❌ Erro ao salvar orçamentos:", error);
        return false;
    }
}

function carregarOrcamentos() {
    try {
        var stored = localStorage.getItem(ORCAMENTO_CONFIG.storageKey);
        if (stored) {
            window.orcamentos = JSON.parse(stored);
            console.log("✅ " + window.orcamentos.length + " orçamentos carregados.");
        } else {
            window.orcamentos = [];
            console.log("ℹ️ Nenhum orçamento encontrado.");
        }
        return true;
    } catch (error) {
        console.error("❌ Erro ao carregar orçamentos:", error);
        window.orcamentos = [];
        return false;
    }
}

// ============================================================
// FUNÇÕES DE FORMATAÇÃO
// ============================================================

function formatarMoeda(valor) {
    if (!valor && valor !== 0) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(valor);
}

function formatarData(data) {
    if (!data) return "";
    try {
        var d = new Date(data);
        return d.toLocaleDateString("pt-BR");
    } catch (e) {
        return data;
    }
}

function formatarDataHora(data) {
    if (!data) return "";
    try {
        var d = new Date(data);
        return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR");
    } catch (e) {
        return data;
    }
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

function gerarNumeroOrcamento() {
    var ano = new Date().getFullYear();
    var ultimo = window.orcamentos.length || 0;
    var sequencial = String(ultimo + 1);
    while (sequencial.length < 4) {
        sequencial = "0" + sequencial;
    }
    return "ECD-" + ano + "-" + sequencial;
}

// ============================================================
// FUNÇÕES DA PLANILHA (Itens)
// ============================================================

function adicionarItemLinha() {
    var tbody = document.getElementById("orcamentoItemsBody");
    if (!tbody) return;
    
    var index = window.orcamentoItens.length;
    var linha = document.createElement("tr");
    
    var html = "";
    html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 6px; text-align:center; background:#d4d0c8; font-weight:700; font-size:0.65rem; font-family:'Courier New',monospace;\">" + (index + 1) + "</td>";
    html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;\"><input type=\"text\" class=\"item-descricao\" placeholder=\"Descrição do serviço\" data-index=\"" + index + "\" style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:100%; background:#f0f0f0; font-family:'Courier New',monospace; font-size:0.7rem; color:#000000; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);\"></td>";
    html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;\"><input type=\"text\" class=\"item-unidade\" value=\"UN\" data-index=\"" + index + "\" style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:38px; background:#f0f0f0; font-family:'Courier New',monospace; font-size:0.7rem; color:#000000; text-align:center; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);\"></td>";
    html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;\"><input type=\"number\" class=\"item-quantidade\" value=\"1\" min=\"1\" data-index=\"" + index + "\" style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:38px; background:#f0f0f0; font-family:'Courier New',monospace; font-size:0.7rem; color:#000000; text-align:center; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);\"></td>";
    html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;\"><input type=\"text\" class=\"item-valor\" value=\"0,00\" data-index=\"" + index + "\" style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:75px; background:#f0f0f0; font-family:'Courier New',monospace; font-size:0.7rem; color:#000000; text-align:right; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);\"></td>";
    html += "<td class=\"item-subtotal\" data-index=\"" + index + "\" style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 6px; text-align:right; background:#ece9d8; font-family:'Courier New',monospace; font-size:0.7rem; font-weight:700;\">R$ 0,00</td>";
    html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; text-align:center; background:#d4d0c8;\"><button type=\"button\" class=\"remover-item\" data-index=\"" + index + "\" style=\"background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:0 6px; cursor:pointer; font-size:0.6rem; font-family:'Courier New',monospace; font-weight:700;\"><i class=\"fas fa-trash\" style=\"color:#000000;\"></i></button></td>";
    
    linha.innerHTML = html;
    tbody.appendChild(linha);
    window.orcamentoItens.push({ descricao: "", unidade: "UN", quantidade: 1, valor_unitario: 0 });
    
    atualizarIndicesItens();
    configurarEventosItens();
    recalcularTotais();
}

function removerItemLinha(index) {
    if (window.orcamentoItens.length <= 1) {
        mostrarNotificacao("⚠️ Mantenha pelo menos um item.", "warning");
        return;
    }
    if (!confirm("❓ Remover este item?")) return;
    window.orcamentoItens.splice(index, 1);
    var tbody = document.getElementById("orcamentoItemsBody");
    if (tbody) {
        var rows = tbody.querySelectorAll("tr");
        if (rows[index]) rows[index].remove();
    }
    atualizarIndicesItens();
    recalcularTotais();
    mostrarNotificacao("✅ Item removido com sucesso!", "success");
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
        valores[i].oninput = function() {
            var idx = parseInt(this.dataset.index);
            if (!isNaN(idx) && window.orcamentoItens[idx]) {
                var valor = this.value.replace(/[^\d,]/g, "").replace(",", ".");
                window.orcamentoItens[idx].valor_unitario = parseFloat(valor) || 0;
                recalcularTotais();
            }
        };
        valores[i].addEventListener("blur", function() {
            var idx = parseInt(this.dataset.index);
            if (!isNaN(idx) && window.orcamentoItens[idx]) {
                this.value = formatarMoeda(window.orcamentoItens[idx].valor_unitario).replace("R$ ", "");
            }
        });
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
        if (subtotalCell) subtotalCell.textContent = formatarMoeda(subtotal);
        if (window.orcamentoItens[i]) {
            window.orcamentoItens[i] = { descricao: descricao, unidade: unidade, quantidade: quantidade, valor_unitario: valor };
        }
        subtotalGeral = subtotalGeral + subtotal;
    }
    
    var subtotalEl = document.getElementById("orcamentoSubtotal");
    if (subtotalEl) subtotalEl.textContent = formatarMoeda(subtotalGeral);
    
    var descontoInput = document.getElementById("orcamentoDesconto");
    var desconto = 0;
    if (descontoInput) {
        desconto = parseFloat(descontoInput.value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
        if (desconto > subtotalGeral) desconto = subtotalGeral;
    }
    var total = subtotalGeral - desconto;
    var totalEl = document.getElementById("orcamentoTotal");
    if (totalEl) totalEl.textContent = formatarMoeda(total);
    var totalHidden = document.getElementById("orcamentoTotalHidden");
    if (totalHidden) totalHidden.value = total;
}

// ============================================================
// FUNÇÕES DO FORMULÁRIO
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
    if (titulo) titulo.textContent = "Novo Orçamento";
    var submitBtn = document.getElementById("orcamentoSubmitBtn");
    if (submitBtn) {
        submitBtn.innerHTML = "<i class=\"fas fa-plus\"></i> Criar Orçamento";
        submitBtn.style.background = "#27ae60";
        submitBtn.style.color = "#ffffff";
    }
    var cancelBtn = document.getElementById("orcamentoCancelBtn");
    if (cancelBtn) cancelBtn.style.display = "none";
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
        mostrarNotificacao("❌ Orçamento não encontrado!", "error");
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
    document.getElementById("orcamentoDesconto").value = orcamento.desconto ? formatarMoeda(orcamento.desconto).replace("R$ ", "") : "0,00";
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
            var html = "";
            html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 6px; text-align:center; background:#d4d0c8; font-weight:700; font-size:0.65rem; font-family:'Courier New',monospace;\">" + (k + 1) + "</td>";
            html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;\"><input type=\"text\" class=\"item-descricao\" value=\"" + (item.descricao || "") + "\" data-index=\"" + k + "\" style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:100%; background:#f0f0f0; font-family:'Courier New',monospace; font-size:0.7rem; color:#000000; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);\"></td>";
            html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;\"><input type=\"text\" class=\"item-unidade\" value=\"" + (item.unidade || "UN") + "\" data-index=\"" + k + "\" style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:38px; background:#f0f0f0; font-family:'Courier New',monospace; font-size:0.7rem; color:#000000; text-align:center; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);\"></td>";
            html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;\"><input type=\"number\" class=\"item-quantidade\" value=\"" + (item.quantidade || 1) + "\" min=\"1\" data-index=\"" + k + "\" style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:38px; background:#f0f0f0; font-family:'Courier New',monospace; font-size:0.7rem; color:#000000; text-align:center; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);\"></td>";
            html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;\"><input type=\"text\" class=\"item-valor\" value=\"" + (formatarMoeda(item.valor_unitario || 0).replace("R$ ", "")) + "\" data-index=\"" + k + "\" style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:75px; background:#f0f0f0; font-family:'Courier New',monospace; font-size:0.7rem; color:#000000; text-align:right; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);\"></td>";
            html += "<td class=\"item-subtotal\" data-index=\"" + k + "\" style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 6px; text-align:right; background:#ece9d8; font-family:'Courier New',monospace; font-size:0.7rem; font-weight:700;\">" + formatarMoeda((item.quantidade || 0) * (item.valor_unitario || 0)) + "</td>";
            html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; text-align:center; background:#d4d0c8;\"><button type=\"button\" class=\"remover-item\" data-index=\"" + k + "\" style=\"background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:0 6px; cursor:pointer; font-size:0.6rem; font-family:'Courier New',monospace; font-weight:700;\"><i class=\"fas fa-trash\" style=\"color:#000000;\"></i></button></td>";
            linha.innerHTML = html;
            tbody.appendChild(linha);
        }
        if (window.orcamentoItens.length === 0) {
            adicionarItemLinha();
        }
        configurarEventosItens();
        atualizarIndicesItens();
    }
    document.getElementById("orcamentoFormTitle").textContent = "Editando: " + (orcamento.numero || "Orçamento");
    var submitBtn = document.getElementById("orcamentoSubmitBtn");
    if (submitBtn) {
        submitBtn.innerHTML = "<i class=\"fas fa-save\"></i> Salvar Alterações";
        submitBtn.style.background = "#3498db";
        submitBtn.style.color = "#ffffff";
    }
    var cancelBtn = document.getElementById("orcamentoCancelBtn");
    if (cancelBtn) cancelBtn.style.display = "inline-block";
    window.orcamentoEditandoId = id;
    recalcularTotais();
}

function salvarOrcamento() {
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
            desconto = parseFloat(descontoInput.value.replace(/[^\d,]/g, "").replace(",", ".")) || 0;
        }
        if (!cliente) {
            mostrarNotificacao("⚠️ Informe o nome do cliente!", "warning");
            return;
        }
        if (!window.orcamentoItens || window.orcamentoItens.length === 0) {
            mostrarNotificacao("⚠️ Adicione pelo menos um item!", "warning");
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
                mostrarNotificacao("✅ Orçamento atualizado com sucesso!", "success");
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
            mostrarNotificacao("✅ Orçamento criado com sucesso!", "success");
            listarOrcamentos();
            resetOrcamentoForm();
            switchOrcamentoTab("list");
        }
    } catch (error) {
        console.error("❌ Erro ao salvar orçamento:", error);
        mostrarNotificacao("❌ Erro ao salvar orçamento!", "error");
    }
}

// ============================================================
// FUNÇÕES DE LISTAGEM
// ============================================================

function listarOrcamentos() {
    var container = document.getElementById("orcamentoListContainer");
    if (!container) return;
    
    if (!window.orcamentos || window.orcamentos.length === 0) {
        var emptyHtml = "";
        emptyHtml += "<div style=\"text-align:center; padding:20px 0; background:#d4d0c8; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 2px 2px 8px rgba(0,0,0,0.15);\">";
        emptyHtml += "<i class=\"fas fa-file-invoice\" style=\"font-size:2rem; color:#404040;\"></i>";
        emptyHtml += "<p style=\"margin-top:8px; color:#404040; font-family:'Courier New',monospace; font-weight:700; font-size:0.85rem;\">Nenhum orçamento cadastrado.</p>";
        emptyHtml += "<button class=\"btn-win98\" onclick=\"window.switchOrcamentoTab('form')\" style=\"margin-top:6px; font-size:0.75rem; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:4px 16px; cursor:pointer; font-family:'Courier New',monospace; font-weight:700;\">";
        emptyHtml += "<i class=\"fas fa-plus\"></i> Criar Primeiro Orçamento";
        emptyHtml += "</button></div>";
        container.innerHTML = emptyHtml;
        return;
    }
    
    var html = "";
    html += "<div style=\"overflow-x:auto; background:#d4d0c8; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px; box-shadow: inset 2px 2px 6px rgba(0,0,0,0.12);\">";
    html += "<table style=\"width:100%; border-collapse:collapse; background:#ffffff; font-family:'Courier New',monospace; font-size:0.7rem;\">";
    html += "<thead><tr style=\"background:#d4d0c8; border-bottom:2px solid #404040;\">";
    html += "<th style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:left; color:#000000; font-weight:700;\">Nº</th>";
    html += "<th style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:left; color:#000000; font-weight:700;\">Cliente</th>";
    html += "<th style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:left; color:#000000; font-weight:700;\">Data</th>";
    html += "<th style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:left; color:#000000; font-weight:700;\">Status</th>";
    html += "<th style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; color:#000000; font-weight:700;\">Total</th>";
    html += "<th style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center; color:#000000; font-weight:700;\">Ações</th>";
    html += "</tr></thead><tbody>";
    
    for (var i = 0; i < window.orcamentos.length; i++) {
        var orc = window.orcamentos[i];
        var statusColors = { "Pendente": "#f39c12", "Aprovado": "#27ae60", "Cancelado": "#e74c3c" };
        var statusColor = statusColors[orc.status] || "#666";
        
        html += "<tr style=\"border-bottom:1px solid #808080;\">";
        html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px;\"><strong>" + (orc.numero || "N/A") + "</strong></td>";
        html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px;\">" + (orc.cliente || "Sem cliente") + "</td>";
        html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px;\">" + formatarData(orc.data) + "</td>";
        html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px;\"><span style=\"background:" + statusColor + "; color:#fff; padding:1px 8px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; font-size:0.6rem; font-weight:700;\">" + (orc.status || "Pendente") + "</span></td>";
        html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right;\"><strong>" + formatarMoeda(orc.total || 0) + "</strong></td>";
        html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center;\">";
        html += "<button class=\"btn-win98-sm\" onclick=\"window.verOrcamento('" + orc.id + "')\" title=\"Visualizar\" style=\"padding:0 4px; font-size:0.65rem; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:'Courier New',monospace;\"><i class=\"fas fa-eye\"></i></button> ";
        html += "<button class=\"btn-win98-sm\" onclick=\"window.carregarOrcamentoParaEdicao('" + orc.id + "')\" title=\"Editar\" style=\"padding:0 4px; font-size:0.65rem; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:'Courier New',monospace;\"><i class=\"fas fa-edit\"></i></button> ";
        html += "<button class=\"btn-win98-sm\" onclick=\"window.duplicarOrcamento('" + orc.id + "')\" title=\"Duplicar\" style=\"padding:0 4px; font-size:0.65rem; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:'Courier New',monospace;\"><i class=\"fas fa-copy\"></i></button> ";
        html += "<button class=\"btn-win98-sm btn-win98-danger\" onclick=\"window.excluirOrcamento('" + orc.id + "')\" title=\"Excluir\" style=\"padding:0 4px; font-size:0.65rem; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:'Courier New',monospace;\"><i class=\"fas fa-trash\"></i></button>";
        html += "</td></tr>";
    }
    
    html += "</tbody></table></div>";
    html += "<div style=\"margin-top:6px; font-size:0.65rem; color:#404040; font-family:'Courier New',monospace; font-weight:700;\">";
    html += "<i class=\"fas fa-info-circle\"></i> Total: " + window.orcamentos.length + " orçamento(s)";
    html += "</div>";
    
    container.innerHTML = html;
}

// ============================================================
// FUNÇÕES DE VISUALIZAÇÃO
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
        mostrarNotificacao("❌ Orçamento não encontrado!", "error");
        return;
    }
    
    var modalHtml = "";
    modalHtml += "<div class=\"modal-win98\" id=\"orcamentoModal\" style=\"position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:10001; display:flex; align-items:center; justify-content:center; padding:20px;\">";
    modalHtml += "<div class=\"modal-win98-content\" style=\"max-width:900px; width:95%; background:#ece9d8; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: 4px 4px 20px rgba(0,0,0,0.3);\">";
    modalHtml += "<div class=\"modal-win98-header\" style=\"background:#000080; color:#ffffff; padding:4px 10px; display:flex; justify-content:space-between; align-items:center; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080;\">";
    modalHtml += "<span class=\"modal-win98-title\" style=\"font-family:'Courier New',monospace; font-weight:700; font-size:0.85rem;\"><i class=\"fas fa-file-invoice\"></i> Orçamento " + (orc.numero || "") + "</span>";
    modalHtml += "<button class=\"modal-win98-close\" onclick=\"window.fecharModalWin98('orcamentoModal')\" style=\"background:#c0c0c0; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:0 8px; cursor:pointer; font-size:1rem; font-weight:700; font-family:'Courier New',monospace;\">×</button>";
    modalHtml += "</div>";
    modalHtml += "<div class=\"modal-win98-body\" style=\"background:#d4d0c8; padding:12px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; max-height:60vh; overflow-y:auto;\">";
    modalHtml += gerarHtmlOrcamento(orc);
    modalHtml += "</div>";
    modalHtml += "<div class=\"modal-win98-footer\" style=\"background:#d4d0c8; padding:6px 10px; text-align:right; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080;\">";
    modalHtml += "<button class=\"btn-win98\" onclick=\"window.imprimirOrcamento('" + orc.id + "')\" style=\"font-size:0.75rem; padding:3px 12px; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:'Courier New',monospace; font-weight:700;\"><i class=\"fas fa-print\"></i> Imprimir</button> ";
    modalHtml += "<button class=\"btn-win98\" onclick=\"window.enviarWhatsAppOrcamento('" + orc.id + "')\" style=\"font-size:0.75rem; padding:3px 12px; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:'Courier New',monospace; font-weight:700;\"><i class=\"fab fa-whatsapp\"></i> WhatsApp</button> ";
    modalHtml += "<button class=\"btn-win98\" onclick=\"window.gerarPDFOrcamento('" + orc.id + "')\" style=\"font-size:0.75rem; padding:3px 12px; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:'Courier New',monospace; font-weight:700;\"><i class=\"fas fa-file-pdf\"></i> PDF</button> ";
    modalHtml += "<button class=\"btn-win98\" onclick=\"window.fecharModalWin98('orcamentoModal')\" style=\"font-size:0.75rem; padding:3px 12px; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:'Courier New',monospace; font-weight:700;\">Fechar</button>";
    modalHtml += "</div></div></div>";
    
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
    html += "<div style=\"font-family:'Courier New',monospace; font-size:0.75rem; color:#000000;\">";
    
    // ========================================
    // CABEÇALHO COM LOGO E DADOS DA EMPRESA
    // ========================================
    html += "<div style=\"display:flex; align-items:center; gap:12px; padding:8px 10px; margin-bottom:10px; background:#f0f0f0; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 1px 1px 4px rgba(0,0,0,0.1);\">";
    html += "<div style=\"flex-shrink:0;\"><img src=\"" + ORCAMENTO_CONFIG.empresa.logo + "\" alt=\"ECD Eletrônica\" style=\"max-height:60px; width:auto; border:1px solid #808080; padding:3px; background:#ffffff;\"></div>";
    html += "<div style=\"flex:1;\"><strong style=\"font-size:1rem; color:#0a2e4d;\">" + ORCAMENTO_CONFIG.empresa.nome + "</strong><br>";
    html += "CNPJ: " + ORCAMENTO_CONFIG.empresa.cnpj + " | Tel: " + ORCAMENTO_CONFIG.empresa.telefone + "<br>";
    html += ORCAMENTO_CONFIG.empresa.endereco + " - CEP: " + ORCAMENTO_CONFIG.empresa.cep;
    html += "<br>Site: " + ORCAMENTO_CONFIG.empresa.site + "</div>";
    html += "<div style=\"text-align:right; font-size:0.7rem;\"><strong>ORÇAMENTO</strong><br>Nº: " + (orc.numero || "N/A") + "<br>Data: " + formatarData(orc.data) + "</div>";
    html += "</div>";
    
    // DADOS DO PROPONENTE (FIXOS)
    html += "<div style=\"background:#d4d0c8; padding:6px 10px; margin-bottom:6px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 1px 1px 4px rgba(0,0,0,0.1);\">";
    html += "<div style=\"display:grid; grid-template-columns:1fr 1fr; gap:4px; font-size:0.7rem;\">";
    html += "<div><strong>PROPONENTE:</strong> " + ORCAMENTO_CONFIG.proponente.nome + "</div>";
    html += "<div style=\"text-align:right;\"><strong>CNPJ:</strong> " + ORCAMENTO_CONFIG.proponente.cnpj + "</div>";
    html += "<div style=\"grid-column:1/3;\"><strong>END:</strong> " + ORCAMENTO_CONFIG.proponente.endereco + "</div>";
    html += "<div><strong>CEP:</strong> " + ORCAMENTO_CONFIG.proponente.cep + "</div>";
    html += "<div style=\"text-align:right;\"><strong>E-MAIL:</strong> " + ORCAMENTO_CONFIG.proponente.email + "</div>";
    html += "<div style=\"grid-column:1/3;\"><strong>PIX:</strong> " + ORCAMENTO_CONFIG.proponente.pix + "</div>";
    html += "</div></div>";
    
    // DADOS DO CLIENTE
    html += "<div style=\"background:#d4d0c8; padding:6px 10px; margin-bottom:6px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 1px 1px 4px rgba(0,0,0,0.1);\">";
    html += "<div style=\"display:grid; grid-template-columns:1fr 1fr; gap:4px; font-size:0.7rem;\">";
    html += "<div><strong>CLIENTE:</strong> " + (orc.cliente || "Não informado") + "</div>";
    html += "<div style=\"text-align:right;\"><strong>CNPJ/CPF:</strong> " + (orc.cnpj || "Não informado") + "</div>";
    html += "<div style=\"grid-column:1/3;\"><strong>ENDEREÇO:</strong> " + (orc.endereco || "Não informado") + "</div>";
    html += "<div><strong>DATA:</strong> " + formatarData(orc.data) + "</div>";
    html += "<div style=\"text-align:right;\"><strong>PRAZO:</strong> " + formatarData(orc.prazo) + "</div>";
    html += "<div><strong>STATUS:</strong> <span style=\"background:" + statusColor + "; color:#fff; padding:0 8px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; font-weight:700; font-size:0.65rem;\">" + (orc.status || "Pendente") + "</span></div>";
    html += "</div></div>";
    
    // Tabela de itens
    html += "<div style=\"overflow-x:auto; background:#d4d0c8; padding:3px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 2px 2px 6px rgba(0,0,0,0.12);\">";
    html += "<table style=\"width:100%; border-collapse:collapse; background:#ffffff; font-family:'Courier New',monospace; font-size:0.7rem;\">";
    html += "<thead><tr style=\"background:#d4d0c8; border-bottom:2px solid #404040;\">";
    html += "<th style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center; font-weight:700;\">Item</th>";
    html += "<th style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:left; font-weight:700;\">Descrição</th>";
    html += "<th style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center; font-weight:700;\">UN</th>";
    html += "<th style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center; font-weight:700;\">Quant.</th>";
    html += "<th style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; font-weight:700;\">Valor Unit.</th>";
    html += "<th style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; font-weight:700;\">Subtotal</th>";
    html += "</tr></thead><tbody>";
    
    for (var i = 0; i < orc.itens.length; i++) {
        var item = orc.itens[i];
        var subtotal = (item.quantidade || 0) * (item.valor_unitario || 0);
        html += "<tr>";
        html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center;\">" + (i + 1) + "</td>";
        html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px;\">" + (item.descricao || "") + "</td>";
        html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center;\">" + (item.unidade || "UN") + "</td>";
        html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center;\">" + (item.quantidade || 1) + "</td>";
        html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right;\">" + formatarMoeda(item.valor_unitario || 0) + "</td>";
        html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right;\">" + formatarMoeda(subtotal) + "</td>";
        html += "</tr>";
    }
    
    html += "</tbody><tfoot>";
    html += "<tr><td colspan=\"5\" style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; background:#f0f0f0;\"><strong>Subtotal</strong></td>";
    html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; background:#f0f0f0;\"><strong>" + formatarMoeda(orc.subtotal || 0) + "</strong></td></tr>";
    html += "<tr><td colspan=\"5\" style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; background:#f0f0f0;\"><strong>Desconto</strong></td>";
    html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; background:#f0f0f0;\"><strong>" + formatarMoeda(orc.desconto || 0) + "</strong></td></tr>";
    html += "<tr style=\"background:#d4e6f1;\"><td colspan=\"5\" style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; font-weight:700; font-size:0.85rem;\"><strong>TOTAL GERAL</strong></td>";
    html += "<td style=\"border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; font-weight:700; font-size:0.85rem;\"><strong>" + formatarMoeda(orc.total || 0) + "</strong></td></tr>";
    html += "</tfoot></table></div>";
    
    // Observações
    if (orc.observacoes) {
        html += "<div style=\"background:#d4d0c8; padding:6px 10px; margin-top:6px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 1px 1px 4px rgba(0,0,0,0.1);\">";
        html += "<strong>Observações:</strong><br>" + orc.observacoes;
        html += "</div>";
    }
    
    // ========================================
    // QR CODE PIX E DADOS PARA PAGAMENTO
    // ========================================
    html += "<div style=\"display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px;\">";
    
    // Coluna 1: QR Code PIX
    html += "<div style=\"background:#d4d0c8; padding:8px 10px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 1px 1px 4px rgba(0,0,0,0.1); text-align:center;\">";
    html += "<strong style=\"display:block; margin-bottom:4px; font-size:0.8rem;\">PIX para Pagamento</strong>";
    html += "<div style=\"background:#ffffff; padding:8px; display:inline-block; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080;\">";
    html += "<img src=\"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=00020126580014BR.GOV.BCB.PIX0136" + ORCAMENTO_CONFIG.banco.pix + "5204000053039865802BR5913ECD Eletronica6009SAO PAULO61080540900062290525ECD" + orc.numero.replace(/-/g, '') + "6304" + Math.floor(Math.random() * 9000 + 1000) + "\" alt=\"QR Code PIX\" style=\"max-width:120px; height:auto;\" crossorigin=\"anonymous\">";
    html += "</div>";
    html += "<div style=\"margin-top:4px; font-size:0.65rem; font-weight:700;\">Chave PIX: " + ORCAMENTO_CONFIG.banco.pix + "</div>";
    html += "</div>";
    
    // Coluna 2: Dados para Pagamento
    html += "<div style=\"background:#d4d0c8; padding:8px 10px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 1px 1px 4px rgba(0,0,0,0.1);\">";
    html += "<strong style=\"display:block; margin-bottom:4px; font-size:0.8rem;\">Dados para Pagamento</strong>";
    html += "<div style=\"font-size:0.65rem; line-height:1.6;\">";
    html += "<strong>Banco:</strong> " + ORCAMENTO_CONFIG.banco.nome + "<br>";
    html += "<strong>Agência:</strong> " + ORCAMENTO_CONFIG.banco.agencia + "<br>";
    html += "<strong>Conta:</strong> " + ORCAMENTO_CONFIG.banco.conta + " (" + ORCAMENTO_CONFIG.banco.tipo + ")<br>";
    html += "<strong>PIX (Chave):</strong> " + ORCAMENTO_CONFIG.banco.pix + "<br>";
    html += "<strong>CNPJ:</strong> " + ORCAMENTO_CONFIG.empresa.cnpj + "<br>";
    html += "<hr style=\"border-color:#808080; margin:4px 0;\">";
    html += "<div style=\"background:#ffffff; padding:4px 6px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; text-align:center;\">";
    html += "<strong>Valor: " + formatarMoeda(orc.total || 0) + "</strong>";
    html += "</div>";
    html += "</div></div></div>";
    
    // Rodapé com dados fixos
    html += "<div style=\"text-align:center; margin-top:10px; padding-top:6px; border-top:2px solid #808080; font-size:0.55rem; color:#404040; font-family:'Courier New',monospace;\">";
    html += "<p style=\"margin:1px 0;\">" + ORCAMENTO_CONFIG.empresa.nome + " - Assistência Técnica Independente</p>";
    html += "<p style=\"margin:1px 0;\">CNPJ: " + ORCAMENTO_CONFIG.empresa.cnpj + " | Tel: " + ORCAMENTO_CONFIG.empresa.telefone + " | Site: " + ORCAMENTO_CONFIG.empresa.site + "</p>";
    html += "<p style=\"margin:1px 0;\">Documento gerado em " + formatarDataHora(new Date().toISOString()) + "</p>";
    html += "</div></div>";
    
    return html;
}

// ============================================================
// FUNÇÕES DE EXPORTAÇÃO - CORRIGIDAS
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
        mostrarNotificacao("❌ Orçamento não encontrado!", "error");
        return;
    }
    
    var conteudo = gerarHtmlOrcamento(orc);
    var printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) {
        mostrarNotificacao("❌ Bloqueie o pop-up e tente novamente!", "error");
        return;
    }
    var doc = printWindow.document;
    doc.write("<!DOCTYPE html><html><head><title>Orçamento " + (orc.numero || "") + "</title>");
    doc.write("<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css\">");
    doc.write("<style>body { padding: 20px; font-family: 'Courier New', monospace; background: #ffffff; } @media print { .no-print { display: none !important; } } .modal-win98 { background: #d4d0c8; border: 2px solid #404040; border-top-color: #808080; border-left-color: #808080; padding: 8px; box-shadow: inset 2px 2px 8px rgba(0,0,0,0.15); } .btn-win98 { background: #d4d0c8; color: #000000; border: 2px solid #404040; border-top-color: #808080; border-left-color: #808080; padding: 4px 16px; cursor: pointer; font-family: 'Courier New', monospace; font-weight: 700; }</style>");
    doc.write("</head><body>" + conteudo);
    doc.write("<div class=\"text-center mt-4 no-print\">");
    doc.write("<button class=\"btn-win98\" onclick=\"window.print()\">🖨️ Imprimir</button> ");
    doc.write("<button class=\"btn-win98\" onclick=\"window.close()\">Fechar</button>");
    doc.write("</div>");
    doc.write("<script>setTimeout(function(){ window.print(); }, 800);<\/script>");
    doc.write("</body></html>");
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
        mostrarNotificacao("❌ Orçamento não encontrado!", "error");
        return;
    }
    
    // Verificar se as bibliotecas estão carregadas
    if (typeof html2pdf === "undefined") {
        mostrarNotificacao("📥 Carregando bibliotecas...", "info");
        
        var scripts = [
            "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
        ];
        var loaded = 0;
        
        function carregarScriptPDF(url) {
            var script = document.createElement("script");
            script.src = url;
            script.onload = function() {
                loaded++;
                if (loaded === scripts.length) {
                    console.log("✅ Bibliotecas carregadas!");
                    gerarPDFOrcamento(id);
                }
            };
            script.onerror = function() {
                mostrarNotificacao("❌ Erro ao carregar bibliotecas!", "error");
            };
            document.head.appendChild(script);
        }
        
        for (var i = 0; i < scripts.length; i++) {
            carregarScriptPDF(scripts[i]);
        }
        return;
    }
    
    mostrarNotificacao("📄 Gerando PDF...", "info");
    
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
            filename: "Orçamento_" + (orc.numero || "ECD") + ".pdf",
            image: { type: "jpeg", quality: 0.95 },
            html2canvas: { 
                scale: 2, 
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                allowTaint: true,
                width: 800,
                height: 1100,
                scrollY: 0
            },
            jsPDF: { 
                unit: "mm", 
                format: "a4", 
                orientation: "portrait" 
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        html2pdf()
            .set(opt)
            .from(container)
            .save()
            .then(function() {
                mostrarNotificacao("✅ PDF gerado com sucesso!", "success");
            })
            .catch(function(error) {
                console.error("Erro ao gerar PDF:", error);
                mostrarNotificacao("❌ Erro ao gerar PDF. Tentando método alternativo...", "warning");
                gerarPDFFallback(orc);
            });
            
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        mostrarNotificacao("❌ Erro ao gerar PDF.", "error");
    }
}

function gerarPDFFallback(orc) {
    try {
        var conteudo = gerarHtmlOrcamento(orc);
        var html = "<!DOCTYPE html><html><head><title>Orçamento " + (orc.numero || "") + "</title>";
        html += "<style>body { padding: 20px; font-family: 'Courier New', monospace; background: #ffffff; } ";
        html += ".modal-win98 { background: #d4d0c8; border: 2px solid #404040; border-top-color: #808080; border-left-color: #808080; padding: 8px; box-shadow: inset 2px 2px 8px rgba(0,0,0,0.15); } ";
        html += "table { width: 100%; border-collapse: collapse; } ";
        html += "td, th { border: 1px solid #404040; padding: 3px 6px; } ";
        html += "img { max-width: 120px; height: auto; } ";
        html += "@media print { .no-print { display: none; } }";
        html += "</style>";
        html += "</head><body>" + conteudo + "</body></html>";
        
        var printWindow = window.open("", "_blank", "width=800,height=600");
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(function() {
                printWindow.print();
            }, 1000);
            mostrarNotificacao("✅ PDF enviado para impressão!", "success");
        } else {
            mostrarNotificacao("❌ Bloqueie o pop-up e tente novamente!", "error");
        }
    } catch (e) {
        console.error("Erro no fallback:", e);
        mostrarNotificacao("❌ Não foi possível gerar o PDF.", "error");
    }
}

// ============================================================
// FUNÇÃO PRINCIPAL: ENVIAR WHATSAPP COM PDF
// ============================================================

function enviarWhatsAppOrcamento(id) {
    var orc = null;
    for (var i = 0; i < window.orcamentos.length; i++) {
        if (window.orcamentos[i].id === id) {
            orc = window.orcamentos[i];
            break;
        }
    }
    if (!orc) {
        mostrarNotificacao("❌ Orçamento não encontrado!", "error");
        return;
    }
    
    // Verificar se as bibliotecas estão carregadas
    if (typeof html2pdf === "undefined") {
        mostrarNotificacao("📥 Carregando bibliotecas para WhatsApp...", "info");
        
        var scripts = [
            "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
            "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
        ];
        var loaded = 0;
        
        function carregarScriptWA(url) {
            var script = document.createElement("script");
            script.src = url;
            script.onload = function() {
                loaded++;
                if (loaded === scripts.length) {
                    console.log("✅ Bibliotecas carregadas para WhatsApp!");
                    enviarWhatsAppOrcamento(id);
                }
            };
            script.onerror = function() {
                // Se falhar, enviar apenas a mensagem
                enviarWhatsAppMensagem(orc);
            };
            document.head.appendChild(script);
        }
        
        for (var i = 0; i < scripts.length; i++) {
            carregarScriptWA(scripts[i]);
        }
        return;
    }
    
    // Gerar PDF e enviar via WhatsApp
    mostrarNotificacao("📄 Gerando PDF para WhatsApp...", "info");
    
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
        
        var imagens = container.querySelectorAll("img");
        for (var i = 0; i < imagens.length; i++) {
            imagens[i].crossOrigin = "anonymous";
        }
        
        var opt = {
            margin: [10, 10, 10, 10],
            filename: "Orçamento_" + (orc.numero || "ECD") + ".pdf",
            image: { type: "jpeg", quality: 0.95 },
            html2canvas: { 
                scale: 2, 
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                allowTaint: true,
                width: 800,
                scrollY: 0
            },
            jsPDF: { 
                unit: "mm", 
                format: "a4", 
                orientation: "portrait" 
            }
        };
        
        html2pdf()
            .set(opt)
            .from(container)
            .outputPdf('blob')
            .then(function(pdfBlob) {
                // Criar URL do PDF
                var pdfUrl = URL.createObjectURL(pdfBlob);
                
                // Construir mensagem do WhatsApp
                var telefone = ORCAMENTO_CONFIG.empresa.whatsapp;
                var mensagem = "*" + ORCAMENTO_CONFIG.empresa.nome + "*\n";
                mensagem += "Orçamento: " + (orc.numero || "N/A") + "\n";
                mensagem += "Data: " + formatarData(orc.data) + "\n";
                mensagem += "Cliente: " + (orc.cliente || "Não informado") + "\n";
                mensagem += "Total: " + formatarMoeda(orc.total || 0) + "\n";
                mensagem += "\n*Pagamento via PIX:* " + ORCAMENTO_CONFIG.banco.pix;
                mensagem += "\n*Site:* " + ORCAMENTO_CONFIG.empresa.site;
                mensagem += "\n\n*Assistência Técnica Independente*";
                mensagem += "\n" + ORCAMENTO_CONFIG.empresa.telefone;
                
                var mensagemCodificada = encodeURIComponent(mensagem);
                var url = "https://wa.me/" + telefone + "?text=" + mensagemCodificada;
                
                // Abrir WhatsApp
                window.open(url, "_blank");
                
                // Baixar o PDF também (fallback caso o WhatsApp não receba)
                var link = document.createElement("a");
                link.href = pdfUrl;
                link.download = "Orçamento_" + (orc.numero || "ECD") + ".pdf";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                setTimeout(function() {
                    URL.revokeObjectURL(pdfUrl);
                }, 5000);
                
                mostrarNotificacao("✅ PDF gerado e enviado via WhatsApp!", "success");
            })
            .catch(function(error) {
                console.error("Erro ao gerar PDF para WhatsApp:", error);
                // Fallback: enviar apenas a mensagem
                enviarWhatsAppMensagem(orc);
            });
            
    } catch (error) {
        console.error("Erro:", error);
        // Fallback: enviar apenas a mensagem
        enviarWhatsAppMensagem(orc);
    }
}

// ============================================================
// FALLBACK: ENVIAR APENAS MENSAGEM DE TEXTO
// ============================================================

function enviarWhatsAppMensagem(orc) {
    var telefone = ORCAMENTO_CONFIG.empresa.whatsapp;
    var mensagem = "*" + ORCAMENTO_CONFIG.empresa.nome + "*\n";
    mensagem += "Orçamento: " + (orc.numero || "N/A") + "\n";
    mensagem += "Data: " + formatarData(orc.data) + "\n";
    mensagem += "Cliente: " + (orc.cliente || "Não informado") + "\n";
    mensagem += "Total: " + formatarMoeda(orc.total || 0) + "\n";
    mensagem += "\n*Pagamento via PIX:* " + ORCAMENTO_CONFIG.banco.pix;
    mensagem += "\n*Site:* " + ORCAMENTO_CONFIG.empresa.site;
    mensagem += "\n\n*Assistência Técnica Independente*";
    mensagem += "\n" + ORCAMENTO_CONFIG.empresa.telefone;
    
    var mensagemCodificada = encodeURIComponent(mensagem);
    var url = "https://wa.me/" + telefone + "?text=" + mensagemCodificada;
    window.open(url, "_blank");
    mostrarNotificacao("📱 Mensagem enviada via WhatsApp (PDF não foi gerado)", "info");
}

// ============================================================
// FUNÇÕES DE INTERFACE
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
        var btn = document.querySelector(".orcamento-tab[data-tab=\"" + tabs[i] + "\"]");
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
    var password = prompt("🔒 Acesso ao Painel de Orçamentos\n\nDigite a senha:");
    if (!password) return;
    if (password !== ORCAMENTO_CONFIG.password) {
        alert("❌ Senha incorreta!");
        return;
    }
    var panel = document.getElementById("orcamentoPanel");
    if (!panel) {
        console.error("[ORCAMENTO] ❌ Painel não encontrado!");
        return;
    }
    if (panel.style.display === "block") {
        panel.style.display = "none";
        return;
    }
    panel.style.display = "block";
    resetOrcamentoForm();
    listarOrcamentos();
    switchOrcamentoTab("list");
    setTimeout(function() {
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
}

// ============================================================
// FUNÇÕES DE CRUD
// ============================================================

function excluirOrcamento(id) {
    if (!confirm("❓ Tem certeza que deseja excluir este orçamento?")) return;
    var novosOrcamentos = [];
    for (var i = 0; i < window.orcamentos.length; i++) {
        if (window.orcamentos[i].id !== id) {
            novosOrcamentos.push(window.orcamentos[i]);
        }
    }
    window.orcamentos = novosOrcamentos;
    salvarOrcamentos();
    listarOrcamentos();
    mostrarNotificacao("✅ Orçamento excluído!", "success");
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
        mostrarNotificacao("❌ Orçamento não encontrado!", "error");
        return;
    }
    
    var novo = {
        id: "orc_" + Date.now(),
        numero: gerarNumeroOrcamento(),
        cliente: original.cliente + " (cópia)",
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
    mostrarNotificacao("✅ Orçamento duplicado!", "success");
}

// ============================================================
// NOTIFICAÇÕES
// ============================================================

function mostrarNotificacao(mensagem, tipo, duracao) {
    if (tipo === undefined) tipo = "info";
    if (duracao === undefined) duracao = 4000;
    
    var cores = { success: "#27ae60", error: "#e74c3c", warning: "#f39c12", info: "#3498db" };
    var icon = { success: "fa-check-circle", error: "fa-times-circle", warning: "fa-exclamation-triangle", info: "fa-info-circle" };
    
    var notificacao = document.createElement("div");
    notificacao.style.cssText = "position: fixed; top: 20px; right: 20px; background: " + (cores[tipo] || "#3498db") + "; color: white; padding: 12px 20px; border-radius: 0px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); z-index: 9999999; font-family: 'Courier New', monospace; font-size: 0.85rem; display: flex; align-items: center; gap: 10px; max-width: 420px; opacity: 1; transition: opacity 0.5s ease; border: 2px solid #404040; border-top-color: #808080; border-left-color: #808080; font-weight: 700;";
    notificacao.innerHTML = "<i class=\"fas " + (icon[tipo] || "fa-info-circle") + "\"></i> " + mensagem;
    document.body.appendChild(notificacao);
    
    setTimeout(function() {
        notificacao.style.opacity = "0";
        setTimeout(function() { notificacao.remove(); }, 500);
    }, duracao);
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

function initializeOrcamento() {
    console.log("🔄 [ORCAMENTO] Inicializando...");
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
    
    var cancelBtn = document.getElementById("orcamentoCancelBtn");
    if (cancelBtn) {
        cancelBtn.onclick = function() {
            if (window.orcamentoEditandoId) {
                if (confirm("❓ Cancelar edição?\n\nOs dados não salvos serão perdidos.")) {
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
            salvarOrcamento();
        };
    }
    
    var addBtn = document.getElementById("orcamentoAddItemBtn");
    if (addBtn) {
        addBtn.onclick = function() {
            adicionarItemLinha();
        };
    }
    
    configurarFormatacaoCpfCnpj();
    
    setTimeout(function() {
        switchOrcamentoTab("list");
        listarOrcamentos();
    }, 100);
    
    console.log("✅ [ORCAMENTO] Inicializado com sucesso!");
}

// ============================================================
// EXPOSIÇÃO GLOBAL
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

// ============================================================
// INICIALIZAR
// ============================================================

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeOrcamento);
} else {
    initializeOrcamento();
}

console.log("✅ orcamento.js v2.2 carregado - WHATSAPP COM PDF AUTOMÁTICO!");
