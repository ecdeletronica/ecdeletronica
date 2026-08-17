// js/modules/orcamento.js - Sistema de Orçamento para ECD Eletrônica
// ✅ Versão ESTÁVEL v1.1 - LAYOUT WINDOWS 98
// ✅ Funcionalidades: CRUD, PDF, WhatsApp, Imprimir, Storage Local

console.log('✅ orcamento.js carregado - Versão ESTÁVEL v1.1 (Windows 98)');

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
// FUNÇÕES DE STORAGE (localStorage)
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
            console.log(`✅ ${window.orcamentos.length} orçamentos carregados.`);
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
    return itens.reduce((total, item) => {
        const subtotal = (item.quantidade || 0) * (item.valor_unitario || 0);
        return total + subtotal;
    }, 0);
}

function gerarNumeroOrcamento() {
    const ano = new Date().getFullYear();
    const ultimo = window.orcamentos.length || 0;
    const sequencial = String(ultimo + 1).padStart(4, '0');
    return `ECD-${ano}-${sequencial}`;
}

// ============================================================
// FUNÇÕES DA PLANILHA (Itens)
// ============================================================

function adicionarItemLinha() {
    const tbody = document.getElementById('orcamentoItemsBody');
    if (!tbody) return;
    
    const linha = document.createElement('tr');
    const index = window.orcamentoItens.length;
    
    linha.style.border = '1px solid #808080';
    linha.style.borderTop = '1px solid #ffffff';
    linha.style.borderLeft = '1px solid #ffffff';
    
    linha.innerHTML = `
        <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:2px 4px; text-align:center; background:#f0f0f0;">${index + 1}</td>
        <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:2px 4px;">
            <input type="text" class="item-descricao" 
                   placeholder="Descrição do serviço" 
                   data-index="${index}"
                   style="border:1px solid #808080; border-top-color:#404040; border-left-color:#404040; padding:2px 4px; width:100%; background:#ffffff; font-family:'Courier New',monospace; font-size:0.85rem;">
        </td>
        <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:2px 4px;">
            <input type="text" class="item-unidade" value="UN" data-index="${index}"
                   style="border:1px solid #808080; border-top-color:#404040; border-left-color:#404040; padding:2px 4px; width:60px; background:#ffffff; font-family:'Courier New',monospace; font-size:0.85rem;">
        </td>
        <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:2px 4px;">
            <input type="number" class="item-quantidade" value="1" min="1" data-index="${index}"
                   style="border:1px solid #808080; border-top-color:#404040; border-left-color:#404040; padding:2px 4px; width:60px; background:#ffffff; font-family:'Courier New',monospace; font-size:0.85rem;">
        </td>
        <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:2px 4px;">
            <input type="text" class="item-valor" value="0,00" data-index="${index}"
                   style="border:1px solid #808080; border-top-color:#404040; border-left-color:#404040; padding:2px 4px; width:100px; background:#ffffff; font-family:'Courier New',monospace; font-size:0.85rem;">
        </td>
        <td class="item-subtotal" data-index="${index}" 
            style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:2px 4px; text-align:right; background:#f0f0f0; font-family:'Courier New',monospace; font-size:0.85rem;">R$ 0,00</td>
        <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:2px 4px; text-align:center; background:#f0f0f0;">
            <button type="button" class="remover-item" data-index="${index}"
                    style="background:#ece9d8; color:#000000; border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:1px 6px; cursor:pointer; font-size:0.75rem;">
                <i class="fas fa-trash" style="color:#000000;"></i>
            </button>
        </td>
    `;
    
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
    const tbody = document.getElementById('orcamentoItemsBody');
    if (tbody) {
        const rows = tbody.querySelectorAll('tr');
        if (rows[index]) {
            rows[index].remove();
        }
    }
    
    atualizarIndicesItens();
    recalcularTotais();
    mostrarNotificacao('✅ Item removido com sucesso!', 'success');
}

