(function () {
    const API_URL = 'server/php/posted_jobs.php';

    function escapeHtml(value = '') {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    let postedJobsCache = [];

    function safeParseJson(value, fallback = null) {
        try {
            return JSON.parse(value);
        } catch (error) {
            return fallback;
        }
    }

    function flattenJobsData(rawData) {
        if (!rawData) {
            return [];
        }

        if (Array.isArray(rawData)) {
            return rawData;
        }

        if (typeof rawData === 'object') {
            return Object.keys(rawData).reduce((all, dateKey) => {
                const jobs = Array.isArray(rawData[dateKey]) ? rawData[dateKey] : [];
                return all.concat(jobs);
            }, []);
        }

        return [];
    }

    function cacheJobs(jobs) {
        postedJobsCache = Array.isArray(jobs) ? jobs : [];
    }

    function renderPostedJobs() {
        const grid = document.getElementById('postedJobsGrid');
        if (!grid) {
            return;
        }

        const jobs = postedJobsCache;

        if (!jobs.length) {
            grid.innerHTML = '<div class="posted-jobs-empty">No posted jobs available right now.</div>';
            return;
        }

        grid.innerHTML = jobs.map(job => `
            <article class="posted-job-card">
                <h3>${escapeHtml(job.title)}</h3>
                <p class="posted-job-meta"><strong>Company:</strong> ${escapeHtml(job.company)}</p>
                <p class="posted-job-meta"><strong>Location:</strong> ${escapeHtml(job.location)}</p>
                <div class="posted-job-actions">
                    <button class="posted-job-action applicants" type="button">View Applicants</button>
                </div>
            </article>
        `).join('');
    }

    function syncJobBoardView() {
        const selector = document.getElementById('postedJobsFilter');
        const postedPanel = document.getElementById('postedJobsPanel');
        const aiSection = document.querySelector('.ai-recommendations');
        const aiInsights = document.querySelector('.career-insights');

        if (!selector || !postedPanel) {
            return;
        }

        const showPostedJobs = selector.value === 'posted';
        postedPanel.hidden = !showPostedJobs;

        if (aiSection) {
            aiSection.hidden = showPostedJobs;
        }

        if (aiInsights) {
            aiInsights.hidden = showPostedJobs;
        }

        if (showPostedJobs) {
            renderPostedJobs();
        }
    }

    async function loadPostedJobs() {
        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                cache: 'no-cache'
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.success && Array.isArray(data.jobs)) {
                    cacheJobs(data.jobs);
                    return;
                }
            }
        } catch (error) {
            console.warn('Posted jobs fetch failed:', error);
        }

        cacheJobs([]);
    }

    document.addEventListener('DOMContentLoaded', async function () {
        await loadPostedJobs();
        renderPostedJobs();

        const selector = document.getElementById('postedJobsFilter');
        if (selector) {
            selector.addEventListener('change', syncJobBoardView);
            syncJobBoardView();
        }

    });
})();
