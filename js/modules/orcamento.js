// js/modules/orcamento.js - Sistema de Orçamento para ECD Eletrônica
// ✅ Versão ESTÁVEL v1.6 - CORREÇÃO DE SINTAXE
// ✅ Funcionalidades: CRUD, PDF, WhatsApp, Imprimir, Storage Local

console.log('✅ orcamento.js carregado - Versão ESTÁVEL v1.6');

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const ORCAMENTO_CONFIG = {
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
        whatsapp: "5582999468040"
    }
};

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
        console.log('✅ Orçamentos salvos com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar orçamentos:', error);
        return false;
    }
}

function carregarOrcamentos() {
    try {
        const stored = localStorage.getItem(ORCAMENTO_CONFIG.storageKey);
        if (stored) {
            window.orcamentos = JSON.parse(stored);
            console.log('✅ ' + window.orcamentos.length + ' orçamentos carregados.');
        } else {
            window.orcamentos = [];
            console.log('ℹ️ Nenhum orçamento encontrado. Iniciando vazio.');
        }
        return true;
    } catch (error) {
        console.error('❌ Erro ao carregar orçamentos:', error);
        window.orcamentos = [];
        return false;
    }
}

// ============================================================
// FUNÇÕES DE FORMATAÇÃO
// ============================================================

