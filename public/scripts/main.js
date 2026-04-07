let currentLang = window.__preferredLang || localStorage.getItem('preferredLang') || 'pt';


function getDocumentApiBaseUrl() {
    const raw = document.documentElement.getAttribute('data-api-base-url') || '';
    if (!raw || raw.startsWith('{')) {
        return '';
    }
    return raw;
}

function normalizeApiBaseUrl(raw) {
    const value = (raw || '').trim();
    if (!value) {
        return '';
    }

    const withoutTrailingSlash = value.replace(/\/$/, '');
    if (withoutTrailingSlash.endsWith('/api')) {
        return withoutTrailingSlash;
    }

    return `${withoutTrailingSlash}/api`;
}


function resolveDefaultApiBaseUrl() {
    const { hostname, origin } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://${hostname}:8080/api`;
    }
    if (hostname.endsWith('.vercel.app')) {
        // Default for Vercel previews when PUBLIC_API_BASE_URL is missing.
        return `${origin}/api`;
    }
    return `${origin}/api`;
}

const DEFAULT_API_BASE_URL = normalizeApiBaseUrl(resolveDefaultApiBaseUrl());
const documentApiBaseUrl = getDocumentApiBaseUrl();
let apiBaseUrl = normalizeApiBaseUrl(documentApiBaseUrl || window.__API_BASE_URL || localStorage.getItem('apiBaseUrl') || DEFAULT_API_BASE_URL);

async function performApiFetch(path, options) {
    const requestOptions = {
        credentials: 'include',
        ...(options || {})
    };
    try {
        return await fetch(`${apiBaseUrl}${path}`, requestOptions);
    } catch (_) {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost && apiBaseUrl.startsWith('https://')) {
            apiBaseUrl = apiBaseUrl.replace('https://', 'http://');
            localStorage.setItem('apiBaseUrl', apiBaseUrl);
            try {
                return await fetch(`${apiBaseUrl}${path}`, requestOptions);
            } catch (_) {
            }
        }

        const canFallback = !window.__API_BASE_URL && apiBaseUrl !== DEFAULT_API_BASE_URL;
        if (canFallback) {
            apiBaseUrl = DEFAULT_API_BASE_URL;
            localStorage.removeItem('apiBaseUrl');
            try {
                return await fetch(`${apiBaseUrl}${path}`, requestOptions);
            } catch (_) {
                throw new Error(`Falha de conexao com a API em ${apiBaseUrl}.`);
            }
        }
        throw new Error(`Falha de conexao com a API em ${apiBaseUrl}.`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa idioma
    if (typeof setLanguage === 'function') {
        setLanguage(currentLang);
    } else {
        console.warn('setLanguage nao esta disponivel; mantendo idioma padrao.');
    }
    
    // Inicializa páginas específicas se os elementos existirem
    if (document.getElementById('news-container')) {
        initNewsPage();
    }
    
    // CORREÇÃO: Adicionada verificação para .contact-form-panel (usada no login/contato novo)
    if (document.querySelector('.contact-form-wrapper') || document.querySelector('.contact-form-panel')) {
        initContactPage();
    }
    
    if (document.querySelector('.donation-section')) {
        initDonationPage();
    }

    initCrudForms();

    // Inicializa menu mobile
    initMobileMenu();
});

function initCrudForms() {
    guardProtectedRoute();
    if (!ensureAdminAccess()) {
        return;
    }
    syncAssociatedAreaLinks();
    showDashboardVerificationReminder();
    initSupabaseDashboardProfile();
    initAdminDashboardCard();
    initAdminInboxPage();
    bindMembershipAccessWall();
    bindCpfMask();
    showLoginVerificationFeedback();
    bindEmailVerificationDigits();
    bindEmailVerificationSubmit();
    bindResendVerificationCode();
    initUserProfile();
    bindUserProfileSubmit();
    bindContactSubmit();
    bindConsultancySubmit();
    bindRegisterSubmit();
    bindLoginSubmit();
    bindLogoutAction();
}

function requireConfirmedAccountForAction(actionLabel) {
    const authSession = getAuthSession();
    const isSessionValid = isAuthSessionValid(authSession);
    if (!isSessionValid) {
        clearAuthSession();
        const next = encodeURIComponent(window.location.pathname || '/');
        const shouldGoToLogin = window.confirm(
            `Acesso restrito\n\nPara ${actionLabel}, voce precisa entrar na sua conta.\n\nDeseja ir para a tela de login agora?`
        );
        if (shouldGoToLogin) {
            window.location.href = `/login?next=${next}`;
        }
        return false;
    }

    if (authSession.emailVerified === false) {
        const email = encodeURIComponent(authSession.email || '');
        const shouldGoToVerification = window.confirm(
            'Confirmacao necessaria\n\nSua conta ainda nao foi confirmada por e-mail.\n\nDeseja ir para a tela de confirmacao agora?'
        );
        if (shouldGoToVerification) {
            window.location.href = `/confirmar-email?email=${email}`;
        }
        return false;
    }

    return true;
}

function bindMembershipAccessWall() {
    const serviceActions = document.querySelectorAll('[data-membership-action]');
    serviceActions.forEach((link) => {
        link.addEventListener('click', (event) => {
            const action = link.getAttribute('data-membership-action') || 'continuar';
            const actionLabel = action === 'consultoria'
                ? 'solicitar consultoria juridica'
                : 'assinar o clube de membros';
            if (!requireConfirmedAccountForAction(actionLabel)) {
                event.preventDefault();
            }
        });
    });

    const planButtons = document.querySelectorAll('.membership-plan-btn');
    planButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            if (!requireConfirmedAccountForAction('assinar o clube de membros')) {
                event.preventDefault();
                return;
            }
            showFeedback(
                'Sua conta esta apta. Em breve o checkout de assinatura sera liberado nesta tela.',
                'info',
                'Conta confirmada'
            );
        });
    });
}

function showDashboardVerificationReminder() {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    if (path !== '/painel') return;

    const params = new URLSearchParams(window.location.search);
    if (params.get('verifyEmail') !== '1') return;

    showFeedback(
        'Sua conta está ativa, mas recomendamos confirmar o e-mail para maior segurança e recuperação de acesso.',
        'warning',
        'Confirmação recomendada'
    );
}

async function postJson(path, payload) {
    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
    };

    const response = await performApiFetch(path, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(await extractApiErrorMessage(response));
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

async function getJson(path) {
    const authHeaders = getAuthHeaders();
    const options = Object.keys(authHeaders).length > 0 ? { headers: authHeaders } : undefined;
    const response = await performApiFetch(path, options);
    if (!response.ok) {
        throw new Error(await extractApiErrorMessage(response));
    }
    return response.json();
}

async function putJson(path, payload) {
    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
    };

    const response = await performApiFetch(path, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
    });
    if (!response.ok) {
        throw new Error(await extractApiErrorMessage(response));
    }
    if (response.status === 204) {
        return null;
    }
    return response.json();
}

async function extractApiErrorMessage(response) {
    try {
        const text = await response.text();
        if (!text || !text.trim()) {
            return `Falha na requisicao (${response.status})`;
        }

        const data = JSON.parse(text);
        if (data && typeof data.message === 'string' && data.message.trim()) {
            return data.message;
        }
        if (text && text.trim()) {
            return text;
        }
    } catch (_) {
    }
    return `Falha na requisicao (${response.status})`;
}

function ensureFeedbackHost() {
    let host = document.getElementById('feedback_host');
    if (host) return host;

    host = document.createElement('div');
    host.id = 'feedback_host';
    host.className = 'feedback-host';
    document.body.appendChild(host);
    return host;
}

function showFeedback(message, type = 'info', title = null, duration = 4200) {
    const host = ensureFeedbackHost();
    const toast = document.createElement('div');
    toast.className = `feedback-toast feedback-${type}`;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    const icon = type === 'success' ? 'fa-circle-check' :
        type === 'error' ? 'fa-circle-xmark' :
        type === 'warning' ? 'fa-triangle-exclamation' :
        'fa-circle-info';

    const defaultTitle = type === 'success' ? 'Sucesso' :
        type === 'error' ? 'Erro' :
        type === 'warning' ? 'Atencao' :
        'Informacao';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'feedback-icon';
    const iconEl = document.createElement('i');
    iconEl.className = `fas ${icon}`;
    iconWrap.appendChild(iconEl);

    const content = document.createElement('div');
    content.className = 'feedback-content';

    const titleEl = document.createElement('p');
    titleEl.className = 'feedback-title';
    titleEl.textContent = title || defaultTitle;

    const messageEl = document.createElement('p');
    messageEl.className = 'feedback-message';
    messageEl.textContent = message == null ? '' : String(message);

    const progressEl = document.createElement('span');
    progressEl.className = 'feedback-progress';
    content.appendChild(titleEl);
    content.appendChild(messageEl);
    content.appendChild(progressEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'feedback-close';
    closeBtn.setAttribute('aria-label', 'Fechar notificacao');
    const closeIcon = document.createElement('i');
    closeIcon.className = 'fas fa-xmark';
    closeBtn.appendChild(closeIcon);

    toast.appendChild(iconWrap);
    toast.appendChild(content);
    toast.appendChild(closeBtn);

    host.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));

    const close = () => {
        toast.classList.remove('is-visible');
        setTimeout(() => toast.remove(), 220);
    };

    closeBtn.addEventListener('click', close);
    setTimeout(close, duration);
}

