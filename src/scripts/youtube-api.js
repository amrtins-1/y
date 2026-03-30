// public/scripts/youtube-api.js
const YOUTUBE_API_KEY = 'AIzaSyDKD7C82V1PesBiiw5DaYvtAthjxfYfopk'; // Recomendo ocultar isso depois
const CHANNEL_ID = 'UCLTWPE7XrHEe8m_xAmNbQ-Q';
const MAX_RESULTS = 40;

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function safeUrl(url) {
    const value = String(url || '').trim();
    if (/^https?:\/\//i.test(value)) {
        return value;
    }
    return '';
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    const days = Math.floor(diff / 86400);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (days === 0) return 'lançado hoje';
    
    let timeText = '';
    if (years > 0) timeText = `${years} ${years > 1 ? 'anos' : 'ano'}`;
    else if (months > 0) timeText = `${months} ${months > 1 ? 'meses' : 'mês'}`;
    else timeText = `${days} ${days > 1 ? 'dias' : 'dia'}`;
    
    return `lançado há ${timeText}`;
}

function createVideoCard(video) {
    const videoUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId || '')}`;
    const thumbnail = safeUrl(video.thumbnail);
    const title = escapeHtml(video.title);
    return `
        <div class="video-card" onclick="window.open('${videoUrl}', '_blank')">
            <div class="video-thumbnail">
                <img src="${thumbnail}" alt="${title}" loading="lazy">
                <div class="video-overlay">
                    <div class="play-button"><i class="fab fa-youtube"></i></div>
                </div>
            </div>
            <div class="video-info">
                <span class="video-tag">ANCAPSU</span>
                <h3 class="video-title">${title}</h3>
                <div class="video-meta">
                    <span><i class="fas fa-calendar"></i>${formatRelativeTime(video.publishedAt)}</span>
                </div>
            </div>
        </div>
    `;
}

// ... restante das suas funções (createVideoCard, etc)

async function fetchChannelVideos() {
    const container = document.getElementById('video-container');
    if (!container) return; // Segurança caso o elemento não exista

    try {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${CHANNEL_ID}&part=snippet,id&order=date&maxResults=${MAX_RESULTS}&type=video`;
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
             const errorData = await response.json();
             console.error("Erro na API do YouTube:", errorData);
             throw new Error("Falha na resposta da API");
        }

        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            container.innerHTML = `<p>Nenhum vídeo encontrado.</p>`;
            return;
        }

        const videoGrid = data.items
            .filter(item => item.id.videoId) // Garante que é um vídeo
            .map(item => {
                const video = {
                    videoId: item.id.videoId,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
                    publishedAt: item.snippet.publishedAt
                };
                return createVideoCard(video);
            }).join('');

        container.innerHTML = `<div class="video-grid">${videoGrid}</div>`;
        
        // Se tiver tradução dinâmica:
        if (typeof setLanguage === 'function') {
            setLanguage(localStorage.getItem('preferredLang') || 'pt');
        }

    } catch (error) {
        console.error('Erro detalhado:', error);
        container.innerHTML = `<p class="error">Erro ao carregar vídeos. Verifique a consola do navegador.</p>`;
    }
}

// Execução imediata e segura
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchChannelVideos);
} else {
    fetchChannelVideos();
}