function atualizarIndicesItens() {
    const tbody = document.getElementById('orcamentoItemsBody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((row, index) => {
        const inputs = row.querySelectorAll('input');
        inputs.forEach(input => {
            if (input.dataset) {
                input.dataset.index = index;
            }
        });
        
        const subtotal = row.querySelector('.item-subtotal');
        if (subtotal) subtotal.dataset.index = index;
        
        const removerBtn = row.querySelector('.remover-item');
        if (removerBtn) removerBtn.dataset.index = index;
        
        const numCell = row.querySelector('td:first-child');
        if (numCell) numCell.textContent = index + 1;
    });
}

function configurarEventosItens() {
    const tbody = document.getElementById('orcamentoItemsBody');
    if (!tbody) return;
    
    tbody.querySelectorAll('.item-descricao').forEach(input => {
        input.oninput = function() {
            const idx = parseInt(this.dataset.index);
            if (!isNaN(idx) && window.orcamentoItens[idx]) {
                window.orcamentoItens[idx].descricao = this.value;
            }
        };
    });
    
    tbody.querySelectorAll('.item-unidade').forEach(input => {
        input.oninput = function() {
            const idx = parseInt(this.dataset.index);
            if (!isNaN(idx) && window.orcamentoItens[idx]) {
                window.orcamentoItens[idx].unidade = this.value || 'UN';
            }
        };
    });
    
    tbody.querySelectorAll('.item-quantidade').forEach(input => {
        input.oninput = function() {
            const idx = parseInt(this.dataset.index);
            if (!isNaN(idx) && window.orcamentoItens[idx]) {
                window.orcamentoItens[idx].quantidade = parseFloat(this.value) || 0;
                recalcularTotais();
            }
        };
    });
    
    tbody.querySelectorAll('.item-valor').forEach(input => {
        input.oninput = function() {
            const idx = parseInt(this.dataset.index);
            if (!isNaN(idx) && window.orcamentoItens[idx]) {
                const valor = this.value.replace(/[^\d,]/g, '').replace(',', '.');
                window.orcamentoItens[idx].valor_unitario = parseFloat(valor) || 0;
                recalcularTotais();
            }
        };
        
        input.addEventListener('blur', function() {
            const idx = parseInt(this.dataset.index);
            if (!isNaN(idx) && window.orcamentoItens[idx]) {
                this.value = formatarMoeda(window.orcamentoItens[idx].valor_unitario).replace('R$ ', '');
            }
        });
    });
    
    tbody.querySelectorAll('.remover-item').forEach(btn => {
        btn.onclick = function() {
            const idx = parseInt(this.dataset.index);
            if (!isNaN(idx)) removerItemLinha(idx);
        };
    });
}