function normalizeEmail(value) {
    return (value || '').trim().toLowerCase();
}

function normalizeSingleLineText(value) {
    return (value || '').replace(/\s+/g, ' ').trim();
}

function normalizeMultilineText(value) {
    return (value || '').replace(/\r\n/g, '\n').trim();
}

function normalizePhoneInput(value) {
    return (value || '').replace(/[^\d()+\-\s]/g, '').replace(/\s+/g, ' ').trim();
}

function getPhoneDigits(value) {
    return String(value || '').replace(/\D/g, '');
}

function assertTextRange(label, value, minLength, maxLength) {
    const normalized = normalizeSingleLineText(value);
    if (normalized.length < minLength) {
        throw new Error(`${label} deve ter pelo menos ${minLength} caracteres.`);
    }
    if (normalized.length > maxLength) {
        throw new Error(`${label} deve ter no maximo ${maxLength} caracteres.`);
    }
    return normalized;
}

function assertOptionalTextRange(label, value, maxLength) {
    const normalized = normalizeSingleLineText(value);
    if (!normalized) {
        return '';
    }
    if (normalized.length > maxLength) {
        throw new Error(`${label} deve ter no maximo ${maxLength} caracteres.`);
    }
    return normalized;
}

function assertEmailValue(value) {
    const normalized = normalizeEmail(value);
    if (!normalized) {
        throw new Error('Informe um e-mail valido.');
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalized) || normalized.length > 180) {
        throw new Error('Informe um e-mail valido.');
    }
    return normalized;
}

function assertPhoneValue(value, { required = false } = {}) {
    const normalized = normalizePhoneInput(value);
    const digits = getPhoneDigits(normalized);
    if (!digits) {
        if (required) {
            throw new Error('Informe um telefone valido.');
        }
        return '';
    }
    if (digits.length < 10 || digits.length > 15 || normalized.length > 40) {
        throw new Error('Informe um telefone valido com DDD.');
    }
    return normalized;
}

function assertPasswordValue(value, { required = true, label = 'Senha' } = {}) {
    const normalized = String(value || '').trim();
    if (!normalized) {
        if (required) {
            throw new Error(`${label} e obrigatoria.`);
        }
        return '';
    }
    if (normalized.length < 8 || normalized.length > 72) {
        throw new Error(`${label} deve ter entre 8 e 72 caracteres.`);
    }
    if (!/[A-Za-z]/.test(normalized) || !/\d/.test(normalized)) {
        throw new Error(`${label} deve conter pelo menos uma letra e um numero.`);
    }
    return normalized;
}

function assertMultilineText(label, value, minLength, maxLength) {
    const normalized = normalizeMultilineText(value);
    if (normalized.length < minLength) {
        throw new Error(`${label} deve ter pelo menos ${minLength} caracteres.`);
    }
    if (normalized.length > maxLength) {
        throw new Error(`${label} deve ter no maximo ${maxLength} caracteres.`);
    }
    return normalized;
}

function validateLocationPayload(location) {
    return {
        country: assertOptionalTextRange('Pais', location.country, 100),
        state: assertTextRange('Estado', location.state, 2, 100),
        city: assertTextRange('Cidade', location.city, 2, 120),
        isManualLocation: Boolean(location.isManualLocation)
    };
}

function getAuthHeaders() {
    const authSession = getAuthSession();
    if (!authSession) {
        return {};
    }

    const headers = {};
    if (authSession.sessionId) {
        headers['X-Session-Id'] = String(authSession.sessionId);
    }
    if (authSession.userId) {
        headers['X-User-Id'] = String(authSession.userId);
    }
    return headers;
}

function getSupabaseAuthSession() {
    const storageKey = window.__supabaseAuth?.storageKey || 'supabaseAuthSession';
    const authRaw = sessionStorage.getItem(storageKey) || localStorage.getItem(storageKey);
    if (!authRaw) return null;
    try {
        return JSON.parse(authRaw);
    } catch (_) {
        return null;
    }
}

function clearSupabaseAuthSession() {
    const storageKey = window.__supabaseAuth?.storageKey || 'supabaseAuthSession';
    localStorage.removeItem(storageKey);
    sessionStorage.removeItem(storageKey);
}

function isSupabaseAuthSessionValid(authSession) {
    if (!authSession || !authSession.user || !authSession.user.id) {
        return false;
    }

    if (!authSession.expiresAt) {
        return true;
    }

    const expiresAt = new Date(authSession.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
        return false;
    }

    return expiresAt.getTime() > Date.now();
}

function isAnyAuthSessionValid() {
    const authSession = getAuthSession();
    if (isAuthSessionValid(authSession)) {
        return true;
    }

    const supabaseSession = getSupabaseAuthSession();
    return isSupabaseAuthSessionValid(supabaseSession);
}

function isAdminSession(authSession) {
    return Boolean(authSession && authSession.role === 'ADMIN');
}

function getAssociatedAreaHref() {
    return isAnyAuthSessionValid() ? '/painel' : '/login';
}

function syncAssociatedAreaLinks() {
    const href = getAssociatedAreaHref();
    const links = document.querySelectorAll('[data-associated-area-link], .mobile-nav-cta');
    links.forEach((link) => {
        link.setAttribute('href', href);
    });
}

function ensureAdminAccess() {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    if (path !== '/admin') {
        return true;
    }

    const authSession = getAuthSession();
    if (!isAuthSessionValid(authSession) || !isAdminSession(authSession)) {
        showFeedback('Acesso restrito a administradores.', 'warning', 'Area protegida');
        window.location.href = '/painel';
        return false;
    }

    return true;
}

function toCpfDigits(value) {
    return (value || '').replace(/\D/g, '').slice(0, 11);
}

function formatCpf(value) {
    const digits = toCpfDigits(value);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function bindCpfMask() {
    const cpfInput = document.getElementById('prof_cpf');
    if (!cpfInput) return;

    cpfInput.addEventListener('input', () => {
        cpfInput.value = formatCpf(cpfInput.value);
    });
}

function guardProtectedRoute() {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    const protectedPaths = new Set(['/painel', '/info_user']);
    const guestOnlyPaths = new Set(['/login', '/cadastro', '/confirmar-email']);
    const authSession = getAuthSession();
    const isSessionValid = isAuthSessionValid(authSession);
    const supabaseSession = getSupabaseAuthSession();
    const isSupabaseSessionValid = isSupabaseAuthSessionValid(supabaseSession);
    const isAllowedWithSupabase = path === '/painel' && isSupabaseSessionValid;
    const isAuthenticated = isSessionValid || isAllowedWithSupabase;

    if (protectedPaths.has(path) && !isAuthenticated) {
        clearAuthSession();
        clearSupabaseAuthSession();
        window.location.href = '/login';
        return;
    }

    if (guestOnlyPaths.has(path) && isAuthenticated) {
        window.location.href = '/painel';
    }
}

function bindLogoutAction() {
    const logoutCard = document.querySelector('.logout-card');
    if (!logoutCard) return;
    logoutCard.addEventListener('click', async (event) => {
        event.preventDefault();
        const authSession = getAuthSession();
        if (authSession && authSession.userId) {
            try {
                await performApiFetch('/auth-sessions/logout', {
                    method: 'POST',
                    headers: getAuthHeaders()
                });
            } catch (_) {
            }
        }
        clearAuthSession();
        const supabaseSession = getSupabaseAuthSession();
        if (supabaseSession && window.__supabaseAuth?.signOutSupabase) {
            try {
                await window.__supabaseAuth.signOutSupabase();
            } catch (_) {
                clearSupabaseAuthSession();
            }
        } else {
            clearSupabaseAuthSession();
        }
        window.location.href = '/';
    });
}

function getAuthSession() {
    const authRaw = sessionStorage.getItem('authSession') || localStorage.getItem('authSession');
    if (!authRaw) return null;
    try {
        return JSON.parse(authRaw);
    } catch (_) {
        return null;
    }
}

function saveAuthSession(authSession, rememberMe) {
    const sanitized = { ...(authSession || {}) };
    const serialized = JSON.stringify(sanitized);
    sessionStorage.setItem('authSession', serialized);
    if (rememberMe) {
        localStorage.setItem('authSession', serialized);
    } else {
        localStorage.removeItem('authSession');
    }
}

function clearAuthSession() {
    localStorage.removeItem('authSession');
    sessionStorage.removeItem('authSession');
}

function isAuthSessionValid(authSession) {
    if (!authSession || !authSession.userId || !authSession.sessionId) {
        return false;
    }

    if (!authSession.expiresAt) {
        return true;
    }

    const expiresAt = new Date(authSession.expiresAt);
    if (Number.isNaN(expiresAt.getTime())) {
        return false;
    }

    return expiresAt.getTime() > Date.now();
}

function formatMemberSince(isoDate) {
    if (!isoDate) return '-';
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
}

async function initUserProfile() {
    const profileForm = document.querySelector('.profile-form-sophisticated');
    if (!profileForm) return;

    const authSession = getAuthSession();
    if (!authSession || !authSession.userId) {
        window.location.href = '/login';
        return;
    }

    try {
        const user = await getJson(`/users/${authSession.userId}`);
        const fullName = user.fullName || '-';
        const email = user.email || '';
        const phone = user.phone || '';
        const cpf = user.cpf || '';

        const addressParts = [];
        if (user.addressLine) addressParts.push(user.addressLine);
        if (user.city) addressParts.push(user.city);
        if (user.state) addressParts.push(user.state);
        if (user.country) addressParts.push(user.country);
        if (user.postalCode) addressParts.push(`CEP ${user.postalCode}`);
        const address = addressParts.join(', ');

        const headerName = document.getElementById('profile_fullname_header');
        if (headerName) headerName.textContent = fullName;
        const roleBadge = document.getElementById('profile_role_badge');
        if (roleBadge) roleBadge.textContent = user.isActive ? 'Membro Ativo' : 'Membro Inativo';
        const memberSince = document.getElementById('profile_member_since');
        if (memberSince) memberSince.textContent = formatMemberSince(user.createdAt);

        const nameInput = document.getElementById('prof_name');
        if (nameInput) nameInput.value = fullName === '-' ? '' : fullName;
        const emailInput = document.getElementById('prof_email');
        if (emailInput) emailInput.value = email;
        const phoneInput = document.getElementById('prof_phone');
        if (phoneInput) phoneInput.value = phone;
        const cpfInput = document.getElementById('prof_cpf');
        if (cpfInput) cpfInput.value = formatCpf(cpf);
        const addressInput = document.getElementById('prof_address');
        if (addressInput) addressInput.value = address;
    } catch (error) {
        console.error('Erro ao carregar perfil do usuario:', error);
        showFeedback(error.message || 'Nao foi possivel carregar os dados do perfil.', 'error', 'Falha ao carregar perfil');
    }
}

function initSupabaseDashboardProfile() {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    if (path !== '/painel') return;

    const authSession = getAuthSession();
    if (isAuthSessionValid(authSession)) {
        return;
    }

    const supabaseSession = getSupabaseAuthSession();
    if (!isSupabaseAuthSessionValid(supabaseSession)) {
        return;
    }

    const fullName = supabaseSession.user.fullName || supabaseSession.user.email || 'Membro';
    const headerName = document.getElementById('dashboard_user_name');
    if (headerName) {
        headerName.textContent = fullName;
    }

    const subtitle = document.getElementById('dashboard_auth_subtitle');
    if (subtitle) {
        subtitle.textContent = 'Sessao autenticada com Google via Supabase.';
    }

    const bridgeNotice = document.getElementById('dashboard_auth_notice');
    if (bridgeNotice) {
        bridgeNotice.hidden = false;
    }
}

function initAdminDashboardCard() {
    const adminCard = document.getElementById('admin-dashboard-card');
    if (!adminCard) return;

    const authSession = getAuthSession();
    const shouldShow = isAdminSession(authSession);
    adminCard.hidden = !shouldShow;
    adminCard.style.display = shouldShow ? 'flex' : 'none';
    adminCard.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    adminCard.tabIndex = shouldShow ? 0 : -1;
}

function escapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatAdminDate(value) {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getAdminItemTitle(item) {
    return item.category === 'consultancy'
        ? item.farmName || 'Consultoria sem fazenda'
        : item.subject || 'Mensagem sem assunto';
}

function getAdminItemPreview(item) {
    return item.category === 'consultancy'
        ? item.caseReport || ''
        : item.message || '';
}

function updateAdminStats(stats) {
    const mapping = {
        'admin-stat-contacts': stats.contactsOpen || 0,
        'admin-stat-consultancy': stats.consultancyOpen || 0,
        'admin-stat-urgent': stats.urgentCases || 0,
        'admin-stat-awaiting': stats.awaitingResponse || 0,
    };

    Object.entries(mapping).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = String(value);
        }
    });
}