function formatarMoeda(valor) {
    if (!valor && valor !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function formatarData(data) {
    if (!data) return '';
    try {
        const d = new Date(data);
        return d.toLocaleDateString('pt-BR');
    } catch {
        return data;
    }
}

function formatarDataHora(data) {
    if (!data) return '';
    try {
        const d = new Date(data);
        return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR');
    } catch {
        return data;
    }
}

function calcularTotalItens(itens) {
    if (!itens || !itens.length) return 0;
    return itens.reduce(function(total, item) {
        var subtotal = (item.quantidade || 0) * (item.valor_unitario || 0);
        return total + subtotal;
    }, 0);
}

function gerarNumeroOrcamento() {
    var ano = new Date().getFullYear();
    var ultimo = window.orcamentos.length || 0;
    var sequencial = String(ultimo + 1).padStart(4, '0');
    return 'ECD-' + ano + '-' + sequencial;
}

// ============================================================
// FUNÇÕES DA PLANILHA (Itens)
// ============================================================

function adicionarItemLinha() {
    var tbody = document.getElementById('orcamentoItemsBody');
    if (!tbody) return;
    
    var linha = document.createElement('tr');
    var index = window.orcamentoItens.length;
    
    linha.style.border = '2px solid #404040';
    linha.style.borderTop = '2px solid #808080';
    linha.style.borderLeft = '2px solid #808080';
    linha.style.background = '#ffffff';
    
    linha.innerHTML = '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 6px; text-align:center; background:#d4d0c8; font-weight:700; font-size:0.65rem; font-family:\'Courier New\',monospace;">' + (index + 1) + '</td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;"><input type="text" class="item-descricao" placeholder="Descrição do serviço" data-index="' + index + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:100%; background:#f0f0f0; font-family:\'Courier New\',monospace; font-size:0.7rem; color:#000000; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);"></td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;"><input type="text" class="item-unidade" value="UN" data-index="' + index + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:38px; background:#f0f0f0; font-family:\'Courier New\',monospace; font-size:0.7rem; color:#000000; text-align:center; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);"></td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;"><input type="number" class="item-quantidade" value="1" min="1" data-index="' + index + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:38px; background:#f0f0f0; font-family:\'Courier New\',monospace; font-size:0.7rem; color:#000000; text-align:center; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);"></td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;"><input type="text" class="item-valor" value="0,00" data-index="' + index + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:75px; background:#f0f0f0; font-family:\'Courier New\',monospace; font-size:0.7rem; color:#000000; text-align:right; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);"></td><td class="item-subtotal" data-index="' + index + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 6px; text-align:right; background:#ece9d8; font-family:\'Courier New\',monospace; font-size:0.7rem; font-weight:700;">R$ 0,00</td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; text-align:center; background:#d4d0c8;"><button type="button" class="remover-item" data-index="' + index + '" style="background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:0 6px; cursor:pointer; font-size:0.6rem; font-family:\'Courier New\',monospace; font-weight:700;"><i class="fas fa-trash" style="color:#000000;"></i></button></td>';
    
    tbody.appendChild(linha);
    window.orcamentoItens.push({ descricao: '', unidade: 'UN', quantidade: 1, valor_unitario: 0 });
    
    atualizarIndicesItens();
    configurarEventosItens();
    recalcularTotais();
}

function removerItemLinha(index) {
    if (window.orcamentoItens.length <= 1) {
        mostrarNotificacao('⚠️ Mantenha pelo menos um item.', 'warning');
        return;
    }
    
    if (!confirm('❓ Remover este item?')) return;
    
    window.orcamentoItens.splice(index, 1);
    var tbody = document.getElementById('orcamentoItemsBody');
    if (tbody) {
        var rows = tbody.querySelectorAll('tr');
        if (rows[index]) {
            rows[index].remove();
        }
    }
    
    atualizarIndicesItens();
    recalcularTotais();
    mostrarNotificacao('✅ Item removido com sucesso!', 'success');
}

function atualizarIndicesItens() {
    var tbody = document.getElementById('orcamentoItemsBody');
    if (!tbody) return;
    
    var rows = tbody.querySelectorAll('tr');
    rows.forEach(function(row, index) {
        var inputs = row.querySelectorAll('input');
        inputs.forEach(function(input) {
            if (input.dataset) {
                input.dataset.index = index;
            }
        });
        
        var subtotal = row.querySelector('.item-subtotal');
        if (subtotal) subtotal.dataset.index = index;
        
        var removerBtn = row.querySelector('.remover-item');
        if (removerBtn) removerBtn.dataset.index = index;
        
        var numCell = row.querySelector('td:first-child');
        if (numCell) numCell.textContent = index + 1;
    });
}

function configurarEventosItens() {
    var tbody = document.getElementById('orcamentoItemsBody');
    if (!tbody) return;
    
    tbody.querySelectorAll('.item-descricao').forEach(function(input) {
        input.oninput = function() {
            var idx = parseInt(this.dataset.index);
            if (!isNaN(idx) && window.orcamentoItens[idx]) {
                window.orcamentoItens[idx].descricao = this.value;
            }
        };
    });
    
    tbody.querySelectorAll('.item-unidade').forEach(function(input) {
        input.oninput = function() {
            var idx = parseInt(this.dataset.index);
            if (!isNaN(idx) && window.orcamentoItens[idx]) {
                window.orcamentoItens[idx].unidade = this.value || 'UN';
            }
        };
    });
    
    tbody.querySelectorAll('.item-quantidade').forEach(function(input) {
        input.oninput = function() {
            var idx = parseInt(this.dataset.index);
            if (!isNaN(idx) && window.orcamentoItens[idx]) {
                window.orcamentoItens[idx].quantidade = parseFloat(this.value) || 0;
                recalcularTotais();
            }
        };
    });
    
    tbody.querySelectorAll('.item-valor').forEach(function(input) {
        input.oninput = function() {
            var idx = parseInt(this.dataset.index);
            if (!isNaN(idx) && window.orcamentoItens[idx]) {
                var valor = this.value.replace(/[^\d,]/g, '').replace(',', '.');
                window.orcamentoItens[idx].valor_unitario = parseFloat(valor) || 0;
                recalcularTotais();
            }
        };
        
        input.addEventListener('blur', function() {
            var idx = parseInt(this.dataset.index);
            if (!isNaN(idx) && window.orcamentoItens[idx]) {
                this.value = formatarMoeda(window.orcamentoItens[idx].valor_unitario).replace('R$ ', '');
            }
        });
    });
    
    tbody.querySelectorAll('.remover-item').forEach(function(btn) {
        btn.onclick = function() {
            var idx = parseInt(this.dataset.index);
            if (!isNaN(idx)) removerItemLinha(idx);
        };
    });
}

function recalcularTotais() {
    var tbody = document.getElementById('orcamentoItemsBody');
    if (!tbody) return;
    
    var rows = tbody.querySelectorAll('tr');
    var subtotalGeral = 0;
    
    rows.forEach(function(row, index) {
        var descricao = row.querySelector('.item-descricao')?.value || '';
        var unidade = row.querySelector('.item-unidade')?.value || 'UN';
        var quantidade = parseFloat(row.querySelector('.item-quantidade')?.value) || 0;
        var valorStr = row.querySelector('.item-valor')?.value || '0,00';
        var valor = parseFloat(valorStr.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        
        var subtotal = quantidade * valor;
        
        var subtotalCell = row.querySelector('.item-subtotal');
        if (subtotalCell) subtotalCell.textContent = formatarMoeda(subtotal);
        
        if (window.orcamentoItens[index]) {
            window.orcamentoItens[index] = { descricao: descricao, unidade: unidade, quantidade: quantidade, valor_unitario: valor };
        }
        
        subtotalGeral += subtotal;
    });
    
    var subtotalEl = document.getElementById('orcamentoSubtotal');
    if (subtotalEl) subtotalEl.textContent = formatarMoeda(subtotalGeral);
    
    var descontoInput = document.getElementById('orcamentoDesconto');
    var desconto = 0;
    if (descontoInput) {
        desconto = parseFloat(descontoInput.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        if (desconto > subtotalGeral) desconto = subtotalGeral;
    }
    
    var total = subtotalGeral - desconto;
    
    var totalEl = document.getElementById('orcamentoTotal');
    if (totalEl) totalEl.textContent = formatarMoeda(total);
    
    var totalHidden = document.getElementById('orcamentoTotalHidden');
    if (totalHidden) totalHidden.value = total;
}

// ============================================================
// FUNÇÕES DO FORMULÁRIO
// ============================================================

function resetOrcamentoForm() {
    ['orcamentoCliente', 'orcamentoCnpj', 'orcamentoEndereco', 
     'orcamentoData', 'orcamentoPrazo', 'orcamentoObservacoes',
     'orcamentoDesconto'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    var statusSelect = document.getElementById('orcamentoStatus');
    if (statusSelect) statusSelect.value = 'Pendente';
    
    var dataEl = document.getElementById('orcamentoData');
    if (dataEl) {
        var hoje = new Date().toISOString().split('T')[0];
        dataEl.value = hoje;
    }
    
    var prazoEl = document.getElementById('orcamentoPrazo');
    if (prazoEl) {
        var prazo = new Date();
        prazo.setDate(prazo.getDate() + 7);
        prazoEl.value = prazo.toISOString().split('T')[0];
    }
    
    window.orcamentoItens = [];
    var tbody = document.getElementById('orcamentoItemsBody');
    if (tbody) tbody.innerHTML = '';
    
    adicionarItemLinha();
    window.orcamentoEditandoId = null;
    
    var titulo = document.getElementById('orcamentoFormTitle');
    if (titulo) titulo.textContent = 'Novo Orçamento';
    
    var submitBtn = document.getElementById('orcamentoSubmitBtn');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Criar Orçamento';
        submitBtn.style.background = '#27ae60';
        submitBtn.style.color = '#ffffff';
    }
    
    var cancelBtn = document.getElementById('orcamentoCancelBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';
    
    recalcularTotais();
}

function carregarOrcamentoParaEdicao(id) {
    var orcamento = window.orcamentos.find(function(o) { return o.id === id; });
    if (!orcamento) {
        mostrarNotificacao('❌ Orçamento não encontrado!', 'error');
        return;
    }
    
    var panel = document.getElementById('orcamentoPanel');
    if (panel && panel.style.display !== 'block') {
        panel.style.display = 'block';
    }
    
    switchOrcamentoTab('form');
    
    document.getElementById('orcamentoCliente').value = orcamento.cliente || '';
    document.getElementById('orcamentoCnpj').value = orcamento.cnpj || '';
    document.getElementById('orcamentoEndereco').value = orcamento.endereco || '';
    document.getElementById('orcamentoData').value = orcamento.data || '';
    document.getElementById('orcamentoPrazo').value = orcamento.prazo || '';
    document.getElementById('orcamentoObservacoes').value = orcamento.observacoes || '';
    document.getElementById('orcamentoStatus').value = orcamento.status || 'Pendente';
    document.getElementById('orcamentoDesconto').value = orcamento.desconto ? 
        formatarMoeda(orcamento.desconto).replace('R$ ', '') : '0,00';
    
    window.orcamentoItens = orcamento.itens ? JSON.parse(JSON.stringify(orcamento.itens)) : [];
    var tbody = document.getElementById('orcamentoItemsBody');
    if (tbody) {
        tbody.innerHTML = '';
        window.orcamentoItens.forEach(function(item, index) {
            var linha = document.createElement('tr');
            linha.style.border = '2px solid #404040';
            linha.style.borderTop = '2px solid #808080';
            linha.style.borderLeft = '2px solid #808080';
            linha.style.background = '#ffffff';
            linha.innerHTML = '<td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 6px; text-align:center; background:#d4d0c8; font-weight:700; font-size:0.65rem; font-family:\'Courier New\',monospace;">' + (index + 1) + '</td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;"><input type="text" class="item-descricao" value="' + (item.descricao || '') + '" data-index="' + index + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:100%; background:#f0f0f0; font-family:\'Courier New\',monospace; font-size:0.7rem; color:#000000; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);"></td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;"><input type="text" class="item-unidade" value="' + (item.unidade || 'UN') + '" data-index="' + index + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:38px; background:#f0f0f0; font-family:\'Courier New\',monospace; font-size:0.7rem; color:#000000; text-align:center; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);"></td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;"><input type="number" class="item-quantidade" value="' + (item.quantidade || 1) + '" min="1" data-index="' + index + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:38px; background:#f0f0f0; font-family:\'Courier New\',monospace; font-size:0.7rem; color:#000000; text-align:center; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);"></td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px;"><input type="text" class="item-valor" value="' + formatarMoeda(item.valor_unitario || 0).replace('R$ ', '') + '" data-index="' + index + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; width:75px; background:#f0f0f0; font-family:\'Courier New\',monospace; font-size:0.7rem; color:#000000; text-align:right; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.08);"></td><td class="item-subtotal" data-index="' + index + '" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 6px; text-align:right; background:#ece9d8; font-family:\'Courier New\',monospace; font-size:0.7rem; font-weight:700;">' + formatarMoeda((item.quantidade || 0) * (item.valor_unitario || 0)) + '</td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:2px 4px; text-align:center; background:#d4d0c8;"><button type="button" class="remover-item" data-index="' + index + '" style="background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:0 6px; cursor:pointer; font-size:0.6rem; font-family:\'Courier New\',monospace; font-weight:700;"><i class="fas fa-trash" style="color:#000000;"></i></button></td>';
            tbody.appendChild(linha);
        });
        
        if (window.orcamentoItens.length === 0) {
            adicionarItemLinha();
        }
        
        configurarEventosItens();
        atualizarIndicesItens();
    }
    
    var titulo = document.getElementById('orcamentoFormTitle');
    if (titulo) titulo.textContent = 'Editando: ' + (orcamento.numero || 'Orçamento');
    var submitBtn = document.getElementById('orcamentoSubmitBtn');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        submitBtn.style.background = '#3498db';
        submitBtn.style.color = '#ffffff';
    }
    
    var cancelBtn = document.getElementById('orcamentoCancelBtn');
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
    
    window.orcamentoEditandoId = id;
    recalcularTotais();
}

function salvarOrcamento() {
    try {
        var cliente = document.getElementById('orcamentoCliente')?.value?.trim() || '';
        var cnpj = document.getElementById('orcamentoCnpj')?.value?.trim() || '';
        var endereco = document.getElementById('orcamentoEndereco')?.value?.trim() || '';
        var data = document.getElementById('orcamentoData')?.value || '';
        var prazo = document.getElementById('orcamentoPrazo')?.value || '';
        var observacoes = document.getElementById('orcamentoObservacoes')?.value?.trim() || '';
        var status = document.getElementById('orcamentoStatus')?.value || 'Pendente';
        var desconto = parseFloat(document.getElementById('orcamentoDesconto')?.value?.replace(/[^\d,]/g, '').replace(',', '.') || 0);
        
        if (!cliente) {
            mostrarNotificacao('⚠️ Informe o nome do cliente!', 'warning');
            return;
        }
        
        if (!window.orcamentoItens || window.orcamentoItens.length === 0) {
            mostrarNotificacao('⚠️ Adicione pelo menos um item!', 'warning');
            return;
        }
        
        var subtotal = calcularTotalItens(window.orcamentoItens);
        var total = subtotal - (desconto || 0);
        
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
            itens: window.orcamentoItens.map(function(item) {
                return {
                    descricao: item.descricao || '',
                    unidade: item.unidade || 'UN',
                    quantidade: item.quantidade || 1,
                    valor_unitario: item.valor_unitario || 0
                };
            }),
            updated_at: new Date().toISOString()
        };
        
        if (window.orcamentoEditandoId) {
            var index = window.orcamentos.findIndex(function(o) { return o.id === window.orcamentoEditandoId; });
            if (index !== -1) {
                var original = window.orcamentos[index];
                window.orcamentos[index] = {
                    id: original.id,
                    numero: original.numero,
                    created_at: original.created_at,
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
                    updated_at: orcamentoData.updated_at
                };
                salvarOrcamentos();
                mostrarNotificacao('✅ Orçamento atualizado com sucesso!', 'success');
                listarOrcamentos();
                resetOrcamentoForm();
                switchOrcamentoTab('list');
            }
        } else {
            var novoOrcamento = {
                id: 'orc_' + Date.now(),
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
                created_at: new Date().toISOString()
            };
            window.orcamentos.unshift(novoOrcamento);
            salvarOrcamentos();
            mostrarNotificacao('✅ Orçamento criado com sucesso!', 'success');
            listarOrcamentos();
            resetOrcamentoForm();
            switchOrcamentoTab('list');
        }
        
    } catch (error) {
        console.error('❌ Erro ao salvar orçamento:', error);
        mostrarNotificacao('❌ Erro ao salvar orçamento!', 'error');
    }
}

// ============================================================
// FUNÇÕES DE LISTAGEM
// ============================================================

function listarOrcamentos() {
    var container = document.getElementById('orcamentoListContainer');
    if (!container) return;
    
    if (!window.orcamentos || window.orcamentos.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:20px 0; background:#d4d0c8; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 2px 2px 8px rgba(0,0,0,0.15);"><i class="fas fa-file-invoice" style="font-size:2rem; color:#404040;"></i><p style="margin-top:8px; color:#404040; font-family:\'Courier New\',monospace; font-weight:700; font-size:0.85rem;">Nenhum orçamento cadastrado.</p><button class="btn-win98" onclick="window.switchOrcamentoTab(\'form\')" style="margin-top:6px; font-size:0.75rem; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:4px 16px; cursor:pointer; font-family:\'Courier New\',monospace; font-weight:700;"><i class="fas fa-plus"></i> Criar Primeiro Orçamento</button></div>';
        return;
    }
    
    var html = '<div style="overflow-x:auto; background:#d4d0c8; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px; box-shadow: inset 2px 2px 6px rgba(0,0,0,0.12);"><table style="width:100%; border-collapse:collapse; background:#ffffff; font-family:\'Courier New\',monospace; font-size:0.7rem;"><thead><tr style="background:#d4d0c8; border-bottom:2px solid #404040;"><th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:left; color:#000000; font-weight:700;">Nº</th><th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:left; color:#000000; font-weight:700;">Cliente</th><th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:left; color:#000000; font-weight:700;">Data</th><th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:left; color:#000000; font-weight:700;">Status</th><th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; color:#000000; font-weight:700;">Total</th><th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center; color:#000000; font-weight:700;">Ações</th></tr></thead><tbody>';
    
    window.orcamentos.forEach(function(orc) {
        var statusColors = {
            'Pendente': '#f39c12',
            'Aprovado': '#27ae60',
            'Cancelado': '#e74c3c'
        };
        var statusColor = statusColors[orc.status] || '#666';
        
        html += '<tr style="border-bottom:1px solid #808080;"><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px;"><strong>' + (orc.numero || 'N/A') + '</strong></td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px;">' + (orc.cliente || 'Sem cliente') + '</td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px;">' + formatarData(orc.data) + '</td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px;"><span style="background:' + statusColor + '; color:#fff; padding:1px 8px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; font-size:0.6rem; font-weight:700;">' + (orc.status || 'Pendente') + '</span></td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right;"><strong>' + formatarMoeda(orc.total || 0) + '</strong></td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center;"><button class="btn-win98-sm" onclick="window.verOrcamento(\'' + orc.id + '\')" title="Visualizar" style="padding:0 4px; font-size:0.65rem; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:\'Courier New\',monospace;"><i class="fas fa-eye"></i></button> <button class="btn-win98-sm" onclick="window.carregarOrcamentoParaEdicao(\'' + orc.id + '\')" title="Editar" style="padding:0 4px; font-size:0.65rem; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:\'Courier New\',monospace;"><i class="fas fa-edit"></i></button> <button class="btn-win98-sm" onclick="window.duplicarOrcamento(\'' + orc.id + '\')" title="Duplicar" style="padding:0 4px; font-size:0.65rem; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:\'Courier New\',monospace;"><i class="fas fa-copy"></i></button> <button class="btn-win98-sm btn-win98-danger" onclick="window.excluirOrcamento(\'' + orc.id + '\')" title="Excluir" style="padding:0 4px; font-size:0.65rem; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:\'Courier New\',monospace;"><i class="fas fa-trash"></i></button></td></tr>';
    });
    
    html += '</tbody></table></div><div style="margin-top:6px; font-size:0.65rem; color:#404040; font-family:\'Courier New\',monospace; font-weight:700;"><i class="fas fa-info-circle"></i> Total: ' + window.orcamentos.length + ' orçamento(s)</div>';
    
    container.innerHTML = html;
}

// ============================================================
// FUNÇÕES DE VISUALIZAÇÃO
// ============================================================

function verOrcamento(id) {
    var orc = window.orcamentos.find(function(o) { return o.id === id; });
    if (!orc) {
        mostrarNotificacao('❌ Orçamento não encontrado!', 'error');
        return;
    }
    
    var modalHtml = '<div class="modal-win98" id="orcamentoModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:10001; display:flex; align-items:center; justify-content:center; padding:20px;"><div class="modal-win98-content" style="max-width:800px; width:95%; background:#ece9d8; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: 4px 4px 20px rgba(0,0,0,0.3);"><div class="modal-win98-header" style="background:#000080; color:#ffffff; padding:4px 10px; display:flex; justify-content:space-between; align-items:center; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080;"><span class="modal-win98-title" style="font-family:\'Courier New\',monospace; font-weight:700; font-size:0.85rem;"><i class="fas fa-file-invoice"></i> Orçamento ' + (orc.numero || '') + '</span><button class="modal-win98-close" onclick="window.fecharModalWin98(\'orcamentoModal\')" style="background:#c0c0c0; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:0 8px; cursor:pointer; font-size:1rem; font-weight:700; font-family:\'Courier New\',monospace;">×</button></div><div class="modal-win98-body" style="background:#d4d0c8; padding:12px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; max-height:60vh; overflow-y:auto;">' + gerarHtmlOrcamento(orc) + '</div><div class="modal-win98-footer" style="background:#d4d0c8; padding:6px 10px; text-align:right; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080;"><button class="btn-win98" onclick="window.enviarWhatsAppOrcamento(\'' + orc.id + '\')" style="font-size:0.75rem; padding:3px 12px; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:\'Courier New\',monospace; font-weight:700;"><i class="fab fa-whatsapp"></i> WhatsApp</button> <button class="btn-win98" onclick="window.imprimirOrcamento(\'' + orc.id + '\')" style="font-size:0.75rem; padding:3px 12px; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:\'Courier New\',monospace; font-weight:700;"><i class="fas fa-print"></i> Imprimir</button> <button class="btn-win98" onclick="window.gerarPDFOrcamento(\'' + orc.id + '\')" style="font-size:0.75rem; padding:3px 12px; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:\'Courier New\',monospace; font-weight:700;"><i class="fas fa-file-pdf"></i> PDF</button> <button class="btn-win98" onclick="window.fecharModalWin98(\'orcamentoModal\')" style="font-size:0.75rem; padding:3px 12px; background:#d4d0c8; color:#000000; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; cursor:pointer; font-family:\'Courier New\',monospace; font-weight:700;">Fechar</button></div></div></div>';
    
    var existingModal = document.getElementById('orcamentoModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function fecharModalWin98(id) {
    var modal = document.getElementById(id);
    if (modal) modal.remove();
}

function gerarHtmlOrcamento(orc) {
    var statusColors = {
        'Pendente': '#f39c12',
        'Aprovado': '#27ae60',
        'Cancelado': '#e74c3c'
    };
    var statusColor = statusColors[orc.status] || '#666';
    
    var html = '<div style="font-family:\'Courier New\',monospace; font-size:0.75rem; color:#000000;"><div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px; background:#d4d0c8; padding:10px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 2px 2px 6px rgba(0,0,0,0.12);"><div><strong>' + ORCAMENTO_CONFIG.empresa.nome + '</strong><br>CNPJ: ' + ORCAMENTO_CONFIG.empresa.cnpj + '<br>' + ORCAMENTO_CONFIG.empresa.endereco + '<br>CEP: ' + ORCAMENTO_CONFIG.empresa.cep + '<br>Email: ' + ORCAMENTO_CONFIG.empresa.email + '<br>PIX: ' + ORCAMENTO_CONFIG.empresa.pix + '</div><div style="text-align:right;"><h3 style="margin:0 0 6px 0; color:#000080; font-weight:700; font-size:0.9rem;">ORÇAMENTO</h3><p style="margin:1px 0;"><strong>Nº:</strong> ' + (orc.numero || 'N/A') + '</p><p style="margin:1px 0;"><strong>Data:</strong> ' + formatarData(orc.data) + '</p><p style="margin:1px 0;"><strong>Prazo:</strong> ' + formatarData(orc.prazo) + '</p><p style="margin:1px 0;"><span style="background:' + statusColor + '; color:#fff; padding:1px 10px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; font-weight:700; font-size:0.7rem;">' + (orc.status || 'Pendente') + '</span></p></div></div><div style="background:#d4d0c8; padding:10px; margin-bottom:10px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 2px 2px 6px rgba(0,0,0,0.12);"><strong>CLIENTE</strong><br>' + (orc.cliente || 'Não informado') + '<br>' + (orc.cnpj ? 'CNPJ: ' + orc.cnpj : '') + '<br>' + (orc.endereco || '') + '</div><div style="overflow-x:auto; background:#d4d0c8; padding:3px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 2px 2px 6px rgba(0,0,0,0.12);"><table style="width:100%; border-collapse:collapse; background:#ffffff; font-family:\'Courier New\',monospace; font-size:0.7rem;"><thead><tr style="background:#d4d0c8; border-bottom:2px solid #404040;"><th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:left; font-weight:700;">Item</th><th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:left; font-weight:700;">Descrição</th><th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:left; font-weight:700;">UN</th><th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center; font-weight:700;">Quant.</th><th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; font-weight:700;">Valor Unit.</th><th style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; font-weight:700;">Subtotal</th></tr></thead><tbody>';
    
    orc.itens.forEach(function(item, index) {
        var subtotal = (item.quantidade || 0) * (item.valor_unitario || 0);
        html += '<tr><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px;">' + (index + 1) + '</td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px;">' + (item.descricao || '') + '</td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px;">' + (item.unidade || 'UN') + '</td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:center;">' + (item.quantidade || 1) + '</td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right;">' + formatarMoeda(item.valor_unitario || 0) + '</td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right;">' + formatarMoeda(subtotal) + '</td></tr>';
    });
    
    html += '</tbody><tfoot><tr><td colspan="5" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; background:#f0f0f0;"><strong>Subtotal</strong></td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; background:#f0f0f0;"><strong>' + formatarMoeda(orc.subtotal || 0) + '</strong></td></tr><tr><td colspan="5" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; background:#f0f0f0;"><strong>Desconto</strong></td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; background:#f0f0f0;"><strong>' + formatarMoeda(orc.desconto || 0) + '</strong></td></tr><tr style="background:#d4e6f1;"><td colspan="5" style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; font-weight:700; font-size:0.85rem;"><strong>TOTAL GERAL</strong></td><td style="border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; padding:3px 6px; text-align:right; font-weight:700; font-size:0.85rem;"><strong>' + formatarMoeda(orc.total || 0) + '</strong></td></tr></tfoot></table></div>';
    
    if (orc.observacoes) {
        html += '<div style="background:#d4d0c8; padding:10px; margin-top:10px; border:2px solid #404040; border-top-color:#808080; border-left-color:#808080; box-shadow: inset 2px 2px 6px rgba(0,0,0,0.12);"><strong>Observações:</strong><br>' + orc.observacoes + '</div>';
    }
    
    html += '<div style="text-align:center; margin-top:12px; font-size:0.6rem; color:#404040; font-family:\'Courier New\',monospace; font-weight:700;"><p style="margin:2px 0;">' + ORCAMENTO_CONFIG.empresa.nome + ' - Assistência Técnica Independente</p><p style="margin:2px 0;">Documento gerado em ' + formatarDataHora(new Date().toISOString()) + '</p></div></div>';
    
    return html;
}

// ============================================================
// FUNÇÕES DE EXPORTAÇÃO
// ============================================================

function imprimirOrcamento(id) {
    var orc = window.orcamentos.find(function(o) { return o.id === id; });
    if (!orc) {
        mostrarNotificacao('❌ Orçamento não encontrado!', 'error');
        return;
    }
    
    var conteudo = gerarHtmlOrcamento(orc);
    
    var printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write('<!DOCTYPE html><html><head><title>Orçamento ' + (orc.numero || '') + '</title><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"><style>body { padding: 30px; font-family: \'Courier New\', monospace; background: #ffffff; } @media print { .no-print { display: none !important; } } .modal-win98 { background: #d4d0c8; border: 2px solid #404040; border-top-color: #808080; border-left-color: #808080; padding: 12px; box-shadow: inset 2px 2px 8px rgba(0,0,0,0.15); } .btn-win98 { background: #d4d0c8; color: #000000; border: 2px solid #404040; border-top-color: #808080; border-left-color: #808080; padding: 4px 16px; cursor: pointer; font-family: \'Courier New\', monospace; font-weight: 700; }</style></head><body>' + conteudo + '<div class="text-center mt-4 no-print"><button class="btn-win98" onclick="window.print()">🖨️ Imprimir</button> <button class="btn-win98" onclick="window.close()">Fechar</button></div><script>setTimeout(function() { window.print(); }, 500);<\/script></body></html>');
    printWindow.document.close();
}

function gerarPDFOrcamento(id) {
    var orc = window.orcamentos.find(function(o) { return o.id === id; });
    if (!orc) {
        mostrarNotificacao('❌ Orçamento não encontrado!', 'error');
        return;
    }
    
    if (typeof html2pdf === 'undefined') {
        var script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        document.head.appendChild(script1);
        
        var script2 = document.createElement('script');
        script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(script2);
        
        var script3 = document.createElement('script');
        script3.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script3.onload = function() {
            gerarPDFOrcamento(id);
        };
        document.head.appendChild(script3);
        return;
    }
    
    mostrarNotificacao('📄 Gerando PDF...', 'info');
    
    var conteudo = gerarHtmlOrcamento(orc);
    var container = document.createElement('div');
    container.innerHTML = conteudo;
    container.style.padding = '30px';
    container.style.background = 'white';
    container.style.width = '100%';
    
    html2pdf()
        .from(container)
        .set({
            margin: [10, 10, 10, 10],
            filename: 'Orçamento_' + (orc.numero || 'ECD') + '.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .save()
        .then(function() {
            mostrarNotificacao('✅ PDF gerado com sucesso!', 'success');
        })
        .catch(function(error) {
            console.error('Erro ao gerar PDF:', error);
            mostrarNotificacao('❌ Erro ao gerar PDF.', 'error');
        });
}

function enviarWhatsAppOrcamento(id) {
    var orc = window.orcamentos.find(function(o) { return o.id === id; });
    if (!orc) {
        mostrarNotificacao('❌ Orçamento não encontrado!', 'error');
        return;
    }
    
    var telefone = ORCAMENTO_CONFIG.empresa.whatsapp;
    
    var mensagem = '*' + ORCAMENTO_CONFIG.empresa.nome + '*\n';
    mensagem += 'Orçamento: ' + (orc.numero || 'N/A') + '\n';
    mensagem += 'Data: ' + formatarData(orc.data) + '\n';
    mensagem += 'Cliente: ' + (orc.cliente || 'Não informado') + '\n';
    mensagem += '\n*ITENS:*\n';
    
    orc.itens.forEach(function(item, index) {
        mensagem += (index + 1) + '. ' + (item.descricao || 'Item') + ' - ' + (item.quantidade || 1) + 'x ' + formatarMoeda(item.valor_unitario || 0) + ' = ' + formatarMoeda((item.quantidade || 0) * (item.valor_unitario || 0)) + '\n';
    });
    
    mensagem += '\n*Subtotal:* ' + formatarMoeda(orc.subtotal || 0);
    if (orc.desconto > 0) {
        mensagem += '\n*Desconto:* ' + formatarMoeda(orc.desconto || 0);
    }
    mensagem += '\n*TOTAL GERAL:* ' + formatarMoeda(orc.total || 0);
    mensagem += '\n\n*Observações:* ' + (orc.observacoes || 'Nenhuma');
    mensagem += '\n\n*' + ORCAMENTO_CONFIG.empresa.nome + '*';
    mensagem += '\nTel: ' + ORCAMENTO_CONFIG.empresa.telefone;
    mensagem += '\nEmail: ' + ORCAMENTO_CONFIG.empresa.email;
    mensagem += '\nPIX: ' + ORCAMENTO_CONFIG.empresa.pix;
    mensagem += '\n\n*Assistência Técnica Independente*';
    
    var mensagemCodificada = encodeURIComponent(mensagem);
    var url = 'https://wa.me/' + telefone + '?text=' + mensagemCodificada;
    
    window.open(url, '_blank');
    mostrarNotificacao('📱 Abrindo WhatsApp...', 'info');
}

// ============================================================
// FUNÇÕES DE INTERFACE
// ============================================================

function switchOrcamentoTab(tab) {
    var tabs = ['form', 'list'];
    tabs.forEach(function(t) {
        var content = document.getElementById('orcamento' + t.charAt(0).toUpperCase() + t.slice(1) + 'Content');
        if (content) {
            if (t === tab) {
                content.style.display = 'block';
            } else {
                content.style.display = 'none';
            }
        }
        
        var btn = document.querySelector('.orcamento-tab[data-tab="' + t + '"]');
        if (btn) {
            if (t === tab) {
                btn.classList.add('active');
                btn.style.background = '#ece9d8';
                btn.style.borderBottom = 'none';
                btn.style.borderLeft = '1px solid #808080';
                btn.style.borderTop = '1px solid #808080';
                btn.style.borderRight = '1px solid #ffffff';
                btn.style.zIndex = '4';
                btn.style.marginTop = '1px';
                btn.style.paddingTop = '4px';
                btn.style.paddingBottom = '6px';
                var icon = btn.querySelector('i');
                if (icon) icon.style.color = '#ffd700';
            } else {
                btn.classList.remove('active');
                btn.style.background = '#ece9d8';
                btn.style.borderLeft = '1px solid #ffffff';
                btn.style.borderTop = '1px solid #ffffff';
                btn.style.borderRight = '1px solid #808080';
                btn.style.borderBottom = 'none';
                btn.style.zIndex = '1';
                btn.style.marginTop = '0';
                btn.style.paddingTop = '4px';
                btn.style.paddingBottom = '5px';
                var icon2 = btn.querySelector('i');
                if (icon2) icon2.style.color = '#555555';
            }
        }
    });
    
    var activeBtn = document.querySelector('.orcamento-tab[data-tab="' + tab + '"]');
    if (activeBtn) {
        activeBtn.style.background = '#ece9d8';
        activeBtn.style.borderLeft = '1px solid #808080';
        activeBtn.style.borderTop = '1px solid #808080';
        activeBtn.style.borderRight = '1px solid #ffffff';
        activeBtn.style.borderBottom = 'none';
    }
}

function toggleOrcamentoPanel() {
    var password = prompt("🔒 Acesso ao Painel de Orçamentos\n\nDigite a senha:");
    
    if (!password) return;
    
    if (password !== ORCAMENTO_CONFIG.password) {
        alert('❌ Senha incorreta!');
        return;
    }
    
    var panel = document.getElementById('orcamentoPanel');
    if (!panel) {
        console.error('[ORCAMENTO] ❌ Painel não encontrado!');
        return;
    }
    
    if (panel.style.display === 'block') {
        panel.style.display = 'none';
        return;
    }
    
    panel.style.display = 'block';
    resetOrcamentoForm();
    listarOrcamentos();
    switchOrcamentoTab('list');
    
    setTimeout(function() {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// ============================================================
// FUNÇÕES DE CRUD
// ============================================================

function excluirOrcamento(id) {
    if (!confirm('❓ Tem certeza que deseja excluir este orçamento?')) return;
    
    window.orcamentos = window.orcamentos.filter(function(o) { return o.id !== id; });
    salvarOrcamentos();
    listarOrcamentos();
    mostrarNotificacao('✅ Orçamento excluído!', 'success');
}

function duplicarOrcamento(id) {
    var original = window.orcamentos.find(function(o) { return o.id === id; });
    if (!original) {
        mostrarNotificacao('❌ Orçamento não encontrado!', 'error');
        return;
    }
    
    var novo = JSON.parse(JSON.stringify(original));
    novo.id = 'orc_' + Date.now();
    novo.numero = gerarNumeroOrcamento();
    novo.created_at = new Date().toISOString();
    novo.cliente = original.cliente + ' (cópia)';
    
    window.orcamentos.unshift(novo);
    salvarOrcamentos();
    listarOrcamentos();
    mostrarNotificacao('✅ Orçamento duplicado!', 'success');
}

// ============================================================
// NOTIFICAÇÕES
// ============================================================

function mostrarNotificacao(mensagem, tipo, duracao) {
    if (tipo === undefined) tipo = 'info';
    if (duracao === undefined) duracao = 3000;
    
    var cores = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    var icon = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    var notificacao = document.createElement('div');
    notificacao.style.cssText = 'position: fixed; top: 20px; right: 20px; background: ' + (cores[tipo] || '#3498db') + '; color: white; padding: 10px 16px; border-radius: 0px; box-shadow: 0 2px 10px rgba(0,0,0,0.3); z-index: 9999999; font-family: \'Courier New\', monospace; font-size: 0.8rem; display: flex; align-items: center; gap: 8px; max-width: 380px; opacity: 1; transition: opacity 0.5s ease; border: 2px solid #404040; border-top-color: #808080; border-left-color: #808080; font-weight: 700;';
    
    notificacao.innerHTML = '<i class="fas ' + (icon[tipo] || 'fa-info-circle') + '"></i> ' + mensagem;
    
    document.body.appendChild(notificacao);
    
    setTimeout(function() {
        notificacao.style.opacity = '0';
        setTimeout(function() { notificacao.remove(); }, 500);
    }, duracao);
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

function initializeOrcamento() {
    console.log('🔄 [ORCAMENTO] Inicializando...');
    
    carregarOrcamentos();
    
    var panel = document.getElementById('orcamentoPanel');
    if (panel) panel.style.display = 'none';
    
    var toggleBtn = document.querySelector('.orcamento-toggle');
    if (toggleBtn) {
        toggleBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleOrcamentoPanel();
        };
    }
    
    var cancelBtn = document.getElementById('orcamentoCancelBtn');
    if (cancelBtn) {
        cancelBtn.onclick = function() {
            if (window.orcamentoEditandoId) {
                if (confirm('❓ Cancelar edição?\n\nOs dados não salvos serão perdidos.')) {
                    resetOrcamentoForm();
                    switchOrcamentoTab('list');
                    listarOrcamentos();
                }
            } else {
                resetOrcamentoForm();
                switchOrcamentoTab('list');
                listarOrcamentos();
            }
        };
        cancelBtn.style.display = 'none';
    }
    
    var form = document.getElementById('orcamentoForm');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            salvarOrcamento();
        };
    }
    
    var addBtn = document.getElementById('orcamentoAddItemBtn');
    if (addBtn) {
        addBtn.onclick = function() {
            adicionarItemLinha();
        };
    }
    
    setTimeout(function() {
        switchOrcamentoTab('list');
        listarOrcamentos();
    }, 100);
    
    setTimeout(function() {
        document.querySelectorAll('.btn-win98').forEach(function(btn) {
            if (btn.getAttribute('onclick')) {
                // Já tem onclick, não sobrescrever
            }
        });
        console.log('✅ [ORCAMENTO] Eventos configurados com sucesso!');
    }, 200);
    
    console.log('✅ [ORCAMENTO] Inicializado com sucesso!');
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
window.gerarHtmlOrcamento = gerarHtmlOrcamento;

console.log('✅ orcamento.js v1.6 carregado - CORREÇÃO DE SINTAXE COMPLETA!');

// ============================================================
// INICIALIZAR
// ============================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOrcamento);
} else {
    initializeOrcamento();
}