function recalcularTotais() {
    const tbody = document.getElementById('orcamentoItemsBody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    let subtotalGeral = 0;
    
    rows.forEach((row, index) => {
        const descricao = row.querySelector('.item-descricao')?.value || '';
        const unidade = row.querySelector('.item-unidade')?.value || 'UN';
        const quantidade = parseFloat(row.querySelector('.item-quantidade')?.value) || 0;
        const valorStr = row.querySelector('.item-valor')?.value || '0,00';
        const valor = parseFloat(valorStr.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        
        const subtotal = quantidade * valor;
        
        const subtotalCell = row.querySelector('.item-subtotal');
        if (subtotalCell) subtotalCell.textContent = formatarMoeda(subtotal);
        
        if (window.orcamentoItens[index]) {
            window.orcamentoItens[index] = { descricao, unidade, quantidade, valor_unitario: valor };
        }
        
        subtotalGeral += subtotal;
    });
    
    const subtotalEl = document.getElementById('orcamentoSubtotal');
    if (subtotalEl) subtotalEl.textContent = formatarMoeda(subtotalGeral);
    
    const descontoInput = document.getElementById('orcamentoDesconto');
    let desconto = 0;
    if (descontoInput) {
        desconto = parseFloat(descontoInput.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        if (desconto > subtotalGeral) desconto = subtotalGeral;
    }
    
    const total = subtotalGeral - desconto;
    
    const totalEl = document.getElementById('orcamentoTotal');
    if (totalEl) totalEl.textContent = formatarMoeda(total);
    
    const totalHidden = document.getElementById('orcamentoTotalHidden');
    if (totalHidden) totalHidden.value = total;
}

// ============================================================
// FUNÇÕES DO FORMULÁRIO
// ============================================================

function resetOrcamentoForm() {
    ['orcamentoCliente', 'orcamentoCnpj', 'orcamentoEndereco', 
     'orcamentoData', 'orcamentoPrazo', 'orcamentoObservacoes',
     'orcamentoDesconto'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    const statusSelect = document.getElementById('orcamentoStatus');
    if (statusSelect) statusSelect.value = 'Pendente';
    
    const dataEl = document.getElementById('orcamentoData');
    if (dataEl) {
        const hoje = new Date().toISOString().split('T')[0];
        dataEl.value = hoje;
    }
    
    const prazoEl = document.getElementById('orcamentoPrazo');
    if (prazoEl) {
        const prazo = new Date();
        prazo.setDate(prazo.getDate() + 7);
        prazoEl.value = prazo.toISOString().split('T')[0];
    }
    
    window.orcamentoItens = [];
    const tbody = document.getElementById('orcamentoItemsBody');
    if (tbody) tbody.innerHTML = '';
    
    adicionarItemLinha();
    window.orcamentoEditandoId = null;
    
    const titulo = document.getElementById('orcamentoFormTitle');
    if (titulo) titulo.textContent = 'Novo Orçamento';
    
    const submitBtn = document.getElementById('orcamentoSubmitBtn');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Criar Orçamento';
        submitBtn.className = 'btn-win98';
    }
    
    const cancelBtn = document.getElementById('orcamentoCancelBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';
    
    recalcularTotais();
}

function carregarOrcamentoParaEdicao(id) {
    const orcamento = window.orcamentos.find(o => o.id === id);
    if (!orcamento) {
        mostrarNotificacao('❌ Orçamento não encontrado!', 'error');
        return;
    }
    
    const panel = document.getElementById('orcamentoPanel');
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
    
    window.orcamentoItens = orcamento.itens ? [...orcamento.itens] : [];
    const tbody = document.getElementById('orcamentoItemsBody');
    if (tbody) {
        tbody.innerHTML = '';
        window.orcamentoItens.forEach((item, index) => {
            const linha = document.createElement('tr');
            linha.style.border = '1px solid #808080';
            linha.style.borderTop = '1px solid #ffffff';
            linha.style.borderLeft = '1px solid #ffffff';
            linha.innerHTML = `
                <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:2px 4px; text-align:center; background:#f0f0f0;">${index + 1}</td>
                <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:2px 4px;">
                    <input type="text" class="item-descricao" value="${item.descricao || ''}" data-index="${index}"
                           style="border:1px solid #808080; border-top-color:#404040; border-left-color:#404040; padding:2px 4px; width:100%; background:#ffffff; font-family:'Courier New',monospace; font-size:0.85rem;">
                </td>
                <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:2px 4px;">
                    <input type="text" class="item-unidade" value="${item.unidade || 'UN'}" data-index="${index}"
                           style="border:1px solid #808080; border-top-color:#404040; border-left-color:#404040; padding:2px 4px; width:60px; background:#ffffff; font-family:'Courier New',monospace; font-size:0.85rem;">
                </td>
                <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:2px 4px;">
                    <input type="number" class="item-quantidade" value="${item.quantidade || 1}" min="1" data-index="${index}"
                           style="border:1px solid #808080; border-top-color:#404040; border-left-color:#404040; padding:2px 4px; width:60px; background:#ffffff; font-family:'Courier New',monospace; font-size:0.85rem;">
                </td>
                <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:2px 4px;">
                    <input type="text" class="item-valor" value="${formatarMoeda(item.valor_unitario || 0).replace('R$ ', '')}" data-index="${index}"
                           style="border:1px solid #808080; border-top-color:#404040; border-left-color:#404040; padding:2px 4px; width:100px; background:#ffffff; font-family:'Courier New',monospace; font-size:0.85rem;">
                </td>
                <td class="item-subtotal" data-index="${index}" 
                    style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:2px 4px; text-align:right; background:#f0f0f0; font-family:'Courier New',monospace; font-size:0.85rem;">
                    ${formatarMoeda((item.quantidade || 0) * (item.valor_unitario || 0))}
                </td>
                <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:2px 4px; text-align:center; background:#f0f0f0;">
                    <button type="button" class="remover-item" data-index="${index}"
                            style="background:#ece9d8; color:#000000; border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:1px 6px; cursor:pointer; font-size:0.75rem;">
                        <i class="fas fa-trash" style="color:#000000;"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(linha);
        });
        
        if (window.orcamentoItens.length === 0) {
            adicionarItemLinha();
        }
        
        configurarEventosItens();
        atualizarIndicesItens();
    }
    
    document.getElementById('orcamentoFormTitle').textContent = `Editando: ${orcamento.numero || 'Orçamento'}`;
    const submitBtn = document.getElementById('orcamentoSubmitBtn');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        submitBtn.className = 'btn-win98 btn-win98-primary';
    }
    
    const cancelBtn = document.getElementById('orcamentoCancelBtn');
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
    
    window.orcamentoEditandoId = id;
    recalcularTotais();
}

function salvarOrcamento() {
    try {
        const cliente = document.getElementById('orcamentoCliente')?.value?.trim() || '';
        const cnpj = document.getElementById('orcamentoCnpj')?.value?.trim() || '';
        const endereco = document.getElementById('orcamentoEndereco')?.value?.trim() || '';
        const data = document.getElementById('orcamentoData')?.value || '';
        const prazo = document.getElementById('orcamentoPrazo')?.value || '';
        const observacoes = document.getElementById('orcamentoObservacoes')?.value?.trim() || '';
        const status = document.getElementById('orcamentoStatus')?.value || 'Pendente';
        const desconto = parseFloat(document.getElementById('orcamentoDesconto')?.value?.replace(/[^\d,]/g, '').replace(',', '.') || 0);
        
        if (!cliente) {
            mostrarNotificacao('⚠️ Informe o nome do cliente!', 'warning');
            return;
        }
        
        if (!window.orcamentoItens || window.orcamentoItens.length === 0) {
            mostrarNotificacao('⚠️ Adicione pelo menos um item!', 'warning');
            return;
        }
        
        const subtotal = calcularTotalItens(window.orcamentoItens);
        const total = subtotal - (desconto || 0);
        
        const orcamentoData = {
            cliente,
            cnpj,
            endereco,
            data,
            prazo,
            observacoes,
            status,
            desconto: desconto || 0,
            subtotal,
            total,
            itens: window.orcamentoItens.map(item => ({
                descricao: item.descricao || '',
                unidade: item.unidade || 'UN',
                quantidade: item.quantidade || 1,
                valor_unitario: item.valor_unitario || 0
            })),
            updated_at: new Date().toISOString()
        };
        
        if (window.orcamentoEditandoId) {
            const index = window.orcamentos.findIndex(o => o.id === window.orcamentoEditandoId);
            if (index !== -1) {
                window.orcamentos[index] = {
                    ...window.orcamentos[index],
                    ...orcamentoData,
                    numero: window.orcamentos[index].numero,
                    created_at: window.orcamentos[index].created_at
                };
                salvarOrcamentos();
                mostrarNotificacao('✅ Orçamento atualizado com sucesso!', 'success');
                listarOrcamentos();
                resetOrcamentoForm();
                switchOrcamentoTab('list');
            }
        } else {
            const novoOrcamento = {
                id: 'orc_' + Date.now(),
                numero: gerarNumeroOrcamento(),
                ...orcamentoData,
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
    const container = document.getElementById('orcamentoListContainer');
    if (!container) return;
    
    if (!window.orcamentos || window.orcamentos.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:30px 0; background:#ece9d8; border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff;">
                <i class="fas fa-file-invoice" style="font-size:2.5rem; color:#808080;"></i>
                <p style="margin-top:12px; color:#666;">Nenhum orçamento cadastrado.</p>
                <button class="btn-win98" onclick="switchOrcamentoTab('form')" style="margin-top:8px;">
                    <i class="fas fa-plus"></i> Criar Primeiro Orçamento
                </button>
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="overflow-x:auto; background:#ece9d8; border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px;">
            <table style="width:100%; border-collapse:collapse; background:#ffffff; font-family:'Courier New',monospace; font-size:0.85rem;">
                <thead>
                    <tr style="background:#ece9d8; border-bottom:2px solid #808080;">
                        <th style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:left; color:#000000;">Nº</th>
                        <th style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:left; color:#000000;">Cliente</th>
                        <th style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:left; color:#000000;">Data</th>
                        <th style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:left; color:#000000;">Status</th>
                        <th style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:right; color:#000000;">Total</th>
                        <th style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:center; color:#000000;">Ações</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    window.orcamentos.forEach(orc => {
        const statusColors = {
            'Pendente': '#f39c12',
            'Aprovado': '#27ae60',
            'Cancelado': '#e74c3c'
        };
        const statusColor = statusColors[orc.status] || '#666';
        
        html += `
            <tr style="border-bottom:1px solid #808080;">
                <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px;"><strong>${orc.numero || 'N/A'}</strong></td>
                <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px;">${orc.cliente || 'Sem cliente'}</td>
                <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px;">${formatarData(orc.data)}</td>
                <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px;">
                    <span style="background:${statusColor}; color:#fff; padding:2px 8px; border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; font-size:0.7rem;">${orc.status || 'Pendente'}</span>
                </td>
                <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:right;"><strong>${formatarMoeda(orc.total || 0)}</strong></td>
                <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:center;">
                    <button class="btn-win98-sm" onclick="verOrcamento('${orc.id}')" title="Visualizar"><i class="fas fa-eye"></i></button>
                    <button class="btn-win98-sm" onclick="carregarOrcamentoParaEdicao('${orc.id}')" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn-win98-sm" onclick="duplicarOrcamento('${orc.id}')" title="Duplicar"><i class="fas fa-copy"></i></button>
                    <button class="btn-win98-sm btn-win98-danger" onclick="excluirOrcamento('${orc.id}')" title="Excluir"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <div style="margin-top:8px; font-size:0.75rem; color:#666; font-family:'Courier New',monospace;">
            <i class="fas fa-info-circle"></i> Total: ${window.orcamentos.length} orçamento(s)
        </div>
    `;
    
    container.innerHTML = html;
}

// ============================================================
// FUNÇÕES DE VISUALIZAÇÃO
// ============================================================

function verOrcamento(id) {
    const orc = window.orcamentos.find(o => o.id === id);
    if (!orc) {
        mostrarNotificacao('❌ Orçamento não encontrado!', 'error');
        return;
    }
    
    const modalHtml = `
        <div class="modal-win98" id="orcamentoModal">
            <div class="modal-win98-content">
                <div class="modal-win98-header">
                    <span class="modal-win98-title"><i class="fas fa-file-invoice"></i> Orçamento ${orc.numero || ''}</span>
                    <button class="modal-win98-close" onclick="fecharModalWin98('orcamentoModal')">×</button>
                </div>
                <div class="modal-win98-body">
                    ${gerarHtmlOrcamento(orc)}
                </div>
                <div class="modal-win98-footer">
                    <button class="btn-win98" onclick="enviarWhatsAppOrcamento('${orc.id}')"><i class="fab fa-whatsapp"></i> WhatsApp</button>
                    <button class="btn-win98" onclick="imprimirOrcamento('${orc.id}')"><i class="fas fa-print"></i> Imprimir</button>
                    <button class="btn-win98" onclick="gerarPDFOrcamento('${orc.id}')"><i class="fas fa-file-pdf"></i> PDF</button>
                    <button class="btn-win98" onclick="fecharModalWin98('orcamentoModal')">Fechar</button>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('orcamentoModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = document.getElementById('orcamentoModal');
    if (modal) modal.style.display = 'flex';
}

function fecharModalWin98(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

function gerarHtmlOrcamento(orc) {
    const statusColors = {
        'Pendente': '#f39c12',
        'Aprovado': '#27ae60',
        'Cancelado': '#e74c3c'
    };
    const statusColor = statusColors[orc.status] || '#666';
    
    let html = `
        <div style="font-family:'Courier New',monospace; font-size:0.85rem;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; background:#ece9d8; padding:12px; border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff;">
                <div>
                    <strong>${ORCAMENTO_CONFIG.empresa.nome}</strong><br>
                    CNPJ: ${ORCAMENTO_CONFIG.empresa.cnpj}<br>
                    ${ORCAMENTO_CONFIG.empresa.endereco}<br>
                    CEP: ${ORCAMENTO_CONFIG.empresa.cep}<br>
                    Email: ${ORCAMENTO_CONFIG.empresa.email}<br>
                    PIX: ${ORCAMENTO_CONFIG.empresa.pix}
                </div>
                <div style="text-align:right;">
                    <h3 style="margin:0 0 8px 0; color:#0a2e4d;">ORÇAMENTO</h3>
                    <p><strong>Nº:</strong> ${orc.numero || 'N/A'}</p>
                    <p><strong>Data:</strong> ${formatarData(orc.data)}</p>
                    <p><strong>Prazo:</strong> ${formatarData(orc.prazo)}</p>
                    <p><span style="background:${statusColor}; color:#fff; padding:2px 12px; border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff;">${orc.status || 'Pendente'}</span></p>
                </div>
            </div>
            
            <div style="background:#ece9d8; padding:12px; margin-bottom:12px; border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff;">
                <strong>CLIENTE</strong><br>
                ${orc.cliente || 'Não informado'}<br>
                ${orc.cnpj ? 'CNPJ: ' + orc.cnpj : ''}<br>
                ${orc.endereco || ''}
            </div>
            
            <div style="overflow-x:auto; background:#ece9d8; padding:4px; border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff;">
                <table style="width:100%; border-collapse:collapse; background:#ffffff; font-family:'Courier New',monospace; font-size:0.85rem;">
                    <thead>
                        <tr style="background:#ece9d8; border-bottom:2px solid #808080;">
                            <th style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:left;">Item</th>
                            <th style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:left;">Descrição</th>
                            <th style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:left;">UN</th>
                            <th style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:center;">Quant.</th>
                            <th style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:right;">Valor Unit.</th>
                            <th style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    orc.itens.forEach((item, index) => {
        const subtotal = (item.quantidade || 0) * (item.valor_unitario || 0);
        html += `
            <tr>
                <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px;">${index + 1}</td>
                <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px;">${item.descricao || ''}</td>
                <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px;">${item.unidade || 'UN'}</td>
                <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:center;">${item.quantidade || 1}</td>
                <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:right;">${formatarMoeda(item.valor_unitario || 0)}</td>
                <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:right;">${formatarMoeda(subtotal)}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="5" style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:right;"><strong>Subtotal</strong></td>
                            <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:right;"><strong>${formatarMoeda(orc.subtotal || 0)}</strong></td>
                        </tr>
                        <tr>
                            <td colspan="5" style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:right;"><strong>Desconto</strong></td>
                            <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:right;"><strong>${formatarMoeda(orc.desconto || 0)}</strong></td>
                        </tr>
                        <tr style="background:#d4e6f1;">
                            <td colspan="5" style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:right;"><strong>TOTAL GERAL</strong></td>
                            <td style="border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff; padding:4px 8px; text-align:right;"><strong>${formatarMoeda(orc.total || 0)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            ${orc.observacoes ? `
            <div style="background:#ece9d8; padding:12px; margin-top:12px; border:1px solid #808080; border-top-color:#ffffff; border-left-color:#ffffff;">
                <strong>Observações:</strong><br>
                ${orc.observacoes}
            </div>
            ` : ''}
            
            <div style="text-align:center; margin-top:16px; font-size:0.7rem; color:#666; font-family:'Courier New',monospace;">
                <p>${ORCAMENTO_CONFIG.empresa.nome} - Assistência Técnica Independente</p>
                <p>Documento gerado em ${formatarDataHora(new Date().toISOString())}</p>
            </div>
        </div>
    `;
    
    return html;
}

// ============================================================
// FUNÇÕES DE EXPORTAÇÃO
// ============================================================

function imprimirOrcamento(id) {
    const orc = window.orcamentos.find(o => o.id === id);
    if (!orc) {
        mostrarNotificacao('❌ Orçamento não encontrado!', 'error');
        return;
    }
    
    const conteudo = gerarHtmlOrcamento(orc);
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Orçamento ${orc.numero || ''}</title>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body { padding: 30px; font-family: 'Courier New', monospace; background: #ffffff; }
                @media print { .no-print { display: none !important; } }
                .modal-win98 { background: #ece9d8; border: 1px solid #808080; border-top-color: #ffffff; border-left-color: #ffffff; padding: 12px; }
                .btn-win98 { background: #ece9d8; color: #000000; border: 1px solid #808080; border-top-color: #ffffff; border-left-color: #ffffff; padding: 4px 16px; cursor: pointer; font-family: 'Courier New', monospace; }
            </style>
        </head>
        <body>
            ${conteudo}
            <div class="text-center mt-4 no-print">
                <button class="btn-win98" onclick="window.print()">🖨️ Imprimir</button>
                <button class="btn-win98" onclick="window.close()">Fechar</button>
            </div>
            <script>
                setTimeout(() => { window.print(); }, 500);
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function gerarPDFOrcamento(id) {
    const orc = window.orcamentos.find(o => o.id === id);
    if (!orc) {
        mostrarNotificacao('❌ Orçamento não encontrado!', 'error');
        return;
    }
    
    if (typeof html2pdf === 'undefined') {
        const script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        document.head.appendChild(script1);
        
        const script2 = document.createElement('script');
        script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(script2);
        
        const script3 = document.createElement('script');
        script3.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script3.onload = function() {
            gerarPDFOrcamento(id);
        };
        document.head.appendChild(script3);
        return;
    }
    
    mostrarNotificacao('📄 Gerando PDF...', 'info');
    
    const conteudo = gerarHtmlOrcamento(orc);
    const container = document.createElement('div');
    container.innerHTML = conteudo;
    container.style.padding = '30px';
    container.style.background = 'white';
    container.style.width = '100%';
    
    html2pdf()
        .from(container)
        .set({
            margin: [10, 10, 10, 10],
            filename: `Orçamento_${orc.numero || 'ECD'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .save()
        .then(() => {
            mostrarNotificacao('✅ PDF gerado com sucesso!', 'success');
        })
        .catch((error) => {
            console.error('Erro ao gerar PDF:', error);
            mostrarNotificacao('❌ Erro ao gerar PDF.', 'error');
        });
}

function enviarWhatsAppOrcamento(id) {
    const orc = window.orcamentos.find(o => o.id === id);
    if (!orc) {
        mostrarNotificacao('❌ Orçamento não encontrado!', 'error');
        return;
    }
    
    const telefone = ORCAMENTO_CONFIG.empresa.whatsapp;
    
    let mensagem = `*${ORCAMENTO_CONFIG.empresa.nome}*\n`;
    mensagem += `Orçamento: ${orc.numero || 'N/A'}\n`;
    mensagem += `Data: ${formatarData(orc.data)}\n`;
    mensagem += `Cliente: ${orc.cliente || 'Não informado'}\n`;
    mensagem += `\n*ITENS:*\n`;
    
    orc.itens.forEach((item, index) => {
        mensagem += `${index + 1}. ${item.descricao || 'Item'} - ${item.quantidade || 1}x ${formatarMoeda(item.valor_unitario || 0)} = ${formatarMoeda((item.quantidade || 0) * (item.valor_unitario || 0))}\n`;
    });
    
    mensagem += `\n*Subtotal:* ${formatarMoeda(orc.subtotal || 0)}`;
    if (orc.desconto > 0) {
        mensagem += `\n*Desconto:* ${formatarMoeda(orc.desconto || 0)}`;
    }
    mensagem += `\n*TOTAL GERAL:* ${formatarMoeda(orc.total || 0)}`;
    mensagem += `\n\n*Observações:* ${orc.observacoes || 'Nenhuma'}`;
    mensagem += `\n\n*${ORCAMENTO_CONFIG.empresa.nome}*`;
    mensagem += `\nTel: ${ORCAMENTO_CONFIG.empresa.telefone}`;
    mensagem += `\nEmail: ${ORCAMENTO_CONFIG.empresa.email}`;
    mensagem += `\nPIX: ${ORCAMENTO_CONFIG.empresa.pix}`;
    mensagem += `\n\n*Assistência Técnica Independente*`;
    
    const mensagemCodificada = encodeURIComponent(mensagem);
    const url = `https://wa.me/${telefone}?text=${mensagemCodificada}`;
    
    window.open(url, '_blank');
    mostrarNotificacao('📱 Abrindo WhatsApp...', 'info');
}

// ============================================================
// FUNÇÕES DE INTERFACE
// ============================================================

function switchOrcamentoTab(tab) {
    const tabs = ['form', 'list'];
    tabs.forEach(t => {
        const content = document.getElementById(`orcamento${t.charAt(0).toUpperCase() + t.slice(1)}Content`);
        if (content) content.classList.toggle('active', t === tab);
        
        const btn = document.querySelector(`.orcamento-tab[data-tab="${t}"]`);
        if (btn) btn.classList.toggle('active', t === tab);
    });
}

function toggleOrcamentoPanel() {
    const password = prompt("🔒 Acesso ao Painel de Orçamentos\n\nDigite a senha:");
    
    if (!password) return;
    
    if (password !== ORCAMENTO_CONFIG.password) {
        alert('❌ Senha incorreta!');
        return;
    }
    
    const panel = document.getElementById('orcamentoPanel');
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
    
    setTimeout(() => {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// ============================================================
// NOTIFICAÇÕES
// ============================================================

function mostrarNotificacao(mensagem, tipo = 'info', duracao = 3000) {
    const cores = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    const icon = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    const notificacao = document.createElement('div');
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${cores[tipo] || '#3498db'};
        color: white;
        padding: 15px 25px;
        border-radius: 0px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        z-index: 9999999;
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        opacity: 1;
        transition: opacity 0.5s ease;
        border: 1px solid #808080;
        border-top-color: #ffffff;
        border-left-color: #ffffff;
    `;
    
    notificacao.innerHTML = `<i class="fas ${icon[tipo] || 'fa-info-circle'}"></i> ${mensagem}`;
    
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
        notificacao.style.opacity = '0';
        setTimeout(() => notificacao.remove(), 500);
    }, duracao);
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

function initializeOrcamento() {
    console.log('🔄 [ORCAMENTO] Inicializando...');
    
    carregarOrcamentos();
    
    const panel = document.getElementById('orcamentoPanel');
    if (panel) panel.style.display = 'none';
    
    const toggleBtn = document.querySelector('.orcamento-toggle');
    if (toggleBtn) {
        toggleBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleOrcamentoPanel();
        };
    }
    
    const cancelBtn = document.getElementById('orcamentoCancelBtn');
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
    
    const form = document.getElementById('orcamentoForm');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            salvarOrcamento();
        };
    }
    
    const addBtn = document.getElementById('orcamentoAddItemBtn');
    if (addBtn) {
        addBtn.onclick = function() {
            adicionarItemLinha();
        };
    }
    
    setTimeout(() => {
        resetOrcamentoForm();
    }, 200);
    
    console.log('✅ [ORCAMENTO] Inicializado com sucesso!');
}

// Inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOrcamento);
} else {
    initializeOrcamento();
}

// Exportar funções
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

console.log('✅ orcamento.js v1.1 carregado - Layout Windows 98!');