function renderAdminInboxList(items, selectedId) {
    const list = document.getElementById('admin-inbox-list');
    if (!list) return;

    if (!items.length) {
        list.innerHTML = `
            <div class="admin-list-empty">
                <i class="fas fa-inbox"></i>
                <p>Nenhum item encontrado com os filtros atuais.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = items.map((item) => `
        <button type="button" class="admin-list-item ${item.id === selectedId ? 'is-active' : ''}" data-admin-item-id="${escapeHtml(item.id)}">
            <div class="admin-list-item-head">
                <span class="admin-type-badge admin-type-${escapeHtml(item.category)}">${item.category === 'consultancy' ? 'Consultoria' : 'Contato'}</span>
                <span class="admin-urgency-badge admin-urgency-${escapeHtml(item.urgencyLevel)}">${escapeHtml(item.urgencyLabel)}</span>
            </div>
            <h3>${escapeHtml(getAdminItemTitle(item))}</h3>
            <p>${escapeHtml(getAdminItemPreview(item).slice(0, 180))}</p>
            <div class="admin-list-item-meta">
                <span>${escapeHtml(item.requesterName || item.name || '-')}</span>
                <span>${escapeHtml(formatAdminDate(item.createdAt))}</span>
            </div>
        </button>
    `).join('');
}

function renderAdminDetail(item) {
    const emptyState = document.getElementById('admin-empty-state');
    const detail = document.getElementById('admin-detail-content');
    if (!detail || !emptyState) return;

    emptyState.hidden = Boolean(item);
    detail.hidden = !item;
    if (!item) {
        detail.innerHTML = '';
        return;
    }

    const identityName = item.requesterName || item.name || '-';
    const identityEmail = item.requesterEmail || item.email || '-';
    const identityPhone = item.requesterPhone || item.phone || '-';
    const longText = item.category === 'consultancy' ? item.caseReport : item.message;
    const statusOptions = ['NOVO', 'EM_ANALISE', 'RESPONDIDO', 'ENCERRADO'];

    detail.innerHTML = `
        <div class="admin-detail-header">
            <div>
                <span class="admin-urgency-badge admin-urgency-${escapeHtml(item.urgencyLevel)}">${escapeHtml(item.urgencyLabel)}</span>
                <h2>${escapeHtml(getAdminItemTitle(item))}</h2>
                <p>${escapeHtml(identityName)} · ${escapeHtml(identityEmail)} · ${escapeHtml(identityPhone)}</p>
            </div>
            <div class="admin-detail-meta">
                <span>${escapeHtml(item.category === 'consultancy' ? 'Pedido de consultoria' : 'Mensagem de contato')}</span>
                <span>${escapeHtml(formatAdminDate(item.createdAt))}</span>
            </div>
        </div>

        <div class="admin-detail-section">
            <h3>Contexto</h3>
            <dl class="admin-detail-grid">
                <div><dt>Status</dt><dd>${escapeHtml(item.status || '-')}</dd></div>
                <div><dt>Pais</dt><dd>${escapeHtml(item.country || '-')}</dd></div>
                <div><dt>Estado</dt><dd>${escapeHtml(item.state || '-')}</dd></div>
                <div><dt>Cidade</dt><dd>${escapeHtml(item.city || '-')}</dd></div>
                ${item.category === 'consultancy' ? `<div><dt>Conflito</dt><dd>${escapeHtml(item.conflictStatus || '-')}</dd></div>` : ''}
                ${item.category === 'consultancy' ? `<div><dt>Grupo envolvido</dt><dd>${escapeHtml(item.involvedGroup || '-')}</dd></div>` : ''}
            </dl>
        </div>

        <div class="admin-detail-section">
            <h3>Mensagem recebida</h3>
            <div class="admin-message-body">${escapeHtml(longText || '-').replace(/\n/g, '<br>')}</div>
        </div>

        <form class="admin-reply-form" id="admin-reply-form">
            <div class="admin-form-row">
                <div class="admin-filter-group">
                    <label for="admin-status-select">Novo status</label>
                    <select id="admin-status-select" name="status">
                        ${statusOptions.map((status) => `<option value="${status}" ${status === item.status ? 'selected' : ''}>${status}</option>`).join('')}
                    </select>
                </div>
                <div class="admin-filter-group admin-search-group">
                    <label for="admin-reply-subject">Assunto da resposta</label>
                    <input id="admin-reply-subject" name="subject" type="text" value="${escapeHtml(item.category === 'consultancy' ? `Atualizacao da sua consultoria - ${getAdminItemTitle(item)}` : `Retorno sobre: ${getAdminItemTitle(item)}`)}">
                </div>
            </div>
            <div class="admin-filter-group">
                <label for="admin-reply-message">Resposta</label>
                <textarea id="admin-reply-message" name="message" rows="7" placeholder="Escreva aqui a resposta que sera enviada por e-mail."></textarea>
            </div>
            <div class="admin-reply-actions">
                <button type="submit" class="btn-auth-gold">Enviar resposta</button>
            </div>
        </form>
    `;
}

function filterAdminInboxItems(items) {
    const typeFilter = document.getElementById('admin-filter-type')?.value || 'all';
    const urgencyFilter = document.getElementById('admin-filter-urgency')?.value || 'all';
    const searchFilter = (document.getElementById('admin-filter-search')?.value || '').trim().toLowerCase();

    return items.filter((item) => {
        if (typeFilter !== 'all' && item.category !== typeFilter) {
            return false;
        }
        if (urgencyFilter !== 'all' && item.urgencyLevel !== urgencyFilter) {
            return false;
        }
        if (!searchFilter) {
            return true;
        }

        const haystack = [
            item.requesterName,
            item.requesterEmail,
            item.name,
            item.email,
            item.subject,
            item.message,
            item.farmName,
            item.caseReport,
            item.involvedGroup,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        return haystack.includes(searchFilter);
    });
}

async function initAdminInboxPage() {
    const list = document.getElementById('admin-inbox-list');
    if (!list) return;

    const authSession = getAuthSession();
    if (!isAdminSession(authSession)) {
        list.innerHTML = '<div class="admin-list-empty"><p>Area restrita a administradores.</p></div>';
        return;
    }

    const state = {
        items: [],
        selectedId: null,
    };

    const render = () => {
        const filtered = filterAdminInboxItems(state.items);
        if (!state.selectedId && filtered[0]) {
            state.selectedId = filtered[0].id;
        }
        const selected = filtered.find((item) => item.id === state.selectedId) || filtered[0] || null;
        state.selectedId = selected ? selected.id : null;
        renderAdminInboxList(filtered, state.selectedId);
        renderAdminDetail(selected);
    };

    try {
        const payload = await getJson('/admin/inbox');
        updateAdminStats(payload.stats || {});
        state.items = [
            ...(payload.contactMessages || []),
            ...(payload.consultancyRequests || []),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        render();
    } catch (error) {
        console.error('Erro ao carregar area admin:', error);
        list.innerHTML = '<div class="admin-list-empty"><p>Nao foi possivel carregar a caixa administrativa.</p></div>';
        return;
    }

    ['admin-filter-type', 'admin-filter-urgency', 'admin-filter-search'].forEach((id) => {
        const element = document.getElementById(id);
        if (!element) return;
        element.addEventListener('input', render);
        element.addEventListener('change', render);
    });

    list.addEventListener('click', (event) => {
        const button = event.target.closest('[data-admin-item-id]');
        if (!button) return;
        state.selectedId = button.getAttribute('data-admin-item-id');
        render();
    });

    document.addEventListener('submit', async (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement) || form.id !== 'admin-reply-form') {
            return;
        }

        event.preventDefault();
        const selected = state.items.find((item) => item.id === state.selectedId);
        if (!selected) return;

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton ? submitButton.textContent : '';
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';
        }

        try {
            const payload = {
                subject: form.querySelector('#admin-reply-subject')?.value || '',
                message: form.querySelector('#admin-reply-message')?.value || '',
                status: form.querySelector('#admin-status-select')?.value || 'RESPONDIDO',
            };

            if (!payload.message.trim()) {
                throw new Error('Escreva a resposta antes de enviar.');
            }

            const basePath = selected.category === 'consultancy'
                ? `/admin/inbox/consultancy-requests/${selected.id}`
                : `/admin/inbox/contact-messages/${selected.id}`;

            await postJson(`${basePath}/reply`, payload);
            selected.status = payload.status;
            showFeedback('Resposta enviada com sucesso.', 'success', 'Atendimento registrado');
            render();
            form.reset();
        } catch (error) {
            console.error('Erro ao responder item admin:', error);
            showFeedback(error.message || 'Nao foi possivel enviar a resposta.', 'error', 'Falha ao responder');
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        }
    });
}

function bindUserProfileSubmit() {
    const form = document.querySelector('.profile-form-sophisticated');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const authSession = getAuthSession();
        if (!authSession || !authSession.userId) {
            window.location.href = '/login';
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Salvando...';
        }

        try {
            const currentPassword = String(document.getElementById('prof_curr_pass')?.value || '');
            const newPassword = String(document.getElementById('prof_new_pass')?.value || '');
            const confirmNewPassword = String(document.getElementById('prof_confirm_new_pass')?.value || '');
            const hasPasswordChangeInput = Boolean(newPassword || confirmNewPassword);

            if (hasPasswordChangeInput) {
                if (!newPassword || !confirmNewPassword) {
                    throw new Error('Para alterar a senha, preencha nova senha e confirmacao.');
                }
                if (newPassword !== confirmNewPassword) {
                    throw new Error('A confirmacao da nova senha nao confere.');
                }
            }

            const payload = {
                fullName: assertTextRange('Nome completo', document.getElementById('prof_name')?.value || '', 3, 120),
                email: assertEmailValue(document.getElementById('prof_email')?.value || ''),
                phone: assertPhoneValue(document.getElementById('prof_phone')?.value || ''),
                cpf: toCpfDigits(document.getElementById('prof_cpf')?.value || ''),
                currentPassword: assertPasswordValue(currentPassword, { label: 'Senha atual' }),
                newPassword: hasPasswordChangeInput
                    ? assertPasswordValue(newPassword, { label: 'Nova senha' })
                    : ''
            };

            const updatedUser = await putJson(`/users/${authSession.userId}/profile`, payload);
            const updatedSession = {
                ...authSession,
                fullName: updatedUser.fullName || authSession.fullName,
                email: updatedUser.email || authSession.email
            };
            saveAuthSession(updatedSession, Boolean(authSession.rememberMe));

            const headerName = document.getElementById('profile_fullname_header');
            if (headerName) headerName.textContent = updatedUser.fullName || '-';

            const currPassInput = document.getElementById('prof_curr_pass');
            if (currPassInput) currPassInput.value = '';
            const newPassInput = document.getElementById('prof_new_pass');
            if (newPassInput) newPassInput.value = '';
            const confirmNewPassInput = document.getElementById('prof_confirm_new_pass');
            if (confirmNewPassInput) confirmNewPassInput.value = '';

            showFeedback('Perfil atualizado com sucesso.', 'success', 'Dados salvos');
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            showFeedback(error.message || 'Nao foi possivel atualizar o perfil.', 'error', 'Falha ao atualizar');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    });
}

function inferCountryByLang() {
    if (currentLang === 'en') return 'United States';
    if (currentLang === 'es') return 'Argentina';
    return 'Brasil';
}

function resolveLocationValues(form) {
    const freestyleCheck = form.querySelector('#freestyle-check');
    const isManualLocation = Boolean(freestyleCheck && freestyleCheck.checked);
    const countrySelect = form.querySelector('#pais');
    const countryInput = form.querySelector('#pais-input');
    const stateSelect = form.querySelector('#estado');
    const stateInput = form.querySelector('#estado-input');
    const citySelect = form.querySelector('#cidade');
    const cityInput = form.querySelector('#cidade-input');

    const country = isManualLocation
        ? (countryInput?.value || '').trim()
        : ((countrySelect?.value || '').trim() || inferCountryByLang());
    const state = isManualLocation
        ? (stateInput?.value || '').trim()
        : ((stateSelect?.value || '').trim());
    const city = isManualLocation
        ? (cityInput?.value || '').trim()
        : ((citySelect?.value || '').trim());

    return { country, state, city, isManualLocation };
}

function bindContactSubmit() {
    const form = document.getElementById('main-contact-form');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
        }

        try {
            const location = validateLocationPayload(resolveLocationValues(form));
            const payload = {
                name: assertTextRange('Nome', form.querySelector('#contact_name')?.value || '', 3, 120),
                email: assertEmailValue(form.querySelector('#contact_email')?.value || ''),
                phone: assertPhoneValue(form.querySelector('#contact_phone')?.value || '', { required: true }),
                subject: assertTextRange('Assunto', form.querySelector('#contact_subject')?.value || '', 3, 160),
                message: assertMultilineText('Mensagem', form.querySelector('#contact_message')?.value || '', 10, 5000),
                country: location.country,
                state: location.state,
                city: location.city,
                isManualLocation: location.isManualLocation,
                newsletterOptIn: Boolean(form.querySelector('#newsletter_check')?.checked)
            };

            await postJson('/contact-messages', payload);
            showFeedback('Mensagem enviada com sucesso. Em breve retornaremos.', 'success', 'Contato recebido');
            form.reset();
        } catch (error) {
            console.error('Erro ao enviar contato:', error);
            showFeedback(`Nao foi possivel enviar sua mensagem. ${error.message}`, 'error', 'Falha no envio');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    });
}

function bindConsultancySubmit() {
    const form = document.getElementById('consultancy-form');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!requireConfirmedAccountForAction('solicitar consultoria juridica')) {
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
        }

        try {
            const location = validateLocationPayload(resolveLocationValues(form));
            const rawStatus = (form.querySelector('#srv_status')?.value || '').trim();
            const normalizedConflictStatus = rawStatus.toUpperCase();
            const allowedConflictStatuses = ['AMEACA', 'INVADIDA_PARCIAL', 'INVADIDA_TOTAL', 'PROCESSO', 'OUTROS'];
            if (!allowedConflictStatuses.includes(normalizedConflictStatus)) {
                throw new Error('Selecione um status de conflito valido.');
            }
            const payload = {
                requesterName: assertTextRange('Nome completo', form.querySelector('#srv_nome')?.value || '', 3, 120),
                requesterEmail: assertEmailValue(form.querySelector('#srv_email')?.value || ''),
                requesterPhone: assertPhoneValue(form.querySelector('#srv_phone')?.value || '', { required: true }),
                farmName: assertTextRange('Nome da fazenda', form.querySelector('#srv_fazenda')?.value || '', 3, 180),
                country: location.country || inferCountryByLang(),
                state: location.state,
                city: location.city,
                isManualLocation: location.isManualLocation,
                conflictStatus: normalizedConflictStatus,
                involvedGroup: assertTextRange('Grupo envolvido', form.querySelector('#srv_grupo')?.value || '', 2, 160),
                caseReport: assertMultilineText('Relato do caso', form.querySelector('#srv_relato')?.value || '', 20, 8000)
            };

            await postJson('/consultancy-requests', payload);
            showFeedback('Solicitacao enviada com sucesso.', 'success', 'Consultoria registrada');
            form.reset();
        } catch (error) {
            console.error('Erro ao enviar consultoria:', error);
            showFeedback(`Nao foi possivel enviar a solicitacao. ${error.message}`, 'error', 'Falha no envio');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    });
}

function bindRegisterSubmit() {
    const form = document.getElementById('register-form');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const password = String(form.querySelector('#reg_password')?.value || '').trim();
        const confirmPassword = String(form.querySelector('#reg_confirm_password')?.value || '').trim();
        if (password !== confirmPassword) {
            showFeedback('As senhas nao conferem.', 'warning', 'Verifique os campos');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Cadastrando...';
        }

        try {
            const email = normalizeEmail(form.querySelector('#reg_email')?.value);
            const supabaseAuth = window.__supabaseAuth;
            if (!supabaseAuth || !supabaseAuth.isConfigured || typeof supabaseAuth.signUpWithEmail !== 'function') {
                throw new Error('Cadastro por email ainda nao foi configurado no Supabase.');
            }

            await supabaseAuth.signUpWithEmail({
                fullName: assertTextRange('Nome completo', form.querySelector('#reg_fullname')?.value || '', 3, 120),
                email: assertEmailValue(email),
                phone: assertPhoneValue(form.querySelector('#reg_phone')?.value || '', { required: true }),
                password: assertPasswordValue(password)
            });

            showFeedback('Cadastro criado. Enviamos um link de confirmacao para seu e-mail.', 'success', 'Conta criada');
            form.reset();
            setTimeout(() => {
                window.location.href = `/login?signupEmail=${encodeURIComponent(email)}`;
            }, 1800);
        } catch (error) {
            console.error('Erro ao cadastrar usuario:', error);
            showFeedback(error.message || 'Nao foi possivel concluir o cadastro.', 'error', 'Falha no cadastro');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    });
}

function showLoginVerificationFeedback() {
    if (!document.getElementById('login-form')) return;

    const params = new URLSearchParams(window.location.search);
    const emailConfirmed = params.get('emailConfirmed');
    if (emailConfirmed === '1') {
        showFeedback('Seu e-mail foi confirmado. Agora você já pode entrar.', 'success', 'E-mail verificado');
    } else if (emailConfirmed === '0') {
        showFeedback('Link de confirmação inválido ou expirado. Solicite um novo cadastro.', 'warning', 'Confirmação inválida');
    }
}

function bindEmailVerificationDigits() {
    const digits = Array.from(document.querySelectorAll('.verify-code-digit'));
    if (digits.length === 0) return;

    digits.forEach((input, index) => {
        input.addEventListener('input', () => {
            input.value = (input.value || '').replace(/\D/g, '').slice(0, 1);
            if (input.value && index < digits.length - 1) {
                digits[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Backspace' && !input.value && index > 0) {
                digits[index - 1].focus();
            }
        });

        input.addEventListener('paste', (event) => {
            const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, digits.length);
            if (!pasted) return;
            event.preventDefault();
            pasted.split('').forEach((char, idx) => {
                if (digits[idx]) digits[idx].value = char;
            });
            const next = Math.min(pasted.length, digits.length - 1);
            digits[next].focus();
        });
    });
}

function getVerificationCodeValue() {
    const digits = Array.from(document.querySelectorAll('.verify-code-digit'));
    if (digits.length === 0) return '';
    return digits.map((input) => (input.value || '').replace(/\D/g, '')).join('');
}

function clearVerificationCodeInputs() {
    const digits = Array.from(document.querySelectorAll('.verify-code-digit'));
    digits.forEach((input) => {
        input.value = '';
    });
    if (digits[0]) digits[0].focus();
}

function bindEmailVerificationSubmit() {
    const form = document.getElementById('email-verification-form');
    if (!form) return;

    const params = new URLSearchParams(window.location.search);
    const prefilledEmail = params.get('email');
    const emailInput = document.getElementById('verify_email');
    if (emailInput && prefilledEmail) {
        emailInput.value = normalizeEmail(prefilledEmail);
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Validando...';
        }

        try {
            const email = assertEmailValue(emailInput?.value || '');
            const code = getVerificationCodeValue();
            if (!/^\d{6}$/.test(code)) {
                throw new Error('Informe os 6 digitos do codigo.');
            }

            await postJson('/email-verification/confirm-code', { email, code });
            showFeedback('E-mail confirmado com sucesso. Faca login para continuar.', 'success', 'Conta ativada');
            clearVerificationCodeInputs();
            setTimeout(() => {
                window.location.href = '/login?emailConfirmed=1';
            }, 1400);
        } catch (error) {
            console.error('Erro ao confirmar e-mail:', error);
            showFeedback(error.message || 'Nao foi possivel confirmar o e-mail.', 'error', 'Codigo invalido');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    });
}

function bindResendVerificationCode() {
    const resendBtn = document.getElementById('resend-verification-code');
    if (!resendBtn) return;

    resendBtn.addEventListener('click', async () => {
        const emailInput = document.getElementById('verify_email');
        const originalText = resendBtn.textContent;
        resendBtn.disabled = true;
        resendBtn.textContent = 'Reenviando...';

        try {
            const email = assertEmailValue(emailInput?.value || '');
            await postJson('/email-verification/request', { email });
            showFeedback('Codigo reenviado. Verifique sua caixa de entrada.', 'success', 'Envio realizado');
        } catch (error) {
            console.error('Erro ao reenviar codigo:', error);
            showFeedback(error.message || 'Nao foi possivel reenviar o codigo.', 'error', 'Falha no reenvio');
        } finally {
            resendBtn.disabled = false;
            resendBtn.textContent = originalText;
        }
    });
}

function bindLoginSubmit() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Entrando...';
        }

        try {
            const payload = {
                email: assertEmailValue(form.querySelector('#login_email')?.value),
                password: assertPasswordValue(form.querySelector('#login_password')?.value || '', { label: 'Senha' }),
                rememberMe: Boolean(form.querySelector('#remember')?.checked)
            };

            const authSession = await postJson('/auth-sessions/login', payload);
            authSession.rememberMe = Boolean(payload.rememberMe);
            saveAuthSession(authSession, Boolean(payload.rememberMe));
            if (authSession.emailVerified === false) {
                const email = encodeURIComponent(payload.email || '');
                window.location.href = `/confirmar-email?email=${email}`;
                return;
            }
            window.location.href = '/painel';
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            showFeedback(error.message || 'Nao foi possivel fazer login.', 'error', 'Falha no login');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    });
}

// =========================================
// MOBILE MENU FUNCTIONALITY
// =========================================
function initMobileMenu() {
    // Cria o overlay e drawer se não existirem
    if (!document.querySelector('.mobile-menu-overlay')) {
        createMobileMenuElements();
    }
    
    // Setup event listeners
    const overlay = document.querySelector('.mobile-menu-overlay');
    const drawer = document.querySelector('.mobile-nav-drawer');
    const closeBtn = document.querySelector('.mobile-nav-close');
    
    if (overlay) {
        overlay.addEventListener('click', closeMobileMenu);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMobileMenu);
    }
    
    // Fecha menu ao clicar em um link
    const menuLinks = document.querySelectorAll('.mobile-nav-menu a');
    menuLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });
    
    // Fecha menu com tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMobileMenu();
    });

    // Atualiza bandeiras do menu mobile
    updateMobileMenuFlags();
}

function createMobileMenuElements() {
    // Create Overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-menu-overlay';
    document.body.appendChild(overlay);
    
    // Create Drawer
    const drawer = document.createElement('nav');
    drawer.className = 'mobile-nav-drawer';
    
    // Drawer Content
    drawer.innerHTML = `
        <div class="mobile-nav-header">
            <h3 data-i18n="mobile_menu_title">Menu</h3>
            <button class="mobile-nav-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <ul class="mobile-nav-menu">
            <li><a href="/"><span data-i18n="menu_home">Início</span> <i class="fas fa-chevron-right"></i></a></li>
            <li><a href="/sobre"><span data-i18n="menu_sobre">Instituto</span> <i class="fas fa-chevron-right"></i></a></li>
            <li><a href="/projetos"><span data-i18n="menu_projetos">Projetos</span> <i class="fas fa-chevron-right"></i></a></li>
            <li><a href="/noticias"><span data-i18n="menu_noticias">Notícias</span> <i class="fas fa-chevron-right"></i></a></li>
            <li><a href="/dados"><span data-i18n="menu_dados">Dados</span> <i class="fas fa-chevron-right"></i></a></li>
            <li><a href="/servicos"><span data-i18n="menu_servicos">Serviços</span> <i class="fas fa-chevron-right"></i></a></li>
            <li><a href="/produtos"><span data-i18n="menu_produtos">Produtos</span> <i class="fas fa-chevron-right"></i></a></li>
            <li><a href="/cotacoes"><span data-i18n="menu_cotacoes">Cotações</span> <i class="fas fa-chevron-right"></i></a></li>
            <li><a href="/contato"><span data-i18n="menu_contato">Contato</span> <i class="fas fa-chevron-right"></i></a></li>
        </ul>
        <div class="mobile-nav-footer">
            <div class="mobile-nav-flags">
                <img src="https://flagcdn.com/w40/br.png" alt="Português" class="flag-btn" onclick="setLanguage('pt'); updateMobileMenuFlags();">
                <img src="https://flagcdn.com/w40/us.png" alt="English" class="flag-btn" onclick="setLanguage('en'); updateMobileMenuFlags();">
                <img src="https://flagcdn.com/w40/es.png" alt="Español" class="flag-btn" onclick="setLanguage('es'); updateMobileMenuFlags();">
            </div>
            <a href="/login" class="mobile-nav-cta" data-associated-area-link>
                <i class="fas fa-user"></i> <span data-i18n="topbar_login">Área do Associado</span>
            </a>
        </div>
    `;
    
    document.body.appendChild(drawer);

    // Marca página ativa
    markCurrentPageInMenu();
    syncAssociatedAreaLinks();
}

function toggleMenu() {
    const drawer = document.querySelector('.mobile-nav-drawer');
    if (drawer && drawer.classList.contains('active')) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

function openMobileMenu() {
    document.querySelector('.mobile-menu-overlay').classList.add('active');
    document.querySelector('.mobile-nav-drawer').classList.add('active');
    document.body.classList.add('menu-open');
}

function closeMobileMenu() {
    document.querySelector('.mobile-menu-overlay').classList.remove('active');
    document.querySelector('.mobile-nav-drawer').classList.remove('active');
    document.body.classList.remove('menu-open');
}

function updateMobileMenuFlags() {
    const flags = document.querySelectorAll('.mobile-nav-flags .flag-btn');
    flags.forEach(img => {
        img.classList.remove('active');
        if (img.getAttribute('onclick').includes(currentLang)) {
            img.classList.add('active');
        }
    });

    // Atualiza textos dentro do menu mobile se necessário
    const drawer = document.querySelector('.mobile-nav-drawer');
    if (drawer) {
        const elements = drawer.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[currentLang] && translations[currentLang][key]) {
                element.textContent = translations[currentLang][key];
            }
        });
    }
}

function markCurrentPageInMenu() {
    const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
    const menuLinks = document.querySelectorAll('.mobile-nav-menu a');
    
    menuLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        const normalizedHref = href.replace(/\/+$/, '') || '/';
        if (normalizedHref === currentPath) {
            link.classList.add('active');
        }
    });
}


// =========================================
// LANGUAGE SYSTEM
// =========================================
function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('preferredLang', lang);
    document.documentElement.setAttribute('data-preferred-lang', lang);
    document.documentElement.removeAttribute('data-lang-pending');
    document.documentElement.lang =
        lang === 'en' ? 'en-US' :
        lang === 'es' ? 'es-ES' :
        lang === 'cn' ? 'zh-CN' :
        'pt-BR';

    // Atualiza textos
    const elements = document.querySelectorAll('[data-i18n]');
    const langPack = translations[lang] || {};
    const enPack = translations.en || {};
    const fallbackPack = translations.pt || {};

    const isCorruptedText = (value) => {
        if (value == null) return true;
        const text = String(value);
        if (!text.trim()) return true;
        if (/[ÃÂâ]/.test(text) || text.includes('\uFFFD')) return true;
        const qCount = (text.match(/\?/g) || []).length;
        if (qCount >= 2) return true;
        return false;
    };

    const getOriginal = (el) => {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (!el.hasAttribute('data-i18n-original-placeholder')) {
                el.setAttribute('data-i18n-original-placeholder', el.getAttribute('placeholder') || '');
            }
            return el.getAttribute('data-i18n-original-placeholder') || '';
        }
        if (!el.hasAttribute('data-i18n-original-text')) {
            el.setAttribute('data-i18n-original-text', el.innerHTML || '');
        }
        return el.getAttribute('data-i18n-original-text') || '';
    };

    const applyPhraseMap = (text, map) => {
        const entries = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
        let out = String(text || '');
        entries.forEach(([from, to]) => {
            const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            out = out.replace(new RegExp(escaped, 'gi'), to);
        });
        return out;
    };

    const autoTranslateQuoteText = (key, originalText, targetLang) => {
        const source = String(originalText || '').trim();
        if (!source || targetLang === 'pt') return source;
        if (!key || !key.startsWith('quote_')) return source;

        const phraseMaps = {
            en: {
                'Ativo / Praça': 'Asset / Market',
                'Atualizado em': 'Updated on',
                'Última atualização': 'Last update',
                'Ultima atualizacao': 'Last update',
                'Buscar no painel ativo': 'Search in active panel',
                'Somente ativos compatíveis com a cadeia selecionada.': 'Only assets compatible with the selected chain.',
                'Somente ativos compativeis com a cadeia selecionada.': 'Only assets compatible with the selected chain.',
                'Sem variações suficientes para montar o ticker neste ciclo.': 'Not enough changes to build the ticker in this cycle.',
                'Sem variacoes suficientes para montar o ticker neste ciclo.': 'Not enough changes to build the ticker in this cycle.',
                'Categorias': 'Categories',
                'registros': 'records'
            },
            es: {
                'Ativo / Praça': 'Activo / Plaza',
                'Atualizado em': 'Actualizado en',
                'Última atualização': 'Última actualización',
                'Ultima atualizacao': 'Última actualización',
                'Buscar no painel ativo': 'Buscar en el panel activo',
                'Somente ativos compatíveis com a cadeia selecionada.': 'Solo activos compatibles con la cadena seleccionada.',
                'Somente ativos compativeis com a cadeia selecionada.': 'Solo activos compatibles con la cadena seleccionada.',
                'Sem variações suficientes para montar o ticker neste ciclo.': 'Sin variaciones suficientes para montar el ticker en este ciclo.',
                'Sem variacoes suficientes para montar o ticker neste ciclo.': 'Sin variaciones suficientes para montar el ticker en este ciclo.',
                'Categorias': 'Categorías',
                'registros': 'registros'
            },
            cn: {
                'Ativo / Praça': '?? / ??',
                'Atualizado em': 'æ›´æ–°äºŽ',
                'Última atualização': '????',
                'Ultima atualizacao': 'æœ€åŽæ›´æ–°',
                'Buscar no painel ativo': 'åœ¨å½“å‰é¢æ¿ä¸­æœç´¢',
                'Somente ativos compatíveis com a cadeia selecionada.': '???????????????',
                'Somente ativos compativeis com a cadeia selecionada.': 'ä»…æ˜¾ç¤ºä¸Žæ‰€é€‰äº§ä¸šé“¾å…¼å®¹çš„èµ„äº§ã€‚',
                'Sem variações suficientes para montar o ticker neste ciclo.': '??????,??????????',
                'Sem variacoes suficientes para montar o ticker neste ciclo.': 'æœ¬è½®æ¶¨è·Œä¸è¶³ï¼Œæ— æ³•ç”Ÿæˆè¡Œæƒ…æ»šåŠ¨æ¡ã€‚',
                'Categorias': 'åˆ†ç±»',
                'registros': 'æ¡è®°å½•'
            }
        };

        const termMaps = {
            en: {
                'Indicadores de ': 'Indicators of ',
                'Indicadores do ': 'Indicators of ',
                'Preco ': 'Price ',
                'Preco(': 'Price(',
                'Preco (': 'Price (',
                'Valor ': 'Value ',
                'Valor (': 'Value (',
                'Fechamento ': 'Close ',
                'Fechamento (': 'Close (',
                'Variacao ': 'Change ',
                'Variacao (': 'Change (',
                'Variacao semanal': 'Weekly change',
                'Variacao dia': 'Daily change',
                'A vista': 'Spot',
                'A prazo': 'Term',
                'Data': 'Date',
                'Referencia': 'Reference',
                'Praca': 'Market',
                'Mercado Fisico': 'Cash Market',
                'Mercado Internacional': 'International Market',
                'Outros Indicadores': 'Other Indicators',
                'Pregao Regular': 'Regular Session',
                'Referencias nacionais': 'National References',
                'Estados e pracas': 'States and Markets',
                'Estados e media Brasil': 'States and Brazil Average',
                'Granja e atacado': 'Farm and Wholesale',
                'Pracas e cooperativas': 'Markets and Cooperatives',
                'Ceasas, estados e tipos': 'Wholesale Markets, States and Types',
                'Ceasas e tipos': 'Wholesale Markets and Types',
                'B3': 'B3'
            },
            es: {
                'Indicadores de ': 'Indicadores de ',
                'Indicadores do ': 'Indicadores de ',
                'Preco ': 'Precio ',
                'Preco(': 'Precio(',
                'Preco (': 'Precio (',
                'Valor ': 'Valor ',
                'Valor (': 'Valor (',
                'Fechamento ': 'Cierre ',
                'Fechamento (': 'Cierre (',
                'Variacao ': 'Variación ',
                'Variacao (': 'Variación (',
                'Variacao semanal': 'Variación semanal',
                'Variacao dia': 'Variación diaria',
                'A vista': 'Contado',
                'A prazo': 'Plazo',
                'Data': 'Fecha',
                'Referencia': 'Referencia',
                'Praca': 'Plaza',
                'Mercado Fisico': 'Mercado Físico',
                'Mercado Internacional': 'Mercado Internacional',
                'Outros Indicadores': 'Otros Indicadores',
                'Pregao Regular': 'Sesión Regular',
                'Referencias nacionais': 'Referencias nacionales',
                'Estados e pracas': 'Estados y plazas',
                'Estados e media Brasil': 'Estados y promedio de Brasil',
                'Granja e atacado': 'Granja y mayorista',
                'Pracas e cooperativas': 'Plazas y cooperativas',
                'Ceasas, estados e tipos': 'Mercados mayoristas, estados y tipos',
                'Ceasas e tipos': 'Mercados mayoristas y tipos',
                'B3': 'B3'
            },
            cn: {
                'Indicadores de ': '',
                'Indicadores do ': '',
                'Preco ': 'ä»·æ ¼ ',
                'Preco(': 'ä»·æ ¼(',
                'Preco (': 'ä»·æ ¼ (',
                'Valor ': 'æ•°å€¼ ',
                'Valor (': 'æ•°å€¼ (',
                'Fechamento ': 'æ”¶ç›˜ ',
                'Fechamento (': 'æ”¶ç›˜ (',
                'Variacao ': 'æ¶¨è·Œ ',
                'Variacao (': 'æ¶¨è·Œ (',
                'Variacao semanal': 'å‘¨æ¶¨è·Œ',
                'Variacao dia': 'æ—¥æ¶¨è·Œ',
                'A vista': 'çŽ°è´§',
                'A prazo': 'è¿œæœŸ',
                'Data': 'æ—¥æœŸ',
                'Referencia': 'å‚è€ƒ',
                'Praca': 'äº¤æ˜“åœ°',
                'Mercado Fisico': 'çŽ°è´§å¸‚åœº',
                'Mercado Internacional': 'å›½é™…å¸‚åœº',
                'Outros Indicadores': 'å…¶ä»–æŒ‡æ ‡',
                'Pregao Regular': 'å¸¸è§„äº¤æ˜“æ—¶æ®µ',
                'Referencias nacionais': 'å…¨å›½å‚è€ƒ',
                'Estados e pracas': 'å„å·žä¸Žäº¤æ˜“åœ°',
                'Estados e media Brasil': 'å„å·žä¸Žå·´è¥¿å‡å€¼',
                'Granja e atacado': 'å†œåœºä¸Žæ‰¹å‘',
                'Pracas e cooperativas': 'äº¤æ˜“åœ°ä¸Žåˆä½œç¤¾',
                'Ceasas, estados e tipos': 'æ‰¹å‘å¸‚åœºã€å„å·žä¸Žå“ç±»',
                'Ceasas e tipos': 'æ‰¹å‘å¸‚åœºä¸Žå“ç±»',
                'B3': 'B3'
            }
        };

        const direct = phraseMaps[targetLang] || {};
        if (direct[source]) return direct[source];

        return applyPhraseMap(source, termMaps[targetLang] || {});
    };

    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (!key) return;
        let translated = langPack[key];
        if (isCorruptedText(translated)) translated = null;

        // Para chinês, tenta inglês antes de cair para PT.
        if (translated == null && lang === 'cn') {
            const enCandidate = enPack[key];
            if (!isCorruptedText(enCandidate)) translated = enCandidate;
        }

        if (translated == null) {
            const ptCandidate = fallbackPack[key];
            if (!isCorruptedText(ptCandidate)) translated = ptCandidate;
        }

        if (translated == null) {
            const originalText = getOriginal(element);
            translated = autoTranslateQuoteText(key, originalText, lang);
        }

        if (translated != null) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translated;
            } else {
                element.textContent = translated;
            }
        }
    });

    // CORREÇÃO: Atualiza bandeiras (suporte para bandeiras com data-lang e/ou onclick)
    const allFlags = document.querySelectorAll('.flag-btn, .flag-mini');
    allFlags.forEach(img => {
        img.classList.remove('active');
        const clickAttr = img.getAttribute('onclick') || '';
        const dataLang = img.getAttribute('data-lang');
        if (dataLang === lang || clickAttr.includes(`'${lang}'`)) {
            img.classList.add('active');
        }
    });

    // Atualiza componentes dinâmicos se estiverem na página
    if (document.getElementById('news-container')) {
        loadNews();
    }

    
    
    if (document.querySelector('.contact-form-wrapper') || document.querySelector('.contact-form-panel')) {
        handleContactLanguageChange();
    }
    // Dentro da função setLanguage(lang) no main.js
const dateElements = document.querySelectorAll('.update-date-js');
dateElements.forEach(el => {
    const rawValue = el.getAttribute('data-raw-date') || el.textContent.trim();
    
    // Salva o valor original se for a primeira vez para não perder a referência na troca de idiomas
    if(!el.getAttribute('data-raw-date')) el.setAttribute('data-raw-date', rawValue);

    // Lógica simples de inversão de data (DD/MM para MM/DD)
    if (rawValue.includes('/')) {
        const parts = rawValue.split('/');
        if (lang === 'en' && parts.length === 2) {
            el.textContent = `${parts[1]}/${parts[0]}`; // MM/DD
        } else if (lang === 'en' && parts.length === 3) {
            el.textContent = `${parts[1]}/${parts[0]}/${parts[2]}`; // MM/DD/YYYY
        } else {
            el.textContent = rawValue; // Volta para DD/MM
        }
    }
});

    // Notifica páginas com conteúdo dinâmico para reaplicar localização.
    try {
        document.dispatchEvent(new CustomEvent('language:changed', { detail: { lang } }));
    } catch (_) {}
}


// =========================================
// NEWS PAGE FUNCTIONALITY
// =========================================

// RSS Feeds (Google Alerts)
const feedUrls = [
    'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.google.com.br%2Falerts%2Ffeeds%2F16263980189685995465%2F2674679861920271350',
    'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.google.com.br%2Falerts%2Ffeeds%2F16263980189685995465%2F10697110974606485694'
];

function initNewsPage() {
    loadNews();
}

function loadNews() {
    const container = document.getElementById('news-container');
    if (!container) return;

    // Show loading
    const loadingText = translations[currentLang]['loading'] || 'Carregando...';
    container.innerHTML = `<div class="loading-container"><i class="fas fa-circle-notch fa-spin"></i> ${loadingText}</div>`;

    // Fetch all feeds
    Promise.all(feedUrls.map(url => fetch(url).then(resp => resp.json())))
    .then(results => {
        container.innerHTML = '';
        let todasNoticias = [];

        results.forEach(result => {
            if(result.items) {
                todasNoticias = todasNoticias.concat(result.items);
            }
        });

        // Remove duplicatas por link
        const noticiasUnicas = todasNoticias.filter((item, index, self) =>
            index === self.findIndex((t) => (
                t.link === item.link
            ))
        );

        // Ordena por data (mais recente primeiro)
        noticiasUnicas.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

        if (noticiasUnicas.length > 0) {
            noticiasUnicas.forEach(item => {
                // Limpeza do título (remove source do final se houver)
                let manchete = item.title.split(' - ')[0]; 
                
                // Identifica fonte para tag visual
                let fonte = 'Agro';
                if (item.link.includes('gazetadopovo')) fonte = 'Gazeta do Povo';
                else if (item.link.includes('comprerural')) fonte = 'Compre Rural';
                else if (item.link.includes('noticiasagricolas')) fonte = 'Notícias Agrícolas';

                // Formata Data
                let dateObj = new Date(item.pubDate);
                let locale = 'pt-BR';
                if(currentLang === 'en') locale = 'en-US';
                if(currentLang === 'es') locale = 'es-ES';
                
                let dataPub = dateObj.toLocaleDateString(locale, { day: 'numeric', month: 'long', hour: '2-digit', minute:'2-digit' });
                const normalizedUrl = normalizeNewsUrl(item.link);
                if (!normalizedUrl) {
                    return;
                }

                const anchor = document.createElement('a');
                anchor.href = normalizedUrl;
                anchor.target = '_blank';
                anchor.rel = 'noopener noreferrer';
                anchor.className = 'news-link-wrapper';

                const article = document.createElement('article');
                article.className = 'news-item';

                const meta = document.createElement('div');
                meta.className = 'news-meta';
                const sourceTag = document.createElement('span');
                sourceTag.className = 'source-tag';
                sourceTag.textContent = fonte;
                const dateTag = document.createElement('span');
                dateTag.className = 'news-date';
                dateTag.textContent = dataPub;
                meta.appendChild(sourceTag);
                meta.appendChild(dateTag);

                const title = document.createElement('h3');
                title.className = 'news-title';
                title.textContent = manchete;

                const arrowWrap = document.createElement('div');
                arrowWrap.className = 'news-arrow';
                const arrowIcon = document.createElement('i');
                arrowIcon.className = 'fas fa-arrow-right';
                arrowWrap.appendChild(arrowIcon);

                article.appendChild(meta);
                article.appendChild(title);
                article.appendChild(arrowWrap);
                anchor.appendChild(article);
                container.appendChild(anchor);
            });
        } else {
            const noNewsText = translations[currentLang]['no_news'] || 'Nenhuma notícia encontrada.';
            container.innerHTML = `<div class="loading-container">${noNewsText}</div>`;
        }
    })
    .catch(error => {
        console.error('Erro ao carregar notícias:', error);
        const errorText = translations[currentLang]['error_news'] || 'Não foi possível carregar as notícias.';
        container.innerHTML = `<div class="loading-container">${errorText}</div>`;
    });
}

function normalizeNewsUrl(value) {
    const url = String(value || '').trim();
    if (!/^https?:\/\//i.test(url)) {
        return null;
    }
    return url;
}


// =========================================
// CONTACT PAGE FUNCTIONALITY
// =========================================

// Dados de Estados Brasileiros (Manual)
const estadosBR = [
    {sigla:'AC', nome:'Acre'}, {sigla:'AL', nome:'Alagoas'}, {sigla:'AP', nome:'Amapá'},
    {sigla:'AM', nome:'Amazonas'}, {sigla:'BA', nome:'Bahia'}, {sigla:'CE', nome:'Ceará'},
    {sigla:'DF', nome:'Distrito Federal'}, {sigla:'ES', nome:'Espírito Santo'},
    {sigla:'GO', nome:'Goiás'}, {sigla:'MA', nome:'Maranhão'}, {sigla:'MT', nome:'Mato Grosso'},
    {sigla:'MS', nome:'Mato Grosso do Sul'}, {sigla:'MG', nome:'Minas Gerais'},
    {sigla:'PA', nome:'Pará'}, {sigla:'PB', nome:'Paraíba'}, {sigla:'PR', nome:'Paraná'},
    {sigla:'PE', nome:'Pernambuco'}, {sigla:'PI', nome:'Piauí'}, {sigla:'RJ', nome:'Rio de Janeiro'},
    {sigla:'RN', nome:'Rio Grande do Norte'}, {sigla:'RS', nome:'Rio Grande do Sul'},
    {sigla:'RO', nome:'Rondônia'}, {sigla:'RR', nome:'Roraima'}, {sigla:'SC', nome:'Santa Catarina'},
    {sigla:'SP', nome:'São Paulo'}, {sigla:'SE', nome:'Sergipe'}, {sigla:'TO', nome:'Tocantins'}
];

const paisesLatam = [
    "Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Cuba", "Dominican Republic",
    "Ecuador", "El Salvador", "Guatemala", "Honduras", "Mexico", "Nicaragua", "Panama",
    "Paraguay", "Peru", "Uruguay", "Venezuela"
];

function initContactPage() {
    const selectEstado = document.getElementById('estado');
    const selectPais = document.getElementById('pais');
    const freestyleCheck = document.getElementById('freestyle-check');

    // 1. Listener para Estado mudando -> Carrega Cidades
    if(selectEstado) {
        selectEstado.addEventListener('change', function() {
            const estadoVal = this.value;
            // Só carrega cidades se NÃO estiver no modo freestyle
            if (!freestyleCheck || !freestyleCheck.checked) {
                if(currentLang === 'pt') {
                    // API IBGE
                    fetchIBGECities(estadoVal);
                } else if (currentLang === 'en') {
                    // API CountriesNow (USA States -> Cities)
                    fetchExternalCities("United States", estadoVal);
                } else if (currentLang === 'es' && selectPais) {
                    // API CountriesNow (Latam Country -> State -> Cities)
                    fetchExternalCities(selectPais.value, estadoVal);
                }
            }
        });
    }

    // 2. Listener para País mudando (Espanhol) -> Carrega Estados
    if(selectPais) {
        selectPais.addEventListener('change', function() {
            if(currentLang === 'es' && (!freestyleCheck || !freestyleCheck.checked)) {
                fetchExternalStates(this.value);
                // Reseta cidade
                const cid = document.getElementById('cidade');
                if(cid) {
                    const txtFirst = translations[currentLang]['form_select_state_first'] || 'Selecione um estado primeiro';
                    cid.innerHTML = `<option value="" disabled selected>${txtFirst}</option>`;
                    cid.disabled = true;
                }
            }
        });
    }

    // 3. Listener para Checkbox Freestyle
    if(freestyleCheck) {
        freestyleCheck.addEventListener('change', function() {
            toggleFreestyleMode(this.checked);
        });
        
        // Inicializa o estado correto baseado se já vem marcado ou não
        toggleFreestyleMode(freestyleCheck.checked);
    }

    // 4. Carrega os dados iniciais corretos
    handleContactLanguageChange();
}

function toggleFreestyleMode(isFreestyle) {
    const selects = ['pais', 'estado', 'cidade'];
    const inputs = ['pais-input', 'estado-input', 'cidade-input'];
    const rowPais = document.getElementById('row-pais');

    if (isFreestyle) {
        // MODO MANUAL: Esconde Selects, Mostra Inputs de Texto
        selects.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.style.display = 'none';
                el.removeAttribute('required');
            }
        });
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.style.display = 'block';
                el.setAttribute('required', 'true');
            }
        });
        // No modo manual, sempre mostra o campo País para a pessoa digitar
        if(rowPais) rowPais.style.display = 'block';

    } else {
        // MODO AUTOMÁTICO: Mostra Selects, Esconde Inputs
        selects.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.style.display = 'block';
                el.setAttribute('required', 'true');
            }
        });
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.style.display = 'none';
                el.removeAttribute('required');
            }
        });
        
        // Recalcula visibilidade do Select de País baseado no idioma
        handleContactLanguageChange();
    }
}

function handleContactLanguageChange() {
    const rowPais = document.getElementById('row-pais');
    const selectEstado = document.getElementById('estado');
    const selectPais = document.getElementById('pais');
    const selectCidade = document.getElementById('cidade');
    const freestyleCheck = document.getElementById('freestyle-check');

    const txtSelect = translations[currentLang]['form_select_default'] || 'Selecione';
    const txtFirst = translations[currentLang]['form_select_state_first'] || 'Selecione um estado primeiro';

    // Se estiver em modo manual, não mexe nos selects (deixa o usuário digitar)
    if (freestyleCheck && freestyleCheck.checked) return;

    // Reseta selects básicos
    if(selectEstado) selectEstado.innerHTML = `<option value="" disabled selected>${txtSelect}</option>`;
    if(selectCidade) {
        selectCidade.innerHTML = `<option value="" disabled selected>${txtFirst}</option>`;
        selectCidade.disabled = true;
    }

    if (currentLang === 'pt') {
        // PT: Brasil implícito, esconde país, carrega estados BR
        if(rowPais) rowPais.style.display = 'none';
        
        if(selectEstado) {
            estadosBR.forEach(est => {
                const opt = document.createElement('option');
                opt.value = est.sigla;
                opt.textContent = est.nome;
                selectEstado.appendChild(opt);
            });
        }
        
    } else if (currentLang === 'en') {
        // EN: EUA implícito, esconde país, carrega estados EUA (API)
        if(rowPais) rowPais.style.display = 'none';
        
        if(selectEstado) {
            fetchExternalStates("United States");
        }

    } else if (currentLang === 'es') {
        // ES: Mostra seletor de países LATAM
        if(rowPais) rowPais.style.display = 'block';
        
        if(selectPais) {
            selectPais.innerHTML = `<option value="" disabled selected>${txtSelect}</option>`;
            paisesLatam.forEach(pais => {
                const opt = document.createElement('option');
                opt.value = pais;
                opt.textContent = pais;
                selectPais.appendChild(opt);
            });
        }
        // Em ES, estado fica bloqueado até escolher país
        if(selectEstado) {
            selectEstado.innerHTML = `<option value="" disabled selected>${translations[currentLang]['form_select_default']}</option>`;
        }
    }
}


// API Helper Functions

async function fetchExternalStates(countryName) {
    const selectEstado = document.getElementById('estado');
    if(!selectEstado) return;

    selectEstado.innerHTML = `<option>Loading...</option>`;

    try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ country: countryName }),
        });
        const data = await response.json();
        
        const txtSelect = translations[currentLang]['form_select_default'] || 'Select';
        selectEstado.innerHTML = `<option value="" disabled selected>${txtSelect}</option>`;

        if(!data.error && data.data.states) {
            data.data.states.forEach(state => {
                const opt = document.createElement('option');
                opt.value = state.name;
                opt.textContent = state.name;
                selectEstado.appendChild(opt);
            });
        }
    } catch (e) {
        console.error(e);
        selectEstado.innerHTML = `<option>Error loading</option>`;
    }
}

async function fetchExternalCities(countryName, stateName) {
    const selectCidade = document.getElementById('cidade');
    if(!selectCidade) return;

    const loadingTxt = translations[currentLang]['loading'] || '...';
    selectCidade.innerHTML = `<option>${loadingTxt}</option>`;

    try {
        const response = await fetch('https://countriesnow.space/api/v0.1/countries/state/cities', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ country: countryName, state: stateName }),
        });
        const data = await response.json();
        
        const txtSelect = translations[currentLang]['form_select_default'] || 'Select';
        selectCidade.innerHTML = `<option value="" disabled selected>${txtSelect}</option>`;
        selectCidade.disabled = false;

        if(!data.error && data.data) {
            data.data.forEach(city => {
                const opt = document.createElement('option');
                opt.value = city;
                opt.textContent = city;
                selectCidade.appendChild(opt);
            });
        }
    } catch (e) {
        console.error(e);
        selectCidade.innerHTML = `<option>Error loading</option>`;
    }
}

function fetchIBGECities(uf) {
    const selectCidade = document.getElementById('cidade');
    if(!selectCidade) return;

    const loadingTxt = translations[currentLang]['loading'] || '...';
    selectCidade.innerHTML = `<option>${loadingTxt}</option>`;

    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
        .then(r => r.json())
        .then(cidades => {
            const txtSelect = translations[currentLang]['form_select_default'] || 'Selecione';
            selectCidade.innerHTML = `<option value="" disabled selected>${txtSelect}</option>`;
            
            selectCidade.disabled = false;
            cidades.sort((a, b) => a.nome.localeCompare(b.nome));
            cidades.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.nome; opt.textContent = c.nome;
                selectCidade.appendChild(opt);
            });
        });
}

function initDonationPage() {
    window.selectCard = function(card) {
        const cards = document.querySelectorAll('.donation-card');
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const input = card.querySelector('input');
        if(input) input.focus();
    };

    window.switchTab = function(type, btn) {
        const buttons = document.querySelectorAll('.tab-btn');
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Lógica de trocar conteúdo das abas se necessário
        // Por enquanto é visual
    };
}






