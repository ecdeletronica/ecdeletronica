// js/modules/orcamento.js - Sistema de Orçamento para ECD Eletrônica
// ✅ Versão ESTÁVEL v1.0
// ✅ Funcionalidades: CRUD, PDF, WhatsApp, Imprimir, Storage Local

console.log('✅ orcamento.js carregado - Versão ESTÁVEL v1.0');

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const ORCAMENTO_CONFIG = {
    password: "ecd123", // Senha para acessar o painel
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
    
    linha.innerHTML = `
        <td>${index + 1}</td>
        <td>
            <input type="text" class="form-control form-control-sm item-descricao" 
                   placeholder="Ex: Placa de Lavadora Samsung" 
                   data-index="${index}">
        </td>
        <td>
            <input type="text" class="form-control form-control-sm item-unidade" 
                   placeholder="UN" value="UN" 
                   data-index="${index}" style="width:80px;">
        </td>
        <td>
            <input type="number" class="form-control form-control-sm item-quantidade" 
                   placeholder="1" value="1" min="1" 
                   data-index="${index}" style="width:80px;">
        </td>
        <td>
            <input type="text" class="form-control form-control-sm item-valor" 
                   placeholder="0,00" value="0,00" 
                   data-index="${index}" style="width:120px;">
        </td>
        <td class="item-subtotal text-end" data-index="${index}">R$ 0,00</td>
        <td>
            <button type="button" class="btn btn-sm btn-danger remover-item" data-index="${index}">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    tbody.appendChild(linha);
    window.orcamentoItens.push({ descricao: '', unidade: 'UN', quantidade: 1, valor_unitario: 0 });
    
    // Atualizar índices
    atualizarIndicesItens();
    
    // Configurar eventos
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
    
    // Eventos para inputs
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
        
        // Máscara de moeda
        input.addEventListener('blur', function() {
            const idx = parseInt(this.dataset.index);
            if (!isNaN(idx) && window.orcamentoItens[idx]) {
                this.value = formatarMoeda(window.orcamentoItens[idx].valor_unitario).replace('R$ ', '');
            }
        });
    });
    
    // Eventos para botões remover
    tbody.querySelectorAll('.remover-item').forEach(btn => {
        btn.onclick = function() {
            const idx = parseInt(this.dataset.index);
            if (!isNaN(idx)) removerItemLinha(idx);
        };
    });
}

function recalcularTotais() {
    // Atualizar array de itens a partir dos inputs
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
    
    // Atualizar subtotal
    const subtotalEl = document.getElementById('orcamentoSubtotal');
    if (subtotalEl) subtotalEl.textContent = formatarMoeda(subtotalGeral);
    
    // Calcular desconto
    const descontoInput = document.getElementById('orcamentoDesconto');
    let desconto = 0;
    if (descontoInput) {
        desconto = parseFloat(descontoInput.value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
        if (desconto > subtotalGeral) desconto = subtotalGeral;
    }
    
    const total = subtotalGeral - desconto;
    
    const totalEl = document.getElementById('orcamentoTotal');
    if (totalEl) totalEl.textContent = formatarMoeda(total);
    
    // Atualizar campo total do formulário
    const totalHidden = document.getElementById('orcamentoTotalHidden');
    if (totalHidden) totalHidden.value = total;
}

// ============================================================
// FUNÇÕES DO FORMULÁRIO DE ORÇAMENTO
// ============================================================

function resetOrcamentoForm() {
    // Limpar campos
    ['orcamentoCliente', 'orcamentoCnpj', 'orcamentoEndereco', 
     'orcamentoData', 'orcamentoPrazo', 'orcamentoObservacoes',
     'orcamentoDesconto'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    // Status
    const statusSelect = document.getElementById('orcamentoStatus');
    if (statusSelect) statusSelect.value = 'Pendente';
    
    // Data padrão
    const dataEl = document.getElementById('orcamentoData');
    if (dataEl) {
        const hoje = new Date().toISOString().split('T')[0];
        dataEl.value = hoje;
    }
    
    // Prazo padrão (7 dias)
    const prazoEl = document.getElementById('orcamentoPrazo');
    if (prazoEl) {
        const prazo = new Date();
        prazo.setDate(prazo.getDate() + 7);
        prazoEl.value = prazo.toISOString().split('T')[0];
    }
    
    // Limpar itens
    window.orcamentoItens = [];
    const tbody = document.getElementById('orcamentoItemsBody');
    if (tbody) tbody.innerHTML = '';
    
    // Adicionar linha inicial
    adicionarItemLinha();
    
    // Resetar ID de edição
    window.orcamentoEditandoId = null;
    
    // Atualizar título
    const titulo = document.getElementById('orcamentoFormTitle');
    if (titulo) titulo.textContent = 'Novo Orçamento';
    
    // Atualizar botão
    const submitBtn = document.getElementById('orcamentoSubmitBtn');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-plus"></i> Criar Orçamento';
        submitBtn.className = 'btn btn-success';
    }
    
    // Esconder botão cancelar
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
    
    // Abrir painel
    const panel = document.getElementById('orcamentoPanel');
    if (panel && panel.style.display !== 'block') {
        panel.style.display = 'block';
    }
    
    // Trocar para aba formulário
    switchOrcamentoTab('form');
    
    // Preencher campos
    document.getElementById('orcamentoCliente').value = orcamento.cliente || '';
    document.getElementById('orcamentoCnpj').value = orcamento.cnpj || '';
    document.getElementById('orcamentoEndereco').value = orcamento.endereco || '';
    document.getElementById('orcamentoData').value = orcamento.data || '';
    document.getElementById('orcamentoPrazo').value = orcamento.prazo || '';
    document.getElementById('orcamentoObservacoes').value = orcamento.observacoes || '';
    document.getElementById('orcamentoStatus').value = orcamento.status || 'Pendente';
    document.getElementById('orcamentoDesconto').value = orcamento.desconto ? 
        formatarMoeda(orcamento.desconto).replace('R$ ', '') : '0,00';
    
    // Carregar itens
    window.orcamentoItens = orcamento.itens ? [...orcamento.itens] : [];
    const tbody = document.getElementById('orcamentoItemsBody');
    if (tbody) {
        tbody.innerHTML = '';
        window.orcamentoItens.forEach((item, index) => {
            const linha = document.createElement('tr');
            linha.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <input type="text" class="form-control form-control-sm item-descricao" 
                           value="${item.descricao || ''}" 
                           data-index="${index}">
                </td>
                <td>
                    <input type="text" class="form-control form-control-sm item-unidade" 
                           value="${item.unidade || 'UN'}" 
                           data-index="${index}" style="width:80px;">
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm item-quantidade" 
                           value="${item.quantidade || 1}" min="1" 
                           data-index="${index}" style="width:80px;">
                </td>
                <td>
                    <input type="text" class="form-control form-control-sm item-valor" 
                           value="${formatarMoeda(item.valor_unitario || 0).replace('R$ ', '')}" 
                           data-index="${index}" style="width:120px;">
                </td>
                <td class="item-subtotal text-end" data-index="${index}">
                    ${formatarMoeda((item.quantidade || 0) * (item.valor_unitario || 0))}
                </td>
                <td>
                    <button type="button" class="btn btn-sm btn-danger remover-item" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(linha);
        });
        
        // Se não houver itens, adicionar um
        if (window.orcamentoItens.length === 0) {
            adicionarItemLinha();
        }
        
        configurarEventosItens();
        atualizarIndicesItens();
    }
    
    // Atualizar título e botão
    document.getElementById('orcamentoFormTitle').textContent = `Editando: ${orcamento.numero || 'Orçamento'}`;
    const submitBtn = document.getElementById('orcamentoSubmitBtn');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        submitBtn.className = 'btn btn-primary';
    }
    
    const cancelBtn = document.getElementById('orcamentoCancelBtn');
    if (cancelBtn) cancelBtn.style.display = 'inline-block';
    
    window.orcamentoEditandoId = id;
    recalcularTotais();
}

function salvarOrcamento() {
    try {
        // Coletar dados
        const cliente = document.getElementById('orcamentoCliente')?.value?.trim() || '';
        const cnpj = document.getElementById('orcamentoCnpj')?.value?.trim() || '';
        const endereco = document.getElementById('orcamentoEndereco')?.value?.trim() || '';
        const data = document.getElementById('orcamentoData')?.value || '';
        const prazo = document.getElementById('orcamentoPrazo')?.value || '';
        const observacoes = document.getElementById('orcamentoObservacoes')?.value?.trim() || '';
        const status = document.getElementById('orcamentoStatus')?.value || 'Pendente';
        const desconto = parseFloat(document.getElementById('orcamentoDesconto')?.value?.replace(/[^\d,]/g, '').replace(',', '.') || 0);
        
        // Validar
        if (!cliente) {
            mostrarNotificacao('⚠️ Informe o nome do cliente!', 'warning');
            return;
        }
        
        if (!window.orcamentoItens || window.orcamentoItens.length === 0) {
            mostrarNotificacao('⚠️ Adicione pelo menos um item!', 'warning');
            return;
        }
        
        // Calcular totais
        const subtotal = calcularTotalItens(window.orcamentoItens);
        const total = subtotal - (desconto || 0);
        
        // Montar objeto
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
            // Edição
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
            // Novo
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

function excluirOrcamento(id) {
    if (!confirm('❓ Tem certeza que deseja excluir este orçamento?')) return;
    
    window.orcamentos = window.orcamentos.filter(o => o.id !== id);
    salvarOrcamentos();
    listarOrcamentos();
    mostrarNotificacao('✅ Orçamento excluído!', 'success');
}

function duplicarOrcamento(id) {
    const original = window.orcamentos.find(o => o.id === id);
    if (!original) {
        mostrarNotificacao('❌ Orçamento não encontrado!', 'error');
        return;
    }
    
    const novo = {
        ...original,
        id: 'orc_' + Date.now(),
        numero: gerarNumeroOrcamento(),
        created_at: new Date().toISOString(),
        cliente: original.cliente + ' (cópia)'
    };
    
    window.orcamentos.unshift(novo);
    salvarOrcamentos();
    listarOrcamentos();
    mostrarNotificacao('✅ Orçamento duplicado!', 'success');
}

// ============================================================
// FUNÇÕES DE LISTAGEM
// ============================================================

function listarOrcamentos() {
    const container = document.getElementById('orcamentoListContainer');
    if (!container) return;
    
    if (!window.orcamentos || window.orcamentos.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-file-invoice" style="font-size:3rem; color:#ccc;"></i>
                <p class="mt-3 text-muted">Nenhum orçamento cadastrado.</p>
                <button class="btn btn-success mt-2" onclick="switchOrcamentoTab('form')">
                    <i class="fas fa-plus"></i> Criar Primeiro Orçamento
                </button>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Nº</th>
                        <th>Cliente</th>
                        <th>Data</th>
                        <th>Status</th>
                        <th>Total</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    window.orcamentos.forEach(orc => {
        const statusColors = {
            'Pendente': 'warning',
            'Aprovado': 'success',
            'Cancelado': 'danger'
        };
        const statusColor = statusColors[orc.status] || 'secondary';
        
        html += `
            <tr>
                <td><strong>${orc.numero || 'N/A'}</strong></td>
                <td>${orc.cliente || 'Sem cliente'}</td>
                <td>${formatarData(orc.data)}</td>
                <td><span class="badge bg-${statusColor}">${orc.status || 'Pendente'}</span></td>
                <td><strong>${formatarMoeda(orc.total || 0)}</strong></td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" onclick="verOrcamento('${orc.id}')" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="carregarOrcamentoParaEdicao('${orc.id}')" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-secondary" onclick="duplicarOrcamento('${orc.id}')" title="Duplicar">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="excluirOrcamento('${orc.id}')" title="Excluir">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <div class="mt-3 text-muted small">
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
    
    // Criar modal ou painel de visualização
    const modalHtml = `
        <div class="modal fade" id="orcamentoModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header" style="background: #0a2e4d; color: white;">
                        <h5 class="modal-title">
                            <i class="fas fa-file-invoice"></i> Orçamento ${orc.numero || ''}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${gerarHtmlOrcamento(orc)}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-success" onclick="enviarWhatsAppOrcamento('${orc.id}')">
                            <i class="fab fa-whatsapp"></i> Enviar WhatsApp
                        </button>
                        <button class="btn btn-primary" onclick="imprimirOrcamento('${orc.id}')">
                            <i class="fas fa-print"></i> Imprimir
                        </button>
                        <button class="btn btn-danger" onclick="gerarPDFOrcamento('${orc.id}')">
                            <i class="fas fa-file-pdf"></i> PDF
                        </button>
                        <button class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal existente
    const existingModal = document.getElementById('orcamentoModal');
    if (existingModal) existingModal.remove();
    
    // Adicionar modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('orcamentoModal'));
    modal.show();
}

function gerarHtmlOrcamento(orc) {
    const statusColors = {
        'Pendente': 'warning',
        'Aprovado': 'success',
        'Cancelado': 'danger'
    };
    const statusColor = statusColors[orc.status] || 'secondary';
    
    let html = `
        <div class="orcamento-visualizacao">
            <div class="row mb-3">
                <div class="col-6">
                    <strong>${ORCAMENTO_CONFIG.empresa.nome}</strong><br>
                    CNPJ: ${ORCAMENTO_CONFIG.empresa.cnpj}<br>
                    ${ORCAMENTO_CONFIG.empresa.endereco}<br>
                    CEP: ${ORCAMENTO_CONFIG.empresa.cep}<br>
                    Email: ${ORCAMENTO_CONFIG.empresa.email}<br>
                    PIX: ${ORCAMENTO_CONFIG.empresa.pix}
                </div>
                <div class="col-6 text-end">
                    <h3>ORÇAMENTO</h3>
                    <p><strong>Nº:</strong> ${orc.numero || 'N/A'}</p>
                    <p><strong>Data:</strong> ${formatarData(orc.data)}</p>
                    <p><strong>Prazo:</strong> ${formatarData(orc.prazo)}</p>
                    <p><span class="badge bg-${statusColor}">${orc.status || 'Pendente'}</span></p>
                </div>
            </div>
            
            <hr>
            
            <div class="row mb-3">
                <div class="col-12">
                    <strong>CLIENTE</strong><br>
                    ${orc.cliente || 'Não informado'}<br>
                    ${orc.cnpj ? 'CNPJ: ' + orc.cnpj : ''}<br>
                    ${orc.endereco || ''}
                </div>
            </div>
            
            <hr>
            
            <div class="table-responsive">
                <table class="table table-bordered">
                    <thead class="table-dark">
                        <tr>
                            <th>Item</th>
                            <th>Descrição</th>
                            <th>UN</th>
                            <th>Quant.</th>
                            <th>Valor Unit.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    orc.itens.forEach((item, index) => {
        const subtotal = (item.quantidade || 0) * (item.valor_unitario || 0);
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.descricao || ''}</td>
                <td>${item.unidade || 'UN'}</td>
                <td>${item.quantidade || 1}</td>
                <td>${formatarMoeda(item.valor_unitario || 0)}</td>
                <td class="text-end">${formatarMoeda(subtotal)}</td>
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="5" class="text-end"><strong>Subtotal</strong></td>
                            <td class="text-end"><strong>${formatarMoeda(orc.subtotal || 0)}</strong></td>
                        </tr>
                        <tr>
                            <td colspan="5" class="text-end"><strong>Desconto</strong></td>
                            <td class="text-end"><strong>${formatarMoeda(orc.desconto || 0)}</strong></td>
                        </tr>
                        <tr class="table-success">
                            <td colspan="5" class="text-end"><strong>TOTAL GERAL</strong></td>
                            <td class="text-end"><strong>${formatarMoeda(orc.total || 0)}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            
            ${orc.observacoes ? `
            <div class="mt-3">
                <strong>Observações:</strong><br>
                ${orc.observacoes}
            </div>
            ` : ''}
            
            <div class="mt-3 text-center text-muted small">
                <p>${ORCAMENTO_CONFIG.empresa.nome} - Assistência Técnica Independente</p>
                <p>Documento gerado em ${formatarDataHora(new Date().toISOString())}</p>
            </div>
        </div>
    `;
    
    return html;
}

// ============================================================
// FUNÇÕES DE EXPORTAÇÃO (PDF, WhatsApp, Imprimir)
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
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
            <style>
                body { padding: 30px; font-family: Arial, sans-serif; }
                @media print { .no-print { display: none !important; } }
            </style>
        </head>
        <body>
            ${conteudo}
            <div class="text-center mt-4 no-print">
                <button class="btn btn-primary" onclick="window.print()">🖨️ Imprimir</button>
                <button class="btn btn-secondary" onclick="window.close()">Fechar</button>
            </div>
            <script>
                // Auto-print
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
    
    // Usar a biblioteca html2pdf se disponível
    if (typeof html2pdf === 'undefined') {
        // Carregar bibliotecas
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
    
    const loading = LoadingManager?.show?.('Gerando PDF...', 'Aguarde enquanto o PDF é gerado.', { variant: 'processing' });
    
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
            if (loading) loading.hide();
            mostrarNotificacao('✅ PDF gerado com sucesso!', 'success');
        })
        .catch((error) => {
            console.error('Erro ao gerar PDF:', error);
            if (loading) loading.hide();
            mostrarNotificacao('❌ Erro ao gerar PDF.', 'error');
        });
}

function enviarWhatsAppOrcamento(id) {
    const orc = window.orcamentos.find(o => o.id === id);
    if (!orc) {
        mostrarNotificacao('❌ Orçamento não encontrado!', 'error');
        return;
    }
    
    // Construir mensagem
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
// FUNÇÕES DE INTERFACE E NAVEGAÇÃO
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
        panel.classList.add('admin-panel-highlight');
        setTimeout(() => panel.classList.remove('admin-panel-highlight'), 1000);
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
        border-radius: 8px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 9999999;
        font-family: 'Inter', sans-serif;
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
        animation: slideInRight 0.5s ease;
        opacity: 1;
        transition: opacity 0.5s ease;
    `;
    
    notificacao.innerHTML = `<i class="fas ${icon[tipo] || 'fa-info-circle'}"></i> ${mensagem}`;
    
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
        notificacao.style.opacity = '0';
        setTimeout(() => notificacao.remove(), 500);
    }, duracao);
    
    // Adicionar CSS para animação
    if (!document.getElementById('notification-style')) {
        const style = document.createElement('style');
        style.id = 'notification-style';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

function initializeOrcamento() {
    console.log('🔄 [ORCAMENTO] Inicializando...');
    
    carregarOrcamentos();
    
    // Configurar painel
    const panel = document.getElementById('orcamentoPanel');
    if (panel) panel.style.display = 'none';
    
    // Configurar botão de acesso
    const toggleBtn = document.querySelector('.orcamento-toggle');
    if (toggleBtn) {
        toggleBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleOrcamentoPanel();
        };
    }
    
    // Configurar botão cancelar
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
    
    // Configurar formulário
    const form = document.getElementById('orcamentoForm');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            salvarOrcamento();
        };
    }
    
    // Adicionar item
    const addBtn = document.getElementById('orcamentoAddItemBtn');
    if (addBtn) {
        addBtn.onclick = function() {
            adicionarItemLinha();
        };
    }
    
    // Inicializar com uma linha
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

// Exportar funções para uso global
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

console.log('✅ orcamento.js v1.0 carregado - Sistema de Orçamentos pronto!');
